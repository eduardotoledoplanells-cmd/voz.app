
import { getCreators } from './src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables del .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
    console.log("--- Depuración de Creadores ---");
    try {
        const creators = await getCreators();
        const pending = creators.filter(c => c.verificationData?.status === 'pending');
        
        console.log(`Total Creadores/Usuarios recuperados: ${creators.length}`);
        console.log(`Solicitudes pendientes encontradas: ${pending.length}`);
        
        pending.forEach(p => {
            console.log(`- Usuario: ${p.handle} (ID: ${p.id})`);
            console.log(`  Nombre Real: ${p.verificationData?.full_name}`);
            console.log(`  Estado: ${p.verificationData?.status}`);
        });

        if (pending.length === 0) {
            console.log("ADVERTENCIA: No se han encontrado solicitudes pendientes en el mapeo.");
        }
    } catch (e) {
        console.error("Error en la depuración:", e);
    }
}

debug();
