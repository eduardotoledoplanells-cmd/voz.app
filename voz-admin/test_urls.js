const URLS = [
    'https://voz-admin-murex.vercel.app/api/voz/auth',
    'http://localhost:3001/api/voz/auth'
];

async function testApi(url) {
    console.log(`Testing ` + url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'reset_password', 
                email: 'Retrotiendas2019@gmail.com',
                newPassword: 'test',
                recoveryPin: '0' 
            })
        });
        const text = await res.text();
        console.log(`Response from ${url}:`, text);
    } catch (e) {
        console.log(`Fetch failed for ${url}:`, e.message);
    }
}

async function run() {
    for (const u of URLS) {
        await testApi(u);
    }
}
run();
