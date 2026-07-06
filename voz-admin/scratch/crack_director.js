const bcrypt = require('bcryptjs');

const hash = '$2b$10$6I3akgvgMTvzj/i9PuN0u.RKsA9xBWEABw9KXKE4eGR6tvE4AB8TS';

const candidates = [
    '123',
    'admin',
    'admin123',
    'Admin123',
    'Admin123!',
    'voz',
    'voz123',
    'Voz2026',
    'Voz2026!',
    'VOZ2026',
    'password',
    'Password123',
    'VozDatabase2026!',
    '07-241212Aa#',
    'vozpassword',
    'director',
    'Director',
    'Director123',
    'Director2026',
    'VOZ_SEC_KEY_2026_ADMPNL_71a',
    '1234',
    '12345',
    '123456',
    'vozAdmin',
    'vozAdmin2026',
    'superadmin',
];

async function crack() {
    console.log('Probando contraseñas contra hash bcrypt...\n');
    for (const pwd of candidates) {
        const match = await bcrypt.compare(pwd, hash);
        if (match) {
            console.log(`✅ ¡ENCONTRADA! Password del Director (admin): "${pwd}"`);
            process.exit(0);
        } else {
            console.log(`❌ "${pwd}"`);
        }
    }
    console.log('\n❌ Ninguna coincidió. Considera resetear la contraseña.');
}

crack();
