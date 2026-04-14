const SUPABASE_URL = 'https://ldynlciyllziehyuybex.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeW5sY2l5bGx6aWVoeXV5YmV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODE4NywiZXhwIjoyMDg3NDQ0MTg3fQ.2_T4TOxzyLx8ehZlSL1g2sTAu_urQ-ZixQaKQxSy8-o';

async function createBucket() {
    console.log('Creating media bucket...');
    const postRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 'media',
            name: 'media',
            public: true,
            allowed_mime_types: null,
            file_size_limit: null
        })
    });
    const result = await postRes.json();
    console.log('Result:', JSON.stringify(result, null, 2));
}

createBucket().catch(console.error);
