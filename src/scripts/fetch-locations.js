
const fs = require('fs');
const https = require('https');
const path = require('path');

const PROVINCES_URL = 'https://raw.githubusercontent.com/codeforspain/ds-organizacion-administrativa/master/data/provincias.json';
const MUNICIPALITIES_URL = 'https://raw.githubusercontent.com/codeforspain/ds-organizacion-administrativa/master/data/municipios.json';

const EXCLUDED_PROVINCES = ['35', '38', '51', '52']; // Las Palmas, Tenerife, Ceuta, Melilla

const DATA_DIR = path.join(__dirname, '../data');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        console.log('Fetching provinces...');
        const provinces = await fetchJson(PROVINCES_URL);
        const filteredProvinces = provinces.filter(p => !EXCLUDED_PROVINCES.includes(p.provincia_id));

        // Sort provinces alphabetically
        filteredProvinces.sort((a, b) => a.nombre.localeCompare(b.nombre));

        fs.writeFileSync(path.join(DATA_DIR, 'provinces.json'), JSON.stringify(filteredProvinces, null, 2));
        console.log(`Saved ${filteredProvinces.length} provinces.`);

        console.log('Fetching municipalities...');
        const municipalities = await fetchJson(MUNICIPALITIES_URL);
        const filteredMunicipalities = municipalities.filter(m => !EXCLUDED_PROVINCES.includes(m.provincia_id));

        // Optimize: keep only needed fields (municipio_id, provincia_id, nombre) to reduce file size
        const optimizedMunicipalities = filteredMunicipalities.map(m => ({
            id: m.municipio_id,
            p: m.provincia_id,
            n: m.nombre
        }));

        // Sort municipalities alphabetically
        optimizedMunicipalities.sort((a, b) => a.n.localeCompare(b.n));

        fs.writeFileSync(path.join(DATA_DIR, 'municipalities.json'), JSON.stringify(optimizedMunicipalities, null, 2));
        console.log(`Saved ${optimizedMunicipalities.length} municipalities.`);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
