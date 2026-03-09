require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan credenciales de Supabase en el archivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEscrowTable() {
    console.log('Iniciando creación de tabla pm_escrows...');

    // Supabase REST API execution works directly but table creation via JS client requires
    // raw SQL execution, which we don't have direct access with `supabase.rpc` if not predefined.
    // Instead, since this requires actual table creation, we can run a postgres query using the Supabase Postgres meta-api
    // but usually users have to do this via Supabase dashboard.
    // However, we can try to create a standard Supabase SQL execution script or provide the SQL schema output for the user.

    console.log('\n--- SQL COMMAND PARA EJECUTAR EN EL EDITOR SQL DE SUPABASE ---\n');
    const sql = `
CREATE TABLE IF NOT EXISTS pm_escrows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_handle text NOT NULL,
  creator_handle text NOT NULL,
  amount_locked numeric NOT NULL,
  creator_replies integer DEFAULT 0,
  status text DEFAULT 'locked',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (opcional pero recomendado)
ALTER TABLE pm_escrows ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura integradas si se desea
CREATE POLICY "Enable read for authenticated users" ON pm_escrows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON pm_escrows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON pm_escrows FOR UPDATE TO authenticated USING (true);
  `;

    console.log(sql);
    console.log('\n--------------------------------------------------------------\n');

    console.log('Debido a las restricciones de la API JS de Supabase, la creación de nuevas tablas');
    console.log('generalmente requiere ejecución directa en el editor SQL alojado en la web de Supabase.');
    console.log('Por favor, copia y pega el código SQL de arriba en tu panel de Supabase para crear la tabla.');

    process.exit(0);
}

setupEscrowTable();
