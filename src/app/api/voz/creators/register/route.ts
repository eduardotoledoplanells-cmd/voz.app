import { NextResponse } from 'next/server';
import { supabaseAdmin, updateAppUser } from '@/lib/db';

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
            iban, 
            address, 
            postalCode, 
            country,
            phone
        } = body;

        if (!userId || !fullName || !dniNumber || !iban || !phone) {
            console.warn("[CREATOR_REGISTER] Validation failed. Missing fields:", { userId, fullName, dniNumber, iban, phone });
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios (nombre, dni, iban o teléfono)' }, { status: 400 });
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
