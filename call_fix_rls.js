const ADMIN_SECRET = 'VOZ_SEC_KEY_2026_ADMPNL_71a';
const API_URL = 'https://server-taupe-six.vercel.app/api/admin/fix-rls';

async function trigger() {
    console.log(`🔐 Triggering production RLS Fix API...`);
    console.log(`📡 URL: ${API_URL}`);

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'x-admin-key': ADMIN_SECRET,
            'Content-Type': 'application/json'
        }
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('\n📊 Response from server:', JSON.stringify(data, null, 2));
}

trigger().catch(console.error);
