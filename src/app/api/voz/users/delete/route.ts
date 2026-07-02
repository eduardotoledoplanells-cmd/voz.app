import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        // 1. Get user to ensure they exist
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('app_users')
            .select('id, handle')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 2. Perform Soft Delete (Anonymize)
        // We change the handle to something random so the original handle is released
        // We change email to avoid conflicts and protect privacy
        const deletedId = userId.substring(0, 8);
        const anonymizedHandle = `@deleted_${deletedId}`;
        const anonymizedEmail = `deleted_${deletedId}@appvoz.com`;

        const { error: updateError } = await supabaseAdmin
            .from('app_users')
            .update({
                handle: anonymizedHandle,
                email: anonymizedEmail,
                name: 'Usuario Eliminado',
                bio: 'Esta cuenta ha sido eliminada por el usuario.',
                profile_image: null,
                status: 'deleted',
                is_creator: false,
                wallet_balance: 0,
                earnings_balance: 0
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. Optional: Delete their videos or mark them as hidden
        // For now, we'll just keep them but the profile is "gone"
        await supabaseAdmin
            .from('videos')
            .update({ status: 'hidden' })
            .eq('user_id', userId);

        return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } catch (e: any) {
        console.error('Error deleting account:', e);
        return NextResponse.json({ success: false, error: e.message || 'Failed to delete account' }, { status: 500 });
    }
}
