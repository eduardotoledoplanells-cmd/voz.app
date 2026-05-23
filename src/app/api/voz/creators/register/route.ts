import { NextResponse } from 'next/server';
import { supabaseAdmin, updateAppUser } from '@/lib/db';
import { encryptKYC, computeBlindIndex } from '@/lib/kycCrypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("[CREATOR_REGISTER] Body received:", JSON.stringify(body, null, 2));
        
        const { 
            userId, 
            fullName, 
            dniNumber, 
            dniFrontUrl, 
            dniBackUrl, 
            bankVerificationUrl,
            iban, 
            address, 
            postalCode, 
            country,
            phone
        } = body;

        if (!userId || !fullName || !dniNumber || !iban || !phone || !bankVerificationUrl) {
            console.warn("[CREATOR_REGISTER] Validation failed. Missing fields:", { userId, fullName, dniNumber, iban, phone, bankVerificationUrl });
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios (nombre, DNI, IBAN, teléfono o certificado bancario)' }, { status: 400 });
        }

        const dniHash = computeBlindIndex(dniNumber);
        const ibanHash = computeBlindIndex(iban);

        // Encrypt sensitive data before persistence
        const encryptedDni = encryptKYC(dniNumber);
        const encryptedIban = encryptKYC(iban);

        // Check if IBAN is already in use by another creator (anti-fraud check)
        const { data: existingIban, error: lookupError } = await supabaseAdmin
            .from('creator_verifications')
            .select('user_id')
            .eq('iban_hash', ibanHash)
            .neq('user_id', userId)
            .maybeSingle();

        if (lookupError) {
            console.error('[CREATOR_REGISTER] IBAN lookup error:', lookupError);
        }

        if (existingIban) {
            return NextResponse.json({ 
                success: false, 
                error: 'Este número de cuenta bancaria (IBAN) ya está registrado en otra solicitud de creador.' 
            }, { status: 400 });
        }

        // Upsert the verification data including hashes and encrypted fields
        const { data, error } = await supabaseAdmin
            .from('creator_verifications')
            .upsert([{
                user_id: userId,
                full_name: fullName,
                dni_number: encryptedDni,
                dni_hash: dniHash,
                dni_front_url: dniFrontUrl,
                dni_back_url: dniBackUrl,
                bank_verification_url: bankVerificationUrl,
                iban: encryptedIban,
                iban_hash: ibanHash,
                address: address,
                postal_code: postalCode,
                country: country,
                phone: phone,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }], { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('[CREATOR_REGISTER] DB Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Sync phone to app_users table for main profile visibility
        try {
            await updateAppUser(userId, { phone });
        } catch (syncError) {
            console.warn("[CREATOR_REGISTER] Failed to sync phone to app_users table:", syncError);
        }

        return NextResponse.json({ success: true, verification: data });
    } catch (error: any) {
        console.error('[CREATOR_REGISTER] Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
