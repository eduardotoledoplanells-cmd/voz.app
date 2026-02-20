const fs = require('fs');
const path = require('path');

const dbPath = path.join('src', 'lib', 'db.json');

try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const json = JSON.parse(data);
    const products = json.products;

    const ids = {};
    const duplicates = [];

    products.forEach(p => {
        if (ids[p.id]) {
            duplicates.push(p.id);
        }
        ids[p.id] = (ids[p.id] || 0) + 1;
    });

    if (duplicates.length > 0) {
        console.log('Duplicates found:', duplicates);
        // Detail locations
        duplicates.forEach(id => {
            console.log(`ID ${id} appears ${ids[id]} times.`);
        });
    } else {
        console.log('No duplicates found.');
    }

} catch (e) {
    console.error('Error:', e.message);
}
