// Aplica RLS directamente via conexión PostgreSQL (pg)
// Usa el pooler de Supabase con la clave de servicio como contraseña

const { Pool } = require('pg');
const fs = require('fs');

// Supabase pooler connection - usar puerto 6543 (transaction mode)
const pool = new Pool({
    connectionString: `postgresql://postgres.thiftwzubmvcrdhuwcwm:VozDatabase2026!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 15000,
});

const SQL = fs.readFileSync('fix_rls_manual.sql', 'utf8');

async function main() {
    console.log('\n🔒 VOZ - Aplicando RLS via conexión PostgreSQL directa');
    console.log('='.repeat(60));
    
    let client;
    try {
        console.log('📡 Conectando a Supabase PostgreSQL...');
        client = await pool.connect();
        console.log('✅ Conexión establecida\n');
        
        // Split by semicolons and run each statement
        const statements = SQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Ejecutando ${statements.length} sentencias SQL...\n`);
        
        let success = 0, errors = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            const preview = stmt.replace(/\n/g, ' ').substring(0, 75);
            
            try {
                await client.query(stmt);
                console.log(`✅ [${i+1}/${statements.length}] ${preview}`);
                success++;
            } catch (err) {
                // Some errors are OK (e.g., table doesn't exist)
                if (err.message.includes('does not exist') || err.message.includes('already exists')) {
                    console.log(`⚠️  [${i+1}/${statements.length}] Omitido (no existe): ${preview}`);
                } else {
                    console.log(`❌ [${i+1}/${statements.length}] ERROR: ${err.message}`);
                    errors++;
                }
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`\n📊 RESULTADO:`);
        console.log(`   ✅ Éxitos:  ${success}`);
        console.log(`   ❌ Errores: ${errors}`);
        
        if (errors === 0) {
            console.log('\n🎉 ¡RLS aplicado correctamente en todas las tablas de VOZ!');
        }
        
    } catch (err) {
        console.error('\n❌ Error de conexión:', err.message);
        console.log('\n💡 Puede que la contraseña de PostgreSQL haya cambiado.');
        console.log('   Prueba con la clave de servicio como contraseña.');
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

main();
