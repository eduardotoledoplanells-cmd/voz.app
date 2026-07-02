const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const API_BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting Automated API Integration Tests...');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.error('❌ Error: Supabase URL or Service Role Key missing in .env.local');
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey);

    // 1. Get an existing user for testing
    console.log('🔍 Fetching an existing user from app_users...');
    const { data: users, error: userError } = await supabase.from('app_users').select('id, handle').limit(1);
    if (userError || !users || users.length === 0) {
        console.error('❌ Error fetching user:', userError || 'No users found in database');
        process.exit(1);
    }
    const testUser = users[0];
    console.log(`👤 Using test user: id="${testUser.id}", handle="${testUser.handle}"`);

    let dummyModId = null;
    let dummyNotificationId = null;
    let dummyTxId = null;
    const testPaymentIntentId = `pi_test_${Date.now()}`;

    try {
        // ==========================================
        // TEST 1: PATCH Moderation + Notification
        // ==========================================
        console.log('\n--- TEST 1: PATCH Moderation & Notifications ---');

        // Insert a dummy moderation item
        console.log('📥 Inserting dummy moderation item...');
        const { data: modItem, error: modInsertError } = await supabase.from('moderation_queue').insert([{
            type: 'video',
            url: 'https://example.com/test-video.mp4',
            user_handle: testUser.handle,
            content: 'Test video content',
            report_reason: 'Testing moderation patch API',
            status: 'pending'
        }]).select().single();

        if (modInsertError || !modItem) {
            throw new Error(`Failed to insert moderation item: ${modInsertError?.message}`);
        }
        dummyModId = modItem.id;
        console.log(`✅ Dummy moderation item inserted with ID: "${dummyModId}"`);

        // Trigger the PATCH /api/voz/moderation endpoint
        console.log(`📤 Sending PATCH /api/voz/moderation for ID "${dummyModId}"...`);
        const patchRes = await fetch(`${API_BASE_URL}/api/voz/moderation`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: dummyModId,
                status: 'rejected',
                employeeName: '@test_admin'
            })
        });

        const patchData = await patchRes.json();
        console.log('📥 PATCH Response status:', patchRes.status);
        console.log('📥 PATCH Response body:', JSON.stringify(patchData, null, 2));

        if (patchRes.status !== 200 || !patchData.success) {
            throw new Error(`PATCH moderation failed: ${JSON.stringify(patchData)}`);
        }

        // Verify status updated in DB
        console.log('🔍 Checking moderation item status in database...');
        const { data: updatedMod, error: modQueryError } = await supabase
            .from('moderation_queue')
            .select('status')
            .eq('id', dummyModId)
            .single();

        if (modQueryError || !updatedMod) {
            throw new Error(`Failed to query updated moderation item: ${modQueryError?.message}`);
        }

        if (updatedMod.status !== 'rejected') {
            throw new Error(`Expected status to be "rejected", got "${updatedMod.status}"`);
        }
        console.log('✅ Status successfully updated to "rejected" in DB');

        // Verify notification created
        console.log('🔍 Checking if notification was created for user...');
        const cleanHandle = testUser.handle.startsWith('@') ? testUser.handle : `@${testUser.handle}`;
        const rawHandle = cleanHandle.replace('@', '');
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('id, recipient_id, type, title')
            .or(`recipient_id.eq.${cleanHandle},recipient_id.eq.${rawHandle}`)
            .order('timestamp', { ascending: false })
            .limit(5);

        if (notifError) {
            throw new Error(`Failed to query notifications: ${notifError.message}`);
        }

        const foundNotif = notifications.find(n => n.type === 'moderation' && n.title.includes('Contenido eliminado'));
        if (!foundNotif) {
            throw new Error('Moderation notification was not found in the notifications table');
        }
        dummyNotificationId = foundNotif.id;
        console.log(`✅ Notification successfully found! ID: "${dummyNotificationId}"`);


        // ==========================================
        // TEST 2: Stripe Purchase Idempotency
        // ==========================================
        console.log('\n--- TEST 2: Stripe Purchase Idempotency ---');

        // Insert a dummy transaction into ledger_transactions
        console.log(`📥 Inserting dummy transaction with idempotency key "${testPaymentIntentId}"...`);
        const { data: txRecord, error: txInsertError } = await supabase.from('ledger_transactions').insert([{
            type: 'coin_purchase',
            status: 'COMPLETED',
            total_amount: 0,
            idempotency_key: testPaymentIntentId
        }]).select().single();

        if (txInsertError || !txRecord) {
            throw new Error(`Failed to insert ledger transaction: ${txInsertError?.message}`);
        }
        dummyTxId = txRecord.id;
        console.log(`✅ Dummy transaction inserted with ID: "${dummyTxId}"`);

        // Trigger POST /api/voz/purchase with the same paymentIntentId
        console.log('📤 Sending POST /api/voz/purchase to simulate duplicate payment call...');
        const purchaseRes = await fetch(`${API_BASE_URL}/api/voz/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: testUser.id,
                packId: 'p2',
                amount: 10,
                paymentIntentId: testPaymentIntentId
            })
        });

        const purchaseData = await purchaseRes.json();
        console.log('📥 Purchase Response status:', purchaseRes.status);
        console.log('📥 Purchase Response body:', JSON.stringify(purchaseData, null, 2));

        if (purchaseRes.status !== 200 || !purchaseData.success) {
            throw new Error(`Purchase endpoint failed: ${JSON.stringify(purchaseData)}`);
        }

        if (!purchaseData.alreadyProcessed) {
            throw new Error('Expected "alreadyProcessed" to be true, but it was false/undefined');
        }
        console.log('✅ Idempotency check works! Endpoint returned success & alreadyProcessed: true.');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('\n❌ Test execution failed:', err.message);
        process.exit(1);
    } finally {
        // Cleanup DB entries
        console.log('\n🧹 Cleaning up test database entries...');

        if (dummyModId) {
            console.log(`   Deleting moderation item: "${dummyModId}"...`);
            await supabase.from('moderation_queue').delete().eq('id', dummyModId);
        }
        if (dummyNotificationId) {
            console.log(`   Deleting notification: "${dummyNotificationId}"...`);
            await supabase.from('notifications').delete().eq('id', dummyNotificationId);
        }
        if (dummyTxId) {
            console.log(`   Deleting ledger transaction: "${dummyTxId}"...`);
            await supabase.from('ledger_transactions').delete().eq('id', dummyTxId);
        }

        console.log('✨ Cleanup complete.');
    }
}

runTests();
