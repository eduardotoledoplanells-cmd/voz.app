import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/auth';
import { supabaseAdmin, addNotification, addLog } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Validate employee authentication (requires at least Moderator role = 0)
        const auth = await validateEmployee(request, 0);
        if (!auth.isValid || !auth.employee) {
            return NextResponse.json({ success: false, error: auth.errorText || 'No autorizado' }, { status: auth.errorStatus || 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios (id o status).' }, { status: 400 });
        }

        if (status !== 'approved' && status !== 'rejected') {
            return NextResponse.json({ success: false, error: 'El estado debe ser approved o rejected.' }, { status: 400 });
        }

        // 1. Fetch current request to get user and amount
        const { data: withdrawal, error: fetchError } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !withdrawal) {
            return NextResponse.json({ success: false, error: 'Solicitud de cobro no encontrada.' }, { status: 404 });
        }

        // Prevent processing if already completed/rejected
        if (withdrawal.status !== 'pending' && withdrawal.status !== 'employee_approved' && withdrawal.status !== 'director_approved') {
            return NextResponse.json({ success: false, error: 'La solicitud ya ha sido procesada previamente.' }, { status: 400 });
        }

        const amount = Number(withdrawal.amount);
        const requiresDualApproval = amount > 1000;
        const isDirector = auth.employee.role === 1;

        let newStatus = status;
        let detailsUpdate = { ...(withdrawal.details || {}) };
        let settleLedger = false;
        let customMessage = `Cobro procesado como ${status} correctamente.`;

        if (status === 'rejected') {
            // Rejection is immediate and doesn't require dual approval
            newStatus = 'rejected';
            settleLedger = true;
        } else if (status === 'approved') {
            if (requiresDualApproval) {
                if (isDirector) {
                    detailsUpdate.approved_by_director = auth.employee.username;
                    detailsUpdate.approved_by_director_id = auth.employee.id;

                    if (withdrawal.status === 'employee_approved' || detailsUpdate.approved_by_employee_id) {
                        // Dual approval satisfied!
                        newStatus = 'approved';
                        settleLedger = true;
                    } else {
                        // Director approved first, still needs employee request
                        newStatus = 'director_approved';
                        settleLedger = false;
                        customMessage = 'Aprobado por el Director. Requiere confirmación de un empleado antes de liquidarse (Dual Approval).';
                    }
                } else {
                    // Normal employee/moderator
                    detailsUpdate.approved_by_employee = auth.employee.username;
                    detailsUpdate.approved_by_employee_id = auth.employee.id;

                    if (withdrawal.status === 'director_approved' || detailsUpdate.approved_by_director_id) {
                        // Dual approval satisfied!
                        newStatus = 'approved';
                        settleLedger = true;
                    } else {
                        // Employee approved, still needs Director approval
                        newStatus = 'employee_approved';
                        settleLedger = false;
                        customMessage = 'Solicitud de retiro registrada por el empleado. Requiere la aprobación final de un Director (Dual Approval).';
                    }
                }
            } else {
                // <= 1000 can be approved by anyone immediately
                newStatus = 'approved';
                settleLedger = true;
            }
        }

        const amountMicro = Math.round(amount * 1000);
        const userWalletId = await getOrCreateUserWallet(withdrawal.user_id);
        const idempotencyKey = `withdrawal-settle-${id}-${newStatus}`;

        if (settleLedger) {
            if (newStatus === 'rejected') {
                // REJECTED: Refund user's pending balance
                try {
                    await executeLedgerTransaction(
                        'WITHDRAWAL_REFUND',
                        [
                            {
                                wallet_id: userWalletId,
                                entry_type: 'PENDING',
                                amount: amountMicro
                            },
                            {
                                wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id,
                                entry_type: 'AVAILABLE',
                                amount: -amountMicro
                            }
                        ],
                        id,
                        idempotencyKey,
                        { reason: 'Withdrawal request rejected by administrator' }
                    );
                } catch (ledgerError: any) {
                    console.error('[LEDGER] Refund transaction failed:', ledgerError);
                    return NextResponse.json({ success: false, error: `Error en la devolución contable: ${ledgerError.message}` }, { status: 500 });
                }
            } else if (newStatus === 'approved') {
                // APPROVED: Settle the withdrawal, coins leave the system (burned)
                try {
                    await executeLedgerTransaction(
                        'WITHDRAWAL_SETTLE',
                        [
                            {
                                wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id,
                                entry_type: 'AVAILABLE',
                                amount: -amountMicro
                            },
                            {
                                wallet_id: SYSTEM_WALLETS.MINT.id,
                                entry_type: 'AVAILABLE',
                                amount: amountMicro
                            }
                        ],
                        id,
                        idempotencyKey,
                        { reason: 'Withdrawal request approved and processed via Dual Approval' }
                    );
                } catch (ledgerError: any) {
                    console.error('[LEDGER] Settle transaction failed:', ledgerError);
                    return NextResponse.json({ success: false, error: `Error en la liquidación contable: ${ledgerError.message}` }, { status: 500 });
                }
            }
        }

        // 2. Update withdrawal request status in DB
        const { error: updateExtError } = await supabaseAdmin
            .from('withdrawal_requests')
            .update({ 
                status: newStatus,
                details: detailsUpdate,
                processed_at: newStatus === 'approved' || newStatus === 'rejected' ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (updateExtError) {
            console.error('Error updating withdrawal request status:', updateExtError);
        }

        // 3. Save internal audit log
        await addLog({
            id: 'log-' + Date.now(),
            employeeName: `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`,
            action: `PROCESS_WITHDRAWAL_${newStatus.toUpperCase()}`,
            timestamp: new Date().toISOString(),
            details: `Cobro ID: ${id}, Usuario: ${withdrawal.user_handle}, Cantidad: ${withdrawal.amount} €, Estado final: ${newStatus}`
        });

        // 4. Send Notification to User (Only if finalized or rejected)
        if (newStatus === 'approved' || newStatus === 'rejected') {
            const notifTitle = newStatus === 'approved' ? '¡Retiro Aprobado!' : 'Retiro Rechazado';
            const notifMessage = newStatus === 'approved' 
                ? `Tu solicitud de retiro de ${withdrawal.amount} € ha sido aprobada. El dinero llegará pronto a tu cuenta.` 
                : `Tu solicitud de retiro de ${withdrawal.amount} € ha sido rechazada. Las monedas han sido devueltas a tu cartera.`;

            await addNotification({
                id: Date.now().toString(),
                recipientId: withdrawal.user_handle,
                type: 'billing',
                title: notifTitle,
                message: notifMessage,
                timestamp: new Date().toISOString(),
                readStatus: false
            });
        }

        return NextResponse.json({ success: true, message: customMessage, status: newStatus });

    } catch (e: any) {
        console.error('API approve-withdrawal error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error interno al liquidar cobro.' }, { status: 500 });
    }
}
