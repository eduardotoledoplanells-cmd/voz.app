const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

async function checkSchema() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&limit=1`, {
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
    });

    const data = await res.json();
    console.log('Employee columns:', Object.keys(data[0] || {}));
}

checkSchema().catch(console.error);
