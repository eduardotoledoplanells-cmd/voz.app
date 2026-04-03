async function testRegister() {
    const url = 'https://voz-admin-murex.vercel.app/api/voz/auth';
    console.log("Testing POST to", url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'register', 
                email: 'test_register_debug_555@test.com',
                password: 'password123',
                username: 'testdebug555'
            })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testRegister();
