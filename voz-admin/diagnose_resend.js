const { Resend } = require('resend');
require('dotenv').config({ path: './.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkResend() {
    console.log("Checking Resend API Key...");
    console.log("Key prefix:", process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + "..." : "MISSING");

    try {
        // There isn't a direct "whoami" endpoint in the Resend SDK that is obvious,
        // but we can try to send an email TO the owner or check the error message.
        // Actually, let's try to list API keys if possible? No, SDK doesn't support it easily.
        
        // Let's try a dry run or just checking the response of a dummy send.
        const { data, error } = await resend.emails.send({
            from: 'VOZ <onboarding@resend.dev>',
            to: 'revoluxbit.rob@gmail.com', // Try to send to the likely owner
            subject: 'Test Diagnostic',
            html: '<p>Checking API status</p>'
        });

        if (error) {
            console.error("Resend API Error:", error);
            if (error.message.includes("restricted")) {
                console.log("DIAGNOSIS: Account is in Sandbox mode and can only send to registered address.");
            }
        } else {
            console.log("Resend API Success! Email ID:", data.id);
            console.log("DIAGNOSIS: The API key is valid and sending works to the owner address.");
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
}

checkResend();
