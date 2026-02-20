import { Product, Category } from '@/types';

export const products: Product[] = [
    {
        id: '1',
        reference: 'REF-12345678',
        title: 'iPhone 13 128GB Midnight Unlocked',
        price: 450,
        images: ['https://placehold.co/300x400/png?text=iPhone+13'],
        stock: 1,
        category: 'Móviles',
        grade: 'A',
        type: 'console' // Treat phones as consoles for simplicity or ignore
    },
    {
        id: '2',
        reference: 'REF-87654321',
        title: 'PlayStation 5 Disc Edition',
        price: 420,
        images: ['https://placehold.co/300x400/png?text=PS5'],
        stock: 1,
        category: 'Juegos',
        grade: 'B',
        type: 'console'
    },
    {
        id: '3',
        reference: 'REF-11223344',
        title: 'Super Mario Odyssey (Switch)',
        price: 35,
        images: ['https://placehold.co/300x400/png?text=Mario+Odyssey'],
        stock: 1,
        category: 'Juegos',
        type: 'game'
    },
    {
        id: '4',
        reference: 'REF-44332211',
        title: 'MacBook Air M1 8GB 256GB',
        price: 650,
        images: ['https://placehold.co/300x400/png?text=MacBook+Air'],
        stock: 1,
        category: 'Informática',
        grade: 'B'
    },
    {
        id: '5',
        reference: 'REF-55667788',
        title: 'Xbox Series X 1TB',
        price: 380,
        images: ['https://placehold.co/300x400/png?text=Xbox+Series+X'],
        stock: 1,
        category: 'Juegos',
        grade: 'A',
        type: 'console'
    },
    {
        id: '6',
        reference: 'REF-99887766',
        title: 'Samsung Galaxy S21 5G 128GB',
        price: 280,
        images: ['https://placehold.co/300x400/png?text=Galaxy+S21'],
        stock: 1,
        category: 'Móviles',
        grade: 'C'
    },
    // Dummy products for new categories
    // 3DS
    {
        id: '7',
        reference: 'REF-77889900',
        title: 'Nintendo 3DS XL Blue',
        price: 120,
        images: ['https://placehold.co/300x400/png?text=3DS+XL'],
        stock: 1,
        category: '3DS',
        grade: 'B',
        type: 'console'
    },
    {
        id: '7-game',
        reference: 'REF-77889901',
        title: 'Mario Kart 7 (3DS)',
        price: 25,
        images: ['https://placehold.co/300x400/png?text=Mario+Kart+7'],
        stock: 1,
        category: '3DS',
        type: 'game'
    },
    {
        id: '7-acc',
        reference: 'REF-77889902',
        title: 'Cargador Nintendo 3DS',
        price: 10,
        images: ['https://placehold.co/300x400/png?text=Cargador+3DS'],
        stock: 1,
        category: '3DS',
        type: 'accessory'
    },
    // DS
    {
        id: '8',
        reference: 'REF-88990011',
        title: 'Nintendo DS Lite White',
        price: 50,
        images: ['https://placehold.co/300x400/png?text=DS+Lite'],
        stock: 1,
        category: 'DS',
        type: 'console'
    },
    {
        id: '8-game',
        reference: 'REF-88990012',
        title: 'Pokemon Diamond (DS)',
        price: 45,
        images: ['https://placehold.co/300x400/png?text=Pokemon+Diamond'],
        stock: 1,
        category: 'DS',
        type: 'game'
    },
    {
        id: '8-acc',
        reference: 'REF-88990013',
        title: 'Funda Nintendo DS',
        price: 8,
        images: ['https://placehold.co/300x400/png?text=Funda+DS'],
        stock: 1,
        category: 'DS',
        type: 'accessory'
    },
    // Switch
    {
        id: '9',
        reference: 'REF-99001122',
        title: 'Nintendo Switch OLED White',
        price: 280,
        images: ['https://placehold.co/300x400/png?text=Switch+OLED'],
        stock: 1,
        category: 'Switch',
        grade: 'A',
        type: 'console'
    },
    {
        id: '9-game',
        reference: 'REF-99001123',
        title: 'Zelda: Breath of the Wild (Switch)',
        price: 40,
        images: ['https://placehold.co/300x400/png?text=Zelda+BOTW'],
        stock: 1,
        category: 'Switch',
        type: 'game'
    },
    {
        id: '9-acc',
        reference: 'REF-99001124',
        title: 'Funda de Viaje Switch',
        price: 15,
        images: ['https://placehold.co/300x400/png?text=Funda+Switch'],
        stock: 1,
        category: 'Switch',
        type: 'accessory'
    },
    // Wii
    {
        id: '10',
        reference: 'REF-00112233',
        title: 'Nintendo Wii Console White',
        price: 40,
        images: ['https://placehold.co/300x400/png?text=Wii+Console'],
        stock: 1,
        category: 'Wii',
        type: 'console'
    },
    {
        id: '10-game',
        reference: 'REF-00112234',
        title: 'Wii Sports (Wii)',
        price: 15,
        images: ['https://placehold.co/300x400/png?text=Wii+Sports'],
        stock: 1,
        category: 'Wii',
        type: 'game'
    },
    {
        id: '10-acc',
        reference: 'REF-00112235',
        title: 'Wii Remote Plus',
        price: 20,
        images: ['https://placehold.co/300x400/png?text=Wii+Remote'],
        stock: 1,
        category: 'Wii',
        type: 'accessory'
    },
    // Wii U
    {
        id: '11',
        reference: 'REF-11223355',
        title: 'Nintendo Wii U Premium 32GB',
        price: 100,
        images: ['https://placehold.co/300x400/png?text=Wii+U'],
        stock: 1,
        category: 'Wii U',
        type: 'console'
    },
    {
        id: '11-game',
        reference: 'REF-11223356',
        title: 'Zelda Wind Waker HD (Wii U)',
        price: 40,
        images: ['https://placehold.co/300x400/png?text=Zelda+WW'],
        stock: 1,
        category: 'Wii U',
        type: 'game'
    },
    {
        id: '11-acc',
        reference: 'REF-11223357',
        title: 'Wii U Pro Controller',
        price: 30,
        images: ['https://placehold.co/300x400/png?text=Pro+Controller'],
        stock: 1,
        category: 'Wii U',
        type: 'accessory'
    },
    // PS2
    {
        id: '12',
        reference: 'REF-22334466',
        title: 'PlayStation 2 Slim',
        price: 50,
        images: ['https://placehold.co/300x400/png?text=PS2+Slim'],
        stock: 1,
        category: 'PlayStation 2',
        type: 'console'
    },
    {
        id: '12-game',
        reference: 'REF-22334467',
        title: 'GTA San Andreas (PS2)',
        price: 12,
        images: ['https://placehold.co/300x400/png?text=GTA+SA'],
        stock: 1,
        category: 'PlayStation 2',
        type: 'game'
    },
    {
        id: '12-acc',
        reference: 'REF-22334468',
        title: 'Memory Card 8MB PS2',
        price: 5,
        images: ['https://placehold.co/300x400/png?text=Memory+Card'],
        stock: 1,
        category: 'PlayStation 2',
        type: 'accessory'
    },
    // PS3
    {
        id: '13',
        reference: 'REF-33445577',
        title: 'PlayStation 3 Slim 160GB',
        price: 70,
        images: ['https://placehold.co/300x400/png?text=PS3+Slim'],
        stock: 1,
        category: 'PlayStation 3',
        type: 'console'
    },
    {
        id: '13-game',
        reference: 'REF-33445578',
        title: 'The Last of Us (PS3)',
        price: 15,
        images: ['https://placehold.co/300x400/png?text=TLOU+PS3'],
        stock: 1,
        category: 'PlayStation 3',
        type: 'game'
    },
    {
        id: '13-acc',
        reference: 'REF-33445579',
        title: 'DualShock 3 Controller',
        price: 20,
        images: ['https://placehold.co/300x400/png?text=DualShock+3'],
        stock: 1,
        category: 'PlayStation 3',
        type: 'accessory'
    },
    // PS4
    {
        id: '14',
        reference: 'REF-44556688',
        title: 'PlayStation 4 Slim 500GB',
        price: 150,
        images: ['https://placehold.co/300x400/png?text=PS4+Slim'],
        stock: 1,
        category: 'PlayStation 4',
        type: 'console'
    },
    {
        id: '14-game',
        reference: 'REF-44556689',
        title: 'God of War (PS4)',
        price: 18,
        images: ['https://placehold.co/300x400/png?text=GOW+PS4'],
        stock: 1,
        category: 'PlayStation 4',
        type: 'game'
    },
    {
        id: '14-acc',
        reference: 'REF-44556690',
        title: 'DualShock 4 Controller',
        price: 35,
        images: ['https://placehold.co/300x400/png?text=DualShock+4'],
        stock: 1,
        category: 'PlayStation 4',
        type: 'accessory'
    },
    // PS5
    {
        id: '15',
        reference: 'REF-55667799',
        title: 'PlayStation 5 Digital Edition',
        price: 380,
        images: ['https://placehold.co/300x400/png?text=PS5+Digital'],
        stock: 1,
        category: 'PlayStation 5',
        type: 'console'
    },
    {
        id: '15-game',
        reference: 'REF-55667700',
        title: 'Spider-Man 2 (PS5)',
        price: 55,
        images: ['https://placehold.co/300x400/png?text=Spider-Man+2'],
        stock: 1,
        category: 'PlayStation 5',
        type: 'game'
    },
    {
        id: '15-acc',
        reference: 'REF-55667701',
        title: 'DualSense Charging Station',
        price: 25,
        images: ['https://placehold.co/300x400/png?text=Charging+Station'],
        stock: 1,
        category: 'PlayStation 5',
        type: 'accessory'
    },
    // PS Vita
    {
        id: '16',
        reference: 'REF-66778800',
        title: 'PS Vita OLED Model',
        price: 120,
        images: ['https://placehold.co/300x400/png?text=PS+Vita'],
        stock: 1,
        category: 'PS Vita',
        type: 'console'
    },
    {
        id: '16-game',
        reference: 'REF-66778801',
        title: 'Persona 4 Golden (PS Vita)',
        price: 45,
        images: ['https://placehold.co/300x400/png?text=P4G'],
        stock: 1,
        category: 'PS Vita',
        type: 'game'
    },
    {
        id: '16-acc',
        reference: 'REF-66778802',
        title: 'Memory Card 16GB PS Vita',
        price: 30,
        images: ['https://placehold.co/300x400/png?text=Vita+Memory'],
        stock: 1,
        category: 'PS Vita',
        type: 'accessory'
    },
    // PSP
    {
        id: '17',
        reference: 'REF-77889911',
        title: 'PSP 3000 Black',
        price: 60,
        images: ['https://placehold.co/300x400/png?text=PSP+3000'],
        stock: 1,
        category: 'PSP',
        type: 'console'
    },
    {
        id: '17-game',
        reference: 'REF-77889912',
        title: 'God of War: Chains of Olympus (PSP)',
        price: 25,
        images: ['https://placehold.co/300x400/png?text=GOW+PSP'],
        stock: 1,
        category: 'PSP',
        type: 'game'
    },
    {
        id: '17-acc',
        reference: 'REF-77889913',
        title: 'Funda PSP',
        price: 10,
        images: ['https://placehold.co/300x400/png?text=Funda+PSP'],
        stock: 1,
        category: 'PSP',
        type: 'accessory'
    },
    // Xbox 360
    {
        id: '18',
        reference: 'REF-88990022',
        title: 'Xbox 360 Slim 250GB',
        price: 60,
        images: ['https://placehold.co/300x400/png?text=Xbox+360'],
        stock: 1,
        category: 'Xbox 360',
        type: 'console'
    },
    {
        id: '18-game',
        reference: 'REF-88990023',
        title: 'Halo 3 (Xbox 360)',
        price: 10,
        images: ['https://placehold.co/300x400/png?text=Halo+3'],
        stock: 1,
        category: 'Xbox 360',
        type: 'game'
    },
    {
        id: '18-acc',
        reference: 'REF-88990024',
        title: 'Xbox 360 Wireless Controller',
        price: 20,
        images: ['https://placehold.co/300x400/png?text=360+Controller'],
        stock: 1,
        category: 'Xbox 360',
        type: 'accessory'
    },
    // Xbox One
    {
        id: '19',
        reference: 'REF-99001133',
        title: 'Xbox One S 1TB',
        price: 140,
        images: ['https://placehold.co/300x400/png?text=Xbox+One+S'],
        stock: 1,
        category: 'Xbox One',
        type: 'console'
    },
    {
        id: '19-game',
        reference: 'REF-99001134',
        title: 'Forza Horizon 4 (Xbox One)',
        price: 25,
        images: ['https://placehold.co/300x400/png?text=Forza+4'],
        stock: 1,
        category: 'Xbox One',
        type: 'game'
    },
    {
        id: '19-acc',
        reference: 'REF-99001135',
        title: 'Xbox One Controller',
        price: 35,
        images: ['https://placehold.co/300x400/png?text=One+Controller'],
        stock: 1,
        category: 'Xbox One',
        type: 'accessory'
    },
    // Xbox Series
    {
        id: '20',
        reference: 'REF-00112244',
        title: 'Xbox Series S 512GB',
        price: 220,
        images: ['https://placehold.co/300x400/png?text=Series+S'],
        stock: 1,
        category: 'Xbox Series',
        type: 'console'
    },
    {
        id: '20-game',
        reference: 'REF-00112245',
        title: 'Starfield (Xbox Series)',
        price: 45,
        images: ['https://placehold.co/300x400/png?text=Starfield'],
        stock: 1,
        category: 'Xbox Series',
        type: 'game'
    },
    {
        id: '20-acc',
        reference: 'REF-00112246',
        title: 'Xbox Wireless Headset',
        price: 80,
        images: ['https://placehold.co/300x400/png?text=Xbox+Headset'],
        stock: 1,
        category: 'Xbox Series',
        type: 'accessory'
    },
    // PC
    {
        id: '21',
        reference: 'REF-11223366',
        title: 'Gaming PC RTX 3060',
        price: 800,
        images: ['https://placehold.co/300x400/png?text=Gaming+PC'],
        stock: 1,
        category: 'PC Juegos',
        type: 'console' // Treating PC as console for structure
    },
    {
        id: '21-game',
        reference: 'REF-11223367',
        title: 'Cyberpunk 2077 (PC)',
        price: 30,
        images: ['https://placehold.co/300x400/png?text=Cyberpunk'],
        stock: 1,
        category: 'PC Juegos',
        type: 'accessory'
    },

];

export const categories: Category[] = [
    // Main categories
    { id: 'juegos', name: 'Juegos', slug: 'juegos', image: 'https://placehold.co/100x100?text=Juegos' },
    { id: 'moviles', name: 'Móviles', slug: 'moviles', image: 'https://placehold.co/100x100?text=Moviles' },
    { id: 'informatica', name: 'Informática', slug: 'informatica', image: 'https://placehold.co/100x100?text=PC' },
    { id: 'electronica', name: 'Electrónica', slug: 'electronica', image: 'https://placehold.co/100x100?text=Elec' },
    { id: 'peliculas', name: 'Películas', slug: 'peliculas', image: 'https://placehold.co/100x100?text=Peliculas' },
    { id: 'musica', name: 'Música', slug: 'musica', image: 'https://placehold.co/100x100?text=Musica' },

    // Movies subcategories
    { id: 'peliculas-vhs', name: 'Películas - VHS', slug: 'peliculas-vhs', image: '/categories/category_vhs_1764752303670.png' },
    { id: 'peliculas-dvd', name: 'Películas - DVD', slug: 'peliculas-dvd', image: '/categories/category_dvd_1764752467930.png' },
    { id: 'peliculas-bluray', name: 'Películas - Blu-Ray', slug: 'peliculas-bluray', image: '/categories/category_bluray_1764752606672.png' },

    // Computing subcategories
    { id: 'informatica-tablets', name: 'Informática - Tablets', slug: 'informatica-tablets', image: '/categories/category_tablet_1764752725469.png' },
    { id: 'informatica-portatiles', name: 'Informática - Portátiles', slug: 'informatica-portatiles', image: '/categories/category_laptop_1764752889425.png' },
    { id: 'informatica-sobremesa', name: 'Informática - Sobremesa', slug: 'informatica-sobremesa', image: '/categories/category_desktop_1764752959008.png' },
    { id: 'informatica-monitores', name: 'Informática - Monitores', slug: 'informatica-monitores', image: '/categories/category_monitor_1764752985118.png' },
    { id: 'informatica-accesorios', name: 'Informática - Accesorios', slug: 'informatica-accesorios', image: 'https://placehold.co/100x100?text=Accesorios+PC' },

    // Juegos subcategories
    { id: 'juegos-3ds', name: 'Juegos - 3DS', slug: 'juegos-3ds', image: 'https://placehold.co/100x100?text=3DS' },
    { id: 'juegos-ds', name: 'Juegos - DS', slug: 'juegos-ds', image: 'https://placehold.co/100x100?text=DS' },
    { id: 'juegos-accesorios', name: 'Juegos - Accesorios', slug: 'juegos-accesorios', image: 'https://placehold.co/100x100?text=Accesorios' },
    { id: 'juegos-consolas', name: 'Juegos - Consolas', slug: 'juegos-consolas', image: 'https://placehold.co/100x100?text=Consolas' },
    { id: 'juegos-mandos', name: 'Juegos - Mandos', slug: 'juegos-mandos', image: 'https://placehold.co/100x100?text=Mandos' },
    { id: 'juegos-retro', name: 'Juegos - Retro', slug: 'juegos-retro', image: 'https://placehold.co/100x100?text=Retro' },
    { id: 'juegos-software', name: 'Juegos - Software', slug: 'juegos-software', image: 'https://placehold.co/100x100?text=Software' },
    { id: 'juegos-pc', name: 'Juegos - PC', slug: 'juegos-pc', image: 'https://placehold.co/100x100?text=PC+Juegos' },
    { id: 'juegos-ps2', name: 'Juegos - PlayStation 2', slug: 'juegos-ps2', image: 'https://placehold.co/100x100?text=PS2' },
    { id: 'juegos-ps3', name: 'Juegos - PlayStation 3', slug: 'juegos-ps3', image: 'https://placehold.co/100x100?text=PS3' },
    { id: 'juegos-ps4', name: 'Juegos - PlayStation 4', slug: 'juegos-ps4', image: 'https://placehold.co/100x100?text=PS4' },
    { id: 'juegos-ps5', name: 'Juegos - PlayStation 5', slug: 'juegos-ps5', image: 'https://placehold.co/100x100?text=PS5' },
    { id: 'juegos-psvita', name: 'Juegos - PS Vita', slug: 'juegos-psvita', image: 'https://placehold.co/100x100?text=Vita' },
    { id: 'juegos-psp', name: 'Juegos - PSP', slug: 'juegos-psp', image: 'https://placehold.co/100x100?text=PSP' },
    { id: 'juegos-switch', name: 'Juegos - Switch', slug: 'juegos-switch', image: 'https://placehold.co/100x100?text=Switch' },
    { id: 'juegos-switch2', name: 'Juegos - Switch 2', slug: 'juegos-switch2', image: 'https://placehold.co/100x100?text=Switch+2' },
    { id: 'juegos-wii', name: 'Juegos - Wii', slug: 'juegos-wii', image: 'https://placehold.co/100x100?text=Wii' },
    { id: 'juegos-wiiu', name: 'Juegos - Wii U', slug: 'juegos-wiiu', image: 'https://placehold.co/100x100?text=WiiU' },
    { id: 'juegos-xbox360', name: 'Juegos - Xbox 360', slug: 'juegos-xbox360', image: 'https://placehold.co/100x100?text=X360' },
    { id: 'juegos-xboxone', name: 'Juegos - Xbox One', slug: 'juegos-xboxone', image: 'https://placehold.co/100x100?text=XOne' },
    { id: 'juegos-xboxseries', name: 'Juegos - Xbox Series', slug: 'juegos-xboxseries', image: 'https://placehold.co/100x100?text=Series' },
];
