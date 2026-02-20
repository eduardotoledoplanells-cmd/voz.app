import { Category } from '@/types';

export const categories: Category[] = [
    // Main Hub Categories for Games
    {
        id: 'modern-nintendo-hub',
        name: 'Nintendo',
        slug: 'modern-nintendo-hub',
        image: '/uploads/images/1765145283767-logo_nintendo.png', // Reusing Switch image
        description: 'Descubre nuestra increíble selección de Nintendo. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },

    {
        id: 'playstation-hub',
        name: 'PlayStation',
        slug: 'playstation',
        image: '/uploads/images/1765139319766-logo_playstation.png',
        description: 'Todas las consolas y juegos de PlayStation',
        productCount: 0
    },
    {
        id: 'xbox-hub',
        name: 'Xbox',
        slug: 'xbox',
        image: '/uploads/images/1765139435439-logo_xbox.jpg',
        description: 'Consolas y juegos de Xbox series',
        productCount: 0
    },
    {
        id: 'pc-juegos',
        name: 'PC Juegos',
        slug: 'pc-juegos',
        image: '/uploads/images/1765145132620-juegos_PC.webp', // Placeholder image
        description: 'Descubre nuestra increíble selección de PC Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },



    // Consolas Nintendo
    {
        id: 'nintendo-3ds',
        name: '3DS',
        slug: '3ds',
        image: '/uploads/images/1765138548892-consola_3ds_xl.jfif',
        description: 'Juegos y accesorios para Nintendo 3DS',
        productCount: 0
    },
    {
        id: 'nintendo-ds',
        name: 'DS',
        slug: 'ds',
        image: '/uploads/images/1765138929585-consola_Nintendo_DS.png',
        description: 'Juegos y accesorios para Nintendo DS',
        productCount: 0
    },
    {
        id: 'nintendo-gameboy',
        name: 'Game Boy',
        slug: 'game-boy',
        image: '/uploads/images/1765145193787-consola_game_boy.jpg', // Placeholder
        description: 'Descubre nuestra increíble selección de Game Boy. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'nintendo-switch',
        name: 'Switch',
        slug: 'switch',
        image: '/uploads/images/1765139213227-consola_switch.jpg',
        description: 'Juegos y accesorios para Nintendo Switch',
        productCount: 0
    },
    {
        id: 'nintendo-switch-2',
        name: 'Switch 2',
        slug: 'switch-2',
        image: '/uploads/images/1765139231259-consola_switch_2.jpg', // Reutilizando imagen de Switch
        description: 'Juegos y accesorios para Nintendo Switch 2',
        productCount: 0
    },
    {
        id: 'nintendo-wii',
        name: 'Wii',
        slug: 'wii',
        image: '/uploads/images/1765139244862-consola_wii.png', // Placeholder
        description: 'Juegos y accesorios para Nintendo Wii',
        productCount: 0
    },
    {
        id: 'nintendo-wii-u',
        name: 'Wii U',
        slug: 'wii-u',
        image: '/uploads/images/1765139609526-consola_wii_u.jpg', // Placeholder
        description: 'Juegos y accesorios para Nintendo Wii U',
        productCount: 0
    },

    {
        id: 'playstation-retro-collection',
        name: 'PlayStation 1,2,3',
        slug: 'playstation-retro-collection',
        image: '/uploads/images/1765139319766-logo_playstation.png', // Reusing PS logo or generic
        description: 'Colección Clásica: PS1, PS2, PS3, PSP, PS Vita',
        productCount: 0
    },
    // Consolas PlayStation
    {
        id: 'playstation-1',
        name: 'PlayStation 1',
        slug: 'playstation-1',
        image: '/uploads/images/1765138945129-consola_playstation_1.webp', // Placeholder
        description: 'Juegos y accesorios para PlayStation 1',
        productCount: 0
    },
    {
        id: 'playstation-2',
        name: 'PlayStation 2',
        slug: 'playstation-2',
        image: '/uploads/images/1765138956730-consola_playstation_2.webp', // Placeholder
        description: 'Juegos y accesorios para PlayStation 2',
        productCount: 0
    },
    {
        id: 'playstation-3',
        name: 'PlayStation 3',
        slug: 'playstation-3',
        image: '/uploads/images/1765138973019-consola_playstation_3.avif',
        description: 'Juegos y accesorios para PlayStation 3',
        productCount: 0
    },
    {
        id: 'playstation-4',
        name: 'PlayStation 4',
        slug: 'playstation-4',
        image: '/uploads/images/1765139590653-consola_playstation_4.jpg',
        description: 'Juegos y accesorios para PlayStation 4',
        productCount: 0
    },
    {
        id: 'playstation-5',
        name: 'PlayStation 5',
        slug: 'playstation-5',
        image: '/uploads/images/1765139622669-consola_playstation_5.jpg',
        description: 'Juegos y accesorios para PlayStation 5',
        productCount: 0
    },
    {
        id: 'ps-portal',
        name: 'PS Portal',
        slug: 'ps-portal',
        image: '/uploads/images/1765145304457-PS_PORTAL.jpg', // Reusing PS5 image for now
        description: 'Descubre nuestra increíble selección de PS Portal. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'psportal-consolas', name: 'PS Portal - Consolas', slug: 'psportal-consolas', image: '/uploads/images/1765145213933-PS_PORTAL.jpg',
        description: 'Descubre nuestra increíble selección de PS Portal - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps-vita',
        name: 'PS Vita',
        slug: 'ps-vita',
        image: '/uploads/images/1765138673206-consola_psp_vita.jpg', // Placeholder
        description: 'Juegos y accesorios para PlayStation Vita',
        productCount: 0
    },
    {
        id: 'psp',
        name: 'PSP',
        slug: 'psp',
        image: '/uploads/images/1765138689146-consola_psp.jpg', // Placeholder
        description: 'Juegos y accesorios para PlayStation Portable',
        productCount: 0
    },

    // Consolas Xbox
    {
        id: 'xbox-360',
        name: 'Xbox 360',
        slug: 'xbox-360',
        image: '/uploads/images/1765139703135-consola_xbox_360.jpg', // Placeholder
        description: 'Juegos y accesorios para Xbox 360',
        productCount: 0
    },
    {
        id: '360-juegos', name: 'Xbox 360 - Juegos', slug: 'xbox360-juegos', image: '/uploads/images/1765145233418-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: '360-consolas', name: 'Xbox 360 - Consolas', slug: 'xbox360-consolas', image: '/uploads/images/1765145252561-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: '360-accesorios', name: 'Xbox 360 - Accesorios', slug: 'xbox360-accesorios', image: '/uploads/images/1765145233418-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'xbox-one',
        name: 'Xbox One',
        slug: 'xbox-one',
        image: '/uploads/images/1765139747668-consola_xbox_one.jpg', // Placeholder
        description: 'Juegos y accesorios para Xbox One',
        productCount: 0
    },
    {
        id: 'one-juegos', name: 'Xbox One - Juegos', slug: 'xbox-one-juegos', image: '/uploads/images/1765272863223-consola_xbox_one.jpg',
        description: 'Descubre nuestra increíble selección de Xbox One - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    { id: 'one-consolas', name: 'Xbox One - Consolas', slug: 'xbox-one-consolas', image: '/uploads/images/1765272863223-consola_xbox_one.jpg' },
    { id: 'one-accesorios', name: 'Xbox One - Accesorios', slug: 'xbox-one-accesorios', image: '/uploads/images/1765272863223-consola_xbox_one.jpg' },
    {
        id: 'xbox-series',
        name: 'Xbox Series',
        slug: 'xbox-series',
        image: '/uploads/images/1765139806021-consola_xbox_series.jpg',
        description: 'Juegos y accesorios para Xbox Series X/S',
        productCount: 0
    },



    // Accesorios y Hardware
    {
        id: 'juegos-accesorios',
        name: 'Juegos Accesorios',
        slug: 'juegos-accesorios',
        image: '/categories/category_3ds_1764714906605.png', // Placeholder
        description: 'Accesorios para consolas de videojuegos',
        productCount: 0
    },
    {
        id: 'juegos-consolas',
        name: 'Juegos Consolas',
        slug: 'juegos-consolas',
        image: '/categories/category_playstation_5_1764714934054.png', // Placeholder
        description: 'Consolas de videojuegos',
        productCount: 0
    },
    {
        id: 'juegos-mandos',
        name: 'Juegos Mandos',
        slug: 'juegos-mandos',
        image: '/categories/category_xbox_series_1764714979884.png', // Placeholder
        description: 'Mandos y controladores para consolas',
        productCount: 0
    },

    // Retro y Software
    {
        id: 'juegos-retro',
        name: 'Juegos Retro',
        slug: 'juegos-retro',
        image: '/categories/category_ds_1764714921980.png', // Placeholder
        description: 'Juegos y consolas retro',
        productCount: 0
    },
    // Nuevas subcategorías Retro (Nivel 3)
    {
        id: 'retro-nintendo',
        name: 'Nintendo',
        slug: 'retro-nintendo',
        image: '/uploads/images/1765139843861-logo_nintendo.png', // Placeholder
        description: 'Clásicos de Nintendo: NES, SNES, N64, GameCube',
        productCount: 0
    },

    // NES
    {
        id: 'nintendo-nes',
        name: 'Nintendo (NES)',
        slug: 'nes',
        image: '/uploads/images/1765319370624-consola_nes.jpg',
        description: 'Nintendo Entertainment System',
        productCount: 0
    },
    {
        id: 'nes-juegos', name: 'NES - Juegos', slug: 'nes-juegos', image: '/uploads/images/1765319370624-consola_nes.jpg',
        description: 'Descubre nuestra increíble selección de NES - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'nes-consolas', name: 'NES - Consolas', slug: 'nes-consolas', image: '/uploads/images/1765319370624-consola_nes.jpg',
        description: 'Descubre nuestra increíble selección de NES - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'nes-accesorios', name: 'NES - Accesorios', slug: 'nes-accesorios', image: '/uploads/images/1765319370624-consola_nes.jpg',
        description: 'Descubre nuestra increíble selección de NES - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // SNES
    {
        id: 'nintendo-snes',
        name: 'Super Nintendo',
        slug: 'snes',
        image: '/uploads/images/1765145359143-Consola_Super_Nintendo.jpg',
        description: 'Descubre nuestra increíble selección de Super Nintendo. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'snes-juegos', name: 'SNES - Juegos', slug: 'snes-juegos', image: '/uploads/images/1765145383453-Consola_Super_Nintendo.jpg',
        description: 'Descubre nuestra increíble selección de SNES - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'snes-consolas', name: 'SNES - Consolas', slug: 'snes-consolas', image: '/uploads/images/1765145400904-Consola_Super_Nintendo.jpg',
        description: 'Descubre nuestra increíble selección de SNES - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'snes-accesorios', name: 'SNES - Accesorios', slug: 'snes-accesorios', image: '/uploads/images/1765145414050-Consola_Super_Nintendo.jpg',
        description: 'Descubre nuestra increíble selección de SNES - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'retro-sega',
        name: 'Retro Sega',
        slug: 'retro-sega',
        image: '/uploads/images/1765137197201-logo_sega.png',
        description: 'Clásicos de Sega: Master System, Mega Drive, Saturn, Dreamcast',
        productCount: 0
    },
    {
        id: 'xbox-retro-collection',
        name: 'XBOX 1,2,3',
        slug: 'xbox-retro-collection',
        image: '/uploads/images/1765140017757-consola_xbox_clasica.jpg', // Placeholder
        description: 'Colección Clásica: Xbox, Xbox 360, Xbox One',
        productCount: 0
    },
    {
        id: 'retro-xbox',
        name: 'Xbox Clásica',
        slug: 'retro-xbox',
        image: '/uploads/images/1765140017757-consola_xbox_clasica.jpg', // Placeholder
        description: 'La primera consola Xbox',
        productCount: 0
    },
    { id: 'xbox-juegos', name: 'Xbox - Juegos', slug: 'xbox-juegos', image: '/uploads/images/1765140017757-consola_xbox_clasica.jpg' },
    { id: 'xbox-consolas', name: 'Xbox - Consolas', slug: 'xbox-consolas', image: '/uploads/images/1765140017757-consola_xbox_clasica.jpg' },
    { id: 'xbox-accesorios', name: 'Xbox - Accesorios', slug: 'xbox-accesorios', image: '/uploads/images/1765140017757-consola_xbox_clasica.jpg' },
    {
        id: 'juegos-software',
        name: 'Juegos Software',
        slug: 'juegos-software',
        image: '/categories/category_playstation_4_1764714947128.png', // Placeholder
        description: 'Software y aplicaciones para gaming',
        productCount: 0
    },
    {
        id: 'retro-otros',
        name: 'Otros',
        slug: 'retro-otros',
        image: '/categories/category_ds_1764714921980.png', // Placeholder
        description: 'Otros juegos y consolas retro',
        productCount: 0
    },
    // Main Hub Categories (Películas & Informática)
    {
        id: 'peliculas',
        name: 'Películas',
        slug: 'peliculas',
        image: '/categories/category_bluray_1764752606672.png',
        description: 'Encuentra tus películas favoritas en VHS, DVD y Blu-Ray',
        productCount: 0
    },
    {
        id: 'informatica',
        name: 'Informática',
        slug: 'informatica',
        image: '/categories/category_laptop_1764752889425.png',
        description: 'Portátiles, sobremesa, tablets y accesorios de informática',
        productCount: 0
    },

    // Movies subcategories
    { id: 'peliculas-vhs', name: 'Películas - VHS', slug: 'peliculas-vhs', image: '/categories/category_vhs_1764752303670.png' },
    { id: 'peliculas-dvd', name: 'Películas - DVD', slug: 'peliculas-dvd', image: '/categories/category_dvd_1764752467930.png' },
    { id: 'peliculas-bluray', name: 'Películas - Blu-Ray', slug: 'peliculas-bluray', image: '/categories/category_bluray_1764752606672.png' },

    // Computing subcategories
    { id: 'informatica-tablets', name: 'Informática - Tablets', slug: 'informatica-tablets', image: '/categories/category_tablet_1764752725469.png' },
    { id: 'informatica-portatiles', name: 'Informática - Portátiles', slug: 'informatica-portatiles', image: '/categories/category_laptop_1764752889425.png' },
    { id: 'informatica-sobremesa', name: 'Informática - Sobremesa', slug: 'informatica-sobremesa', image: '/categories/category_desktop_1764752959008.png' },
    { id: 'informatica-monitores', name: 'Informática - Monitores', slug: 'informatica-monitores', image: '/categories/category_monitor_1764752985118.png' },
    {
        id: 'informatica-accesorios', name: 'Informática - Accesorios', slug: 'informatica-accesorios', image: '/uploads/images/1765272752656-file_00000000bab4720a9065d3aaad7c2033.png',
        description: 'Descubre nuestra increíble selección de Informática - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // Music category
    {
        id: 'musica',
        name: 'Música',
        slug: 'musica',
        image: '/uploads/images/1765281910042-file_00000000146871f494012d0126c25660.png',
        description: 'Encuentra tu música favorita en CD y Vinilo',
        productCount: 0
    },

    // Music subcategories
    { id: 'musica-cd', name: 'Música - CD', slug: 'musica-cd', image: '/uploads/images/1765281910042-file_00000000146871f494012d0126c25660.png' },
    { id: 'musica-vinilo', name: 'Música - Vinilo', slug: 'musica-vinilo', image: '/uploads/images/1765281910042-file_00000000146871f494012d0126c25660.png' },

    // Electronics category
    {
        id: 'electronica',
        name: 'Electrónica',
        slug: 'electronica',
        image: '/uploads/images/1765281934225-file_00000000bab4720a9065d3aaad7c2033.png',
        description: 'Encuentra los mejores productos electrónicos',
        productCount: 0
    },

    // Electronics subcategories
    { id: 'electronica-audio', name: 'Electrónica - Audio', slug: 'electronica-audio', image: 'https://placehold.co/100x100?text=Audio' },
    { id: 'electronica-television', name: 'Electrónica - Televisión', slug: 'electronica-television', image: 'https://placehold.co/100x100?text=TV' },
    { id: 'electronica-camaras', name: 'Electrónica - Cámaras', slug: 'electronica-camaras', image: 'https://placehold.co/100x100?text=Cámaras' },
    { id: 'electronica-smartwatch', name: 'Electrónica - Smartwatch', slug: 'electronica-smartwatch', image: 'https://placehold.co/100x100?text=Smartwatch' },
    { id: 'electronica-accesorios', name: 'Electrónica - Accesorios', slug: 'electronica-accesorios', image: 'https://placehold.co/100x100?text=Accesorios' },

    // Mobile phones category
    {
        id: 'moviles',
        name: 'Móviles',
        slug: 'moviles',
        image: '/uploads/images/1765281960482-file_000000002be0720a9b35be98cbc5a338.png',
        description: 'Encuentra tu móvil ideal de las mejores marcas',
        productCount: 0
    },

    // Mobile phone brand subcategories
    {
        id: 'moviles-apple', name: 'Móviles - Apple', slug: 'moviles-apple', image: '/uploads/images/1765318957176-apple.png',
        description: 'Descubre nuestra increíble selección de Móviles - Apple. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-samsung', name: 'Móviles - Samsung', slug: 'moviles-samsung', image: '/uploads/images/1765319013075-samsung.avif',
        description: 'Descubre nuestra increíble selección de Móviles - Samsung. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-xiaomi', name: 'Móviles - Xiaomi', slug: 'moviles-xiaomi', image: '/uploads/images/1765319061051-xiaomi.jpg',
        description: 'Descubre nuestra increíble selección de Móviles - Xiaomi. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-huawei', name: 'Móviles - Huawei', slug: 'moviles-huawei', image: '/uploads/images/1765319103833-Huawei-Logo.png',
        description: 'Descubre nuestra increíble selección de Móviles - Huawei. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-oneplus', name: 'Móviles - OnePlus', slug: 'moviles-oneplus', image: '/uploads/images/1765319152890-OnePlus-logo-1-1.jpg',
        description: 'Descubre nuestra increíble selección de Móviles - OnePlus. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-google', name: 'Móviles - Google', slug: 'moviles-google', image: '/uploads/images/1765319223267-google.avif',
        description: 'Descubre nuestra increíble selección de Móviles - Google. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-oppo', name: 'Móviles - Oppo', slug: 'moviles-oppo', image: '/uploads/images/1765319278030-Logo-oppo-vector-PNG.png',
        description: 'Descubre nuestra increíble selección de Móviles - Oppo. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'moviles-realme', name: 'Móviles - Realme', slug: 'moviles-realme', image: '/uploads/images/1765319318102-realme.png',
        description: 'Descubre nuestra increíble selección de Móviles - Realme. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    // --- RETRO EXPANSION ---
    // Nintendo DS
    {
        id: 'ds-juegos', name: 'DS - Juegos', slug: 'ds-juegos', image: '/uploads/images/1765140483844-consola_Nintendo_DS.png',
        description: 'Descubre nuestra increíble selección de DS - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ds-consolas', name: 'DS - Consolas', slug: 'ds-consolas', image: '/uploads/images/1765140469818-consola_Nintendo_DS.png',
        description: 'Descubre nuestra increíble selección de DS - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ds-accesorios', name: 'DS - Accesorios', slug: 'ds-accesorios', image: '/uploads/images/1765140454035-consola_Nintendo_DS.png',
        description: 'Descubre nuestra increíble selección de DS - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // Nintendo Game Cube
    {
        id: 'game-cube',
        name: 'Game Cube',
        slug: 'game-cube',
        image: '/uploads/images/1765150504920-consola_game_cube.jpg', // Placeholder
        description: 'Descubre nuestra increíble selección de Game Cube. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'game-cube-juegos', name: 'Game Cube - Juegos', slug: 'game-cube-juegos', image: '/uploads/images/1765150536315-consola_game_cube.jpg',
        description: 'Descubre nuestra increíble selección de Game Cube - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'game-cube-consolas', name: 'Game Cube - Consolas', slug: 'game-cube-consolas', image: '/uploads/images/1765150576054-consola_game_cube.jpg',
        description: 'Descubre nuestra increíble selección de Game Cube - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'game-cube-accesorios', name: 'Game Cube - Accesorios', slug: 'game-cube-accesorios', image: '/uploads/images/1765150599552-consola_game_cube.jpg',
        description: 'Descubre nuestra increíble selección de Game Cube - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // Nintendo 3DS
    {
        id: '3ds-juegos', name: '3DS - Juegos', slug: '3ds-juegos', image: '/uploads/images/1765140435066-consola_3ds_xl.jfif',
        description: 'Descubre nuestra increíble selección de 3DS - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: '3ds-consolas', name: '3DS - Consolas', slug: '3ds-consolas', image: '/uploads/images/1765140418155-consola_3ds_xl.jfif',
        description: 'Descubre nuestra increíble selección de 3DS - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: '3ds-accesorios', name: '3DS - Accesorios', slug: '3ds-accesorios', image: '/uploads/images/1765140402261-consola_3ds_xl.jfif',
        description: 'Descubre nuestra increíble selección de 3DS - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // Xbox 360
    {
        id: 'xbox360-juegos', name: 'Xbox 360 - Juegos', slug: 'xbox360-juegos', image: '/uploads/images/1765140384629-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'xbox360-consolas', name: 'Xbox 360 - Consolas', slug: 'xbox360-consolas', image: '/uploads/images/1765140366500-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'xbox360-accesorios', name: 'Xbox 360 - Accesorios', slug: 'xbox360-accesorios', image: '/uploads/images/1765140349356-consola_xbox_360.jpg',
        description: 'Descubre nuestra increíble selección de Xbox 360 - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // PlayStation 1
    {
        id: 'ps1-juegos', name: 'PS1 - Juegos', slug: 'ps1-juegos', image: '/uploads/images/1765140334224-consola_playstation_1.webp',
        description: 'Descubre nuestra increíble selección de PS1 - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps1-consolas', name: 'PS1 - Consolas', slug: 'ps1-consolas', image: '/uploads/images/1765140319129-consola_playstation_1.webp',
        description: 'Descubre nuestra increíble selección de PS1 - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps1-accesorios', name: 'PS1 - Accesorios', slug: 'ps1-accesorios', image: '/uploads/images/1765140303178-consola_playstation_1.webp',
        description: 'Descubre nuestra increíble selección de PS1 - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // PlayStation 2
    {
        id: 'ps2-juegos', name: 'PS2 - Juegos', slug: 'ps2-juegos', image: '/uploads/images/1765140288922-consola_playstation_2.webp',
        description: 'Descubre nuestra increíble selección de PS2 - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps2-consolas', name: 'PS2 - Consolas', slug: 'ps2-consolas', image: '/uploads/images/1765140261397-consola_playstation_2.webp',
        description: 'Descubre nuestra increíble selección de PS2 - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps2-accesorios', name: 'PS2 - Accesorios', slug: 'ps2-accesorios', image: '/uploads/images/1765140242723-consola_playstation_2.webp',
        description: 'Descubre nuestra increíble selección de PS2 - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // PlayStation 3
    {
        id: 'ps3-juegos', name: 'PS3 - Juegos', slug: 'ps3-juegos', image: '/uploads/images/1765140224438-consola_playstation_3.avif',
        description: 'Descubre nuestra increíble selección de PS3 - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps3-consolas', name: 'PS3 - Consolas', slug: 'ps3-consolas', image: '/uploads/images/1765140210901-consola_playstation_3.avif',
        description: 'Descubre nuestra increíble selección de PS3 - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'ps3-accesorios', name: 'PS3 - Accesorios', slug: 'ps3-accesorios', image: '/uploads/images/1765140194966-consola_playstation_3.avif',
        description: 'Descubre nuestra increíble selección de PS3 - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // PSP
    {
        id: 'psp-juegos', name: 'PSP - Juegos', slug: 'psp-juegos', image: '/uploads/images/1765140174190-consola_psp.jpg',
        description: 'Descubre nuestra increíble selección de PSP - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'psp-consolas', name: 'PSP - Consolas', slug: 'psp-consolas', image: '/uploads/images/1765140151088-consola_psp.jpg',
        description: 'Descubre nuestra increíble selección de PSP - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'psp-accesorios', name: 'PSP - Accesorios', slug: 'psp-accesorios', image: '/uploads/images/1765140137079-consola_psp.jpg',
        description: 'Descubre nuestra increíble selección de PSP - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },

    // PS Vita
    {
        id: 'psvita-juegos', name: 'PS Vita - Juegos', slug: 'psvita-juegos', image: '/uploads/images/1765140119276-consola_psp_vita.jpg',
        description: 'Descubre nuestra increíble selección de PS Vita - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'psvita-consolas', name: 'PS Vita - Consolas', slug: 'psvita-consolas', image: '/uploads/images/1765140087955-consola_psp_vita.jpg',
        description: 'Descubre nuestra increíble selección de PS Vita - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'psvita-accesorios', name: 'PS Vita - Accesorios', slug: 'psvita-accesorios', image: '/uploads/images/1765140063876-consola_psp_vita.jpg',
        description: 'Descubre nuestra increíble selección de PS Vita - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    // Sega Dreamcast
    {
        id: 'dreamcast-juegos', name: 'Dreamcast - Juegos', slug: 'dreamcast-juegos', image: '/uploads/images/1765140836265-consola_Dreamcast.jpg',
        description: 'Descubre nuestra increíble selección de Dreamcast - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'dreamcast-consolas', name: 'Dreamcast - Consolas', slug: 'dreamcast-consolas', image: '/uploads/images/1765140852364-consola_Dreamcast.jpg',
        description: 'Descubre nuestra increíble selección de Dreamcast - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'dreamcast-accesorios', name: 'Dreamcast - Accesorios', slug: 'dreamcast-accesorios', image: '/uploads/images/1765140870216-consola_Dreamcast.jpg',
        description: 'Descubre nuestra increíble selección de Dreamcast - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'dreamcast',
        name: 'Sega Dreamcast',
        slug: 'dreamcast',
        image: '/uploads/images/1765140836265-consola_Dreamcast.jpg',
        description: 'La última consola de Sega',
        productCount: 0
    },
    // Sega Game Gear
    {
        id: 'game-gear',
        name: 'Game Gear',
        slug: 'game-gear',
        image: '/uploads/images/1765149353306-consola_game_gear.png',
        description: 'Descubre nuestra increíble selección de Game Gear. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'game-gear-juegos', name: 'Game Gear - Juegos', slug: 'game-gear-juegos', image: '/uploads/images/1765149379263-consola_game_gear.png',
        description: 'Juegos para Sega Game Gear'
    },
    {
        id: 'game-gear-consolas', name: 'Game Gear - Consolas', slug: 'game-gear-consolas', image: '/uploads/images/1765149418238-consola_game_gear.png',
        description: 'Consolas Sega Game Gear'
    },
    {
        id: 'game-gear-accesorios', name: 'Game Gear - Accesorios', slug: 'game-gear-accesorios', image: '/uploads/images/1765149440142-consola_game_gear.png',
        description: 'Accesorios para Sega Game Gear'
    },
    // Sega Master System
    {
        id: 'master-system',
        name: 'Master System',
        slug: 'master-system',
        image: '/uploads/images/1765149468210-consola_master_system_II.jpg',
        description: 'La consola de 8 bits de Sega',
        productCount: 0
    },
    {
        id: 'master-system-juegos', name: 'Master System - Juegos', slug: 'master-system-juegos', image: '/uploads/images/1765149482543-consola_master_system_II.jpg',
        description: 'Juegos para Sega Master System'
    },
    {
        id: 'master-system-consolas', name: 'Master System - Consolas', slug: 'master-system-consolas', image: '/uploads/images/1765149498257-consola_master_system_II.jpg',
        description: 'Consolas Sega Master System'
    },
    {
        id: 'master-system-accesorios', name: 'Master System - Accesorios', slug: 'master-system-accesorios', image: '/uploads/images/1765149518796-consola_master_system_II.jpg',
        description: 'Accesorios para Sega Master System'
    },
    // Sega Mega Drive
    {
        id: 'mega-drive',
        name: 'Mega Drive',
        slug: 'mega-drive',
        image: '/uploads/images/1765149722307-Mega_Drive.avif',
        description: 'La 16 bits de Sega',
        productCount: 0
    },
    {
        id: 'mega-drive-juegos', name: 'Mega Drive - Juegos', slug: 'mega-drive-juegos', image: '/uploads/images/1765149733633-Mega_Drive.avif',
        description: 'Juegos para Sega Mega Drive'
    },
    {
        id: 'mega-drive-consolas', name: 'Mega Drive - Consolas', slug: 'mega-drive-consolas', image: '/uploads/images/1765149756481-Mega_Drive.avif',
        description: 'Consolas Sega Mega Drive'
    },
    {
        id: 'mega-drive-accesorios', name: 'Mega Drive - Accesorios', slug: 'mega-drive-accesorios', image: '/uploads/images/1765149795774-Mega_Drive.avif',
        description: 'Accesorios para Sega Mega Drive'
    },
    // Sega Saturn
    {
        id: 'sega-saturn',
        name: 'Sega Saturn',
        slug: 'sega-saturn',
        image: '/uploads/images/1765149311804-consola_sega_saturn.png',
        description: 'Descubre nuestra increíble selección de Sega Saturn. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!',
        productCount: 0
    },
    {
        id: 'sega-saturn-juegos', name: 'Sega Saturn - Juegos', slug: 'sega-saturn-juegos', image: '/uploads/images/1765149283068-consola_sega_saturn.png',
        description: 'Descubre nuestra increíble selección de Sega Saturn - Juegos. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'sega-saturn-consolas', name: 'Sega Saturn - Consolas', slug: 'sega-saturn-consolas', image: '/uploads/images/1765149261406-consola_sega_saturn.png',
        description: 'Descubre nuestra increíble selección de Sega Saturn - Consolas. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
    {
        id: 'sega-saturn-accesorios', name: 'Sega Saturn - Accesorios', slug: 'sega-saturn-accesorios', image: '/uploads/images/1765149244506-consola_sega_saturn.png',
        description: 'Descubre nuestra increíble selección de Sega Saturn - Accesorios. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!'
    },
];

// Función helper para obtener una categoría por slug
export function getCategoryBySlug(slug: string): Category | undefined {
    return categories.find(cat => cat.slug === slug);
}

// Función helper para obtener todas las categorías
export function getAllCategories(): Category[] {
    return categories;
}

// Función helper para obtener categorías por tipo
export function getCategoriesByType(type: 'nintendo' | 'playstation' | 'xbox' | 'pc' | 'accesorios'): Category[] {
    const typeMap: Record<string, string[]> = {
        nintendo: ['nintendo-3ds', 'nintendo-ds', 'nintendo-switch', 'nintendo-switch-2', 'nintendo-wii', 'nintendo-wii-u'],
        playstation: ['playstation-2', 'playstation-3', 'playstation-4', 'playstation-5', 'ps-vita', 'psp'],
        xbox: ['xbox-360', 'xbox-one', 'xbox-series'],
        pc: ['pc-juegos'],
        accesorios: ['juegos-accesorios', 'juegos-consolas', 'juegos-mandos', 'juegos-retro', 'juegos-software']
    };

    return categories.filter(cat => typeMap[type]?.includes(cat.id));
}
