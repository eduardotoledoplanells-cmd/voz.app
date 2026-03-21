const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/voz/auth';
const TEST_EMAIL = 'Retrotiendas2019@gmail.com'; // Usando el email encontrado en la DB

async function testRecoveryFlow() {
    console.log('--- Testing Password Recovery Flow ---');

    // 1. Forgot Password
    console.log('\n1. Testing forgot_password...');
    try {
        const forgotRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'forgot_password', email: TEST_EMAIL })
        });
        const forgotData = await forgotRes.json();
        console.log('Response:', forgotData);

        if (!forgotData.success) {
            console.error('FAILED at forgot_password');
            return;
        }

        console.log('SUCCESS: PIN should be sent to email and stored in DB.');

        // NOTE: Since I can't easily check the real email or DB for the random PIN here 
        // without more queries, I'll stop here OR I could try to fetch the user from DB 
        // directly to get the PIN for the next step of the test.
        
    } catch (error) {
        console.error('Error during forgot_password:', error);
    }
}

testRecoveryFlow();
