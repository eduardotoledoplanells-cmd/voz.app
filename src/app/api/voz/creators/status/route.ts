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
            data.dni_number = decryptKYC(data.dni_number);
            data.iban = decryptKYC(data.iban);
        }

        return NextResponse.json({ success: true, verification: data || null });
    } catch (error: any) {
        console.error('[CREATOR_STATUS] Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
