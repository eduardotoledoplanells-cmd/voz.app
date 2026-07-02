import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { decryptKYC } from '@/lib/kycCrypto';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'userId es requerido' }, { status: 400 });
        }

        // 1. Check app_users first for Stripe Connect status
        const { data: user, error: userError } = await supabase
            .from('app_users')
            .select('stripe_account_id, stripe_onboarding_complete')
            .eq('id', userId)
            .single();

        if (!userError && user) {
            if (user.stripe_onboarding_complete) {
                return NextResponse.json({
                    success: true,
                    verification: {
                        status: 'approved',
                        stripe_account_id: user.stripe_account_id
                    }
                });
            } else if (user.stripe_account_id) {
                return NextResponse.json({
                    success: true,
                    verification: {
                        status: 'pending',
                        stripe_account_id: user.stripe_account_id
                    }
                });
            }
        }

        // 2. Fallback to legacy creator_verifications
        const { data, error } = await supabase
            .from('creator_verifications')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('[CREATOR_STATUS] DB Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Decrypt sensitive fields before returning to client
        if (data) {
            try {
                data.dni_number = decryptKYC(data.dni_number);
                data.iban = decryptKYC(data.iban);
            } catch (decryptError) {
                console.warn("[CREATOR_STATUS] Decryption failed for legacy verification:", decryptError);
            }
            return NextResponse.json({ success: true, verification: data });
        }

        return NextResponse.json({ success: true, verification: null });
    } catch (error: any) {
        console.error('[CREATOR_STATUS] Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
