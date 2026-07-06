const fs = require('fs');

async function run() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';
    try {
        const res = await fetch('https://thiftwzubmvcrdhuwcwm.supabase.co/rest/v1/', {
            headers: { 'apikey': key }
        });
        const data = await res.json();
        const paths = Object.keys(data.paths || {});
        const rpcs = paths.filter(p => p.startsWith('/rpc/'));
        console.log("Available RPCs:", rpcs);
    } catch (e) {
        console.error(e);
    }
}
run();
