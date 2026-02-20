export interface SubCategory {
    id: string;
    name: string;
    subcategories?: SubCategory[];
}

export interface MainCategory {
    id: string;
    name: string;
    subcategories: SubCategory[];
}

export const categoryStructure: MainCategory[] = [
    {
        id: 'juegos',
        name: 'Juegos',
        subcategories: [
            {
                id: 'juegos-retro',
                name: 'Juegos Retro',
                subcategories: [
                    {
                        id: 'retro-nintendo',
                        name: 'Nintendo',
                        subcategories: [
                            {
                                id: 'nintendo-gameboy',
                                name: 'Nintendo Game Boy',
                                subcategories: [
                                    { id: 'gameboy-juegos', name: 'Juegos' },
                                    { id: 'gameboy-consolas', name: 'Consolas' },
                                    { id: 'gameboy-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-nes',
                                name: 'Nintendo (NES)',
                                subcategories: [
                                    { id: 'nes-juegos', name: 'Juegos' },
                                    { id: 'nes-consolas', name: 'Consolas' },
                                    { id: 'nes-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-snes',
                                name: 'Super Nintendo',
                                subcategories: [
                                    { id: 'snes-juegos', name: 'Juegos' },
                                    { id: 'snes-consolas', name: 'Consolas' },
                                    { id: 'snes-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-ds',
                                name: 'Nintendo DS',
                                subcategories: [
                                    { id: 'ds-juegos', name: 'Juegos' },
                                    { id: 'ds-consolas', name: 'Consolas' },
                                    { id: 'ds-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'game-cube',
                                name: 'Game Cube',
                                subcategories: [
                                    { id: 'game-cube-juegos', name: 'Juegos' },
                                    { id: 'game-cube-consolas', name: 'Consolas' },
                                    { id: 'game-cube-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-3ds',
                                name: 'Nintendo 3DS',
                                subcategories: [
                                    { id: '3ds-juegos', name: 'Juegos' },
                                    { id: '3ds-consolas', name: 'Consolas' },
                                    { id: '3ds-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-wii',
                                name: 'Wii',
                                subcategories: [
                                    { id: 'wii-juegos', name: 'Juegos' },
                                    { id: 'wii-consolas', name: 'Consolas' },
                                    { id: 'wii-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'nintendo-wii-u',
                                name: 'Wii U',
                                subcategories: [
                                    { id: 'wiiu-juegos', name: 'Juegos' },
                                    { id: 'wiiu-consolas', name: 'Consolas' },
                                    { id: 'wiiu-accesorios', name: 'Accesorios' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'retro-sega',
                        name: 'Sega',
                        subcategories: [
                            {
                                id: 'master-system',
                                name: 'Master System',
                                subcategories: [
                                    { id: 'master-system-juegos', name: 'Juegos' },
                                    { id: 'master-system-consolas', name: 'Consolas' },
                                    { id: 'master-system-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'game-gear',
                                name: 'Game Gear',
                                subcategories: [
                                    { id: 'game-gear-juegos', name: 'Juegos' },
                                    { id: 'game-gear-consolas', name: 'Consolas' },
                                    { id: 'game-gear-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'mega-drive',
                                name: 'Mega Drive',
                                subcategories: [
                                    { id: 'mega-drive-juegos', name: 'Juegos' },
                                    { id: 'mega-drive-consolas', name: 'Consolas' },
                                    { id: 'mega-drive-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'sega-saturn',
                                name: 'Sega Saturn',
                                subcategories: [
                                    { id: 'sega-saturn-juegos', name: 'Juegos' },
                                    { id: 'sega-saturn-consolas', name: 'Consolas' },
                                    { id: 'sega-saturn-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'dreamcast',
                                name: 'Sega Dreamcast',
                                subcategories: [
                                    { id: 'dreamcast-juegos', name: 'Juegos' },
                                    { id: 'dreamcast-consolas', name: 'Consolas' },
                                    { id: 'dreamcast-accesorios', name: 'Accesorios' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'xbox-retro-collection',
                        name: 'XBOX 1,2,3',
                        subcategories: [
                            {
                                id: 'retro-xbox',
                                name: 'Xbox Clásica',
                                subcategories: [
                                    { id: 'xbox-juegos', name: 'Juegos' },
                                    { id: 'xbox-consolas', name: 'Consolas' },
                                    { id: 'xbox-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'xbox-360',
                                name: 'Xbox 360',
                                subcategories: [
                                    { id: '360-juegos', name: 'Juegos' },
                                    { id: '360-consolas', name: 'Consolas' },
                                    { id: '360-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'xbox-one',
                                name: 'Xbox One',
                                subcategories: [
                                    { id: 'one-juegos', name: 'Juegos' },
                                    { id: 'one-consolas', name: 'Consolas' },
                                    { id: 'one-accesorios', name: 'Accesorios' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'playstation-retro-collection',
                        name: 'PlayStation 1,2,3',
                        subcategories: [
                            {
                                id: 'playstation-1',
                                name: 'PlayStation 1',
                                subcategories: [
                                    { id: 'ps1-juegos', name: 'Juegos' },
                                    { id: 'ps1-consolas', name: 'Consolas' },
                                    { id: 'ps1-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'playstation-2',
                                name: 'PlayStation 2',
                                subcategories: [
                                    { id: 'ps2-juegos', name: 'Juegos' },
                                    { id: 'ps2-consolas', name: 'Consolas' },
                                    { id: 'ps2-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'playstation-3',
                                name: 'PlayStation 3',
                                subcategories: [
                                    { id: 'ps3-juegos', name: 'Juegos' },
                                    { id: 'ps3-consolas', name: 'Consolas' },
                                    { id: 'ps3-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'psp',
                                name: 'PSP',
                                subcategories: [
                                    { id: 'psp-juegos', name: 'Juegos' },
                                    { id: 'psp-consolas', name: 'Consolas' },
                                    { id: 'psp-accesorios', name: 'Accesorios' },
                                ]
                            },
                            {
                                id: 'ps-vita',
                                name: 'PS Vita',
                                subcategories: [
                                    { id: 'psvita-juegos', name: 'Juegos' },
                                    { id: 'psvita-consolas', name: 'Consolas' },
                                    { id: 'psvita-accesorios', name: 'Accesorios' },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'retro-otros',
                        name: 'Otros',
                        subcategories: []
                    },
                ]
            },
            {
                id: 'modern-nintendo-hub',
                name: 'Nintendo',
                subcategories: [
                    {
                        id: 'nintendo-switch',
                        name: 'Nintendo Switch',
                        subcategories: [
                            { id: 'switch-juegos', name: 'Juegos' },
                            { id: 'switch-consolas', name: 'Consolas' },
                            { id: 'switch-accesorios', name: 'Accesorios' },
                        ]
                    },
                    {
                        id: 'nintendo-switch-2',
                        name: 'Nintendo Switch 2',
                        subcategories: [
                            { id: 'switch2-juegos', name: 'Juegos' },
                            { id: 'switch2-consolas', name: 'Consolas' },
                            { id: 'switch2-accesorios', name: 'Accesorios' },
                        ]
                    },
                ]
            },
            {
                id: 'playstation-hub',
                name: 'PlayStation',
                subcategories: [
                    { id: 'playstation-1', name: 'PlayStation 1' },
                    { id: 'playstation-2', name: 'PlayStation 2' },
                    { id: 'playstation-3', name: 'PlayStation 3' },
                    { id: 'playstation-4', name: 'PlayStation 4' },
                    { id: 'playstation-5', name: 'PlayStation 5' },
                    {
                        id: 'ps-portal',
                        name: 'PS Portal',
                        subcategories: [
                            { id: 'psportal-consolas', name: 'Consolas' },
                        ]
                    },
                ]
            },
            {
                id: 'xbox-hub',
                name: 'Xbox',
                subcategories: [
                    { id: 'retro-xbox', name: 'Xbox Clásica' },
                    { id: 'xbox-360', name: 'Xbox 360' },
                    { id: 'xbox-one', name: 'Xbox One' },
                    { id: 'xbox-series', name: 'Xbox Series' },
                ]
            },
            {
                id: 'pc-juegos',
                name: 'PC Juegos',
                subcategories: []
            },

        ]
    },
    {
        id: 'moviles',
        name: 'Móviles',
        subcategories: [
            { id: 'moviles-apple', name: 'Apple' },
            { id: 'moviles-samsung', name: 'Samsung' },
            { id: 'moviles-xiaomi', name: 'Xiaomi' },
            { id: 'moviles-huawei', name: 'Huawei' },
            { id: 'moviles-oneplus', name: 'OnePlus' },
            { id: 'moviles-google', name: 'Google' },
            { id: 'moviles-oppo', name: 'Oppo' },
            { id: 'moviles-realme', name: 'Realme' }
        ]
    },
    {
        id: 'informatica',
        name: 'Informática',
        subcategories: [
            { id: 'informatica-portatiles', name: 'Portátiles' },
            { id: 'informatica-sobremesa', name: 'Sobremesa' },
            { id: 'informatica-tablets', name: 'Tablets' },
            { id: 'informatica-monitores', name: 'Monitores' },
            { id: 'informatica-accesorios', name: 'Accesorios' }
        ]
    },
    {
        id: 'electronica',
        name: 'Electrónica',
        subcategories: [
            { id: 'electronica-audio', name: 'Audio' },
            { id: 'electronica-television', name: 'Televisión' },
            { id: 'electronica-camaras', name: 'Cámaras' },
            { id: 'electronica-smartwatch', name: 'Smartwatch' },
            { id: 'electronica-accesorios', name: 'Accesorios' }
        ]
    },
    {
        id: 'peliculas',
        name: 'Películas',
        subcategories: [
            { id: 'peliculas-bluray', name: 'Blu-Ray' },
            { id: 'peliculas-dvd', name: 'DVD' },
            { id: 'peliculas-vhs', name: 'VHS' }
        ]
    },
    {
        id: 'musica',
        name: 'Música',
        subcategories: [
            { id: 'musica-vinilo', name: 'Vinilo' },
            { id: 'musica-cd', name: 'CD' }
        ]
    }
];

export interface CategoryContext {
    path: { id: string; name: string; slug?: string }[];
    current: SubCategory | MainCategory;
    siblings: SubCategory[];
    parent: SubCategory | MainCategory | null;
}

// Helper function to recursively search the tree
export function getCategoryContext(slug: string): CategoryContext | null {
    const findInArray = (
        cats: (MainCategory | SubCategory)[],
        targetSlug: string,
        currentPath: { id: string; name: string; slug?: string }[],
        parent: SubCategory | MainCategory | null
    ): CategoryContext | null => {
        for (const cat of cats) {
            // Check matching ID or Slug (if present)
            const idMatch = cat.id === targetSlug;
            // Some cats don't have explicit slug in this file, assume id usually matches slug

            if (idMatch) {
                return {
                    path: [...currentPath, { id: cat.id, name: cat.name }],
                    current: cat,
                    siblings: parent ? (parent.subcategories || []) : categoryStructure,
                    parent: parent
                };
            }

            if (cat.subcategories) {
                const result = findInArray(
                    cat.subcategories,
                    targetSlug,
                    [...currentPath, { id: cat.id, name: cat.name }],
                    cat
                );
                if (result) return result;
            }
        }
        return null;
    };

    return findInArray(categoryStructure, slug, [], null);
}
