import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            userId, 
            fullName, 
            dniNumber, 
            dniFrontUrl, 
            dniBackUrl, 
            iban, 
            address, 
            postalCode, 
            country 
        } = body;

        if (!userId || !fullName || !dniNumber || !iban) {
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Upsert the verification data
        const { data, error } = await supabaseAdmin
            .from('creator_verifications')
            .upsert([{
                user_id: userId,
                full_name: fullName,
                dni_number: dniNumber,
                dni_front_url: dniFrontUrl,
                dni_back_url: dniBackUrl,
                iban: iban,
                address: address,
                postal_code: postalCode,
                country: country,
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

        return NextResponse.json({ success: true, verification: data });
    } catch (error: any) {
        console.error('[CREATOR_REGISTER] Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
