const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

async function getAllEmployees() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=username,password,worker_number,role,active,last_login&order=worker_number.asc`, {
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
    });

    const data = await res.json();
    console.log('=== TODOS LOS EMPLEADOS ===\n');
    data.forEach(e => {
        const roleNames = { 1: 'Director', 2: 'Admin', 3: 'Moderador', 4: 'Publicidad', 5: 'Técnico', 6: 'Dev' };
        console.log(`[${e.worker_number}] ${e.username}`);
        console.log(`    Rol: ${e.role} (${roleNames[e.role] || '?'})`);
        console.log(`    Password: ${e.password}`);
        console.log(`    Activo: ${e.active}`);
        console.log(`    Último login: ${e.last_login || 'Nunca'}`);
        console.log('');
    });
}

getAllEmployees().catch(console.error);
