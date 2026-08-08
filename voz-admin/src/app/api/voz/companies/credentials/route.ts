import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyId, email, password } = body;

        if (!companyId || !email || !password) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // We use supabaseAdmin to create a user in Supabase Auth bypassing standard signup
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'Advertiser',
                companyId: companyId
            }
        });

        if (authError) {
            console.error('Error creando usuario en Auth:', authError);
            return NextResponse.json({ error: authError.message || 'Error al crear credenciales' }, { status: 500 });
        }

        // Note: we don't necessarily need to store this back in the `companies` table if we don't have the column,
        // because we can always query auth users or just rely on the user_metadata to know who they are when they login.
        // However, updating the contact_email in companies can be useful.
        await supabaseAdmin.from('companies').update({ contact_email: email }).eq('id', companyId);

        return NextResponse.json({ success: true, message: 'Credenciales creadas con éxito' });
    } catch (error) {
        console.error('Error general en credentials API:', error);
        return NextResponse.json({ error: 'Ocurrió un error inesperado' }, { status: 500 });
    }
}
