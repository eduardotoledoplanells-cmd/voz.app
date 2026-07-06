async function checkHeaders() {
    try {
        const res = await fetch('https://thiftwzubmvcrdhuwcwm.supabase.co/rest/v1/', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTIxNzIsImV4cCI6MjA5NDY4ODE3Mn0.ontxCxwCCA4TRbFCF9oZHT-eSDTrVC2b5P6z5B6Xa6s'
            }
        });
        console.log('Headers:');
        for (const [key, value] of res.headers.entries()) {
            console.log(`${key}: ${value}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkHeaders();
