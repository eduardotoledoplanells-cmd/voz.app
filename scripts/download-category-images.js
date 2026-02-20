const https = require('https');
const fs = require('fs');
const path = require('path');

// Categorías con sus IDs de imagen
const categories = [
  { id: '79', name: '3ds' },
  { id: '67', name: 'ds' },
  { id: '53', name: 'juegos-accesorios' },
  { id: '52', name: 'juegos-consolas' },
  { id: '99', name: 'juegos-mandos' },
  { id: '76', name: 'juegos-retro' },
  { id: '51', name: 'juegos-software' },
  { id: '73', name: 'pc-juegos' },
  { id: '70', name: 'playstation-2' },
  { id: '69', name: 'playstation-3' },
  { id: '82', name: 'playstation-4' },
  { id: '93', name: 'playstation-5' },
  { id: '81', name: 'ps-vita' },
  { id: '74', name: 'psp' },
  { id: '88', name: 'switch' },
  { id: '97', name: 'switch-2' },
  { id: '68', name: 'wii' },
  { id: '87', name: 'wii-u' },
  { id: '72', name: 'xbox-360' },
  { id: '83', name: 'xbox-one' },
  { id: '94', name: 'xbox-series' }
];

// Crear directorio si no existe
const outputDir = path.join(__dirname, '..', 'public', 'categories');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✓ Directorio creado:', outputDir);
}

// Función para descargar una imagen
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(outputDir, filename);
    
    // Si ya existe, saltar
    if (fs.existsSync(filePath)) {
      console.log(`⊘ Ya existe: ${filename}`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error ${response.statusCode} al descargar ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Descargado: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Eliminar archivo parcial
      reject(err);
    });
  });
}

// Descargar todas las imágenes
async function downloadAll() {
  console.log(`\nDescargando ${categories.length} imágenes de categorías...\n`);
  
  for (const category of categories) {
    const url = `https://es.webuy.com/img/cat/pl/${category.id}.jpg`;
    const filename = `${category.name}.jpg`;
    
    try {
      await downloadImage(url, filename);
    } catch (error) {
      console.error(`✗ Error descargando ${category.name}:`, error.message);
    }
  }
  
  console.log('\n✓ Descarga completada!\n');
}

downloadAll();
