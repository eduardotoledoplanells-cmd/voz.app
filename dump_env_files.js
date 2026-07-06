const fs = require('fs');
const path = require('path');

const files = [
    'c:\\VOZ\\mobile\\.env',
    'c:\\VOZ\\mobile\\.env.production',
    'c:\\VOZ\\server\\.env.production',
    'c:\\VOZ\\server\\.env.vercel.prod',
    'c:\\VOZ\\server\\.env.vercel.pulled',
    'c:\\VOZ\\server\\.env.voz-app',
    'c:\\VOZ\\server\\.env.voz-app-otch',
    'c:\\VOZ\\server\\voz-admin\\.env.local',
    'c:\\VOZ\\server\\voz-admin\\.env.vercel.prod',
    'c:\\VOZ\\server\\voz-admin\\.env.vercel.prod.latest',
    'c:\\VOZ\\server\\voz-admin\\.env.vozadmin.prod',
    'c:\\VOZ\\temp_vercel\\.env.vozapp.prod'
];

for (const f of files) {
    if (fs.existsSync(f)) {
        try {
            const content = fs.readFileSync(f, 'utf8');
            const lines = content.split('\n');
            const keys = lines
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('#'))
                .map(l => l.split('=')[0]);
            console.log(`File: ${f} - Keys:`, keys);
        } catch (e) {
            console.error(`Error reading ${f}:`, e.message);
        }
    } else {
        console.log(`File does not exist: ${f}`);
    }
}
