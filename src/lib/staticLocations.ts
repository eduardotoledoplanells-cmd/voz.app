export interface Country {
    id: number;
    name: string;
}

export interface Region {
    id: number;
    country_id: number;
    name: string;
}

export interface Municipality {
    id: number;
    region_id: number;
    name: string;
}

export const staticCountries: Country[] = [
    { id: 1, name: 'España' }
];

export const staticRegions: Region[] = [
    { id: 10, country_id: 1, name: 'Comunidad de Madrid' },
    { id: 20, country_id: 1, name: 'Comunidad Valenciana' },
    { id: 30, country_id: 1, name: 'Andalucía' },
    { id: 40, country_id: 1, name: 'Cataluña' },
    { id: 50, country_id: 1, name: 'Galicia' },
    { id: 60, country_id: 1, name: 'País Vasco' }
];

export const staticMunicipalities: Municipality[] = [
    // Madrid (10)
    { id: 101, region_id: 10, name: 'Madrid' },
    { id: 102, region_id: 10, name: 'Móstoles' },
    { id: 103, region_id: 10, name: 'Alcalá de Henares' },
    { id: 104, region_id: 10, name: 'Fuenlabrada' },
    { id: 105, region_id: 10, name: 'Leganés' },
    
    // Valencia (20)
    { id: 201, region_id: 20, name: 'Valencia' },
    { id: 202, region_id: 20, name: 'Alicante' },
    { id: 203, region_id: 20, name: 'Elche' },
    { id: 204, region_id: 20, name: 'Castellón de la Plana' },
    
    // Andalucía (30)
    { id: 301, region_id: 30, name: 'Sevilla' },
    { id: 302, region_id: 30, name: 'Málaga' },
    { id: 303, region_id: 30, name: 'Córdoba' },
    { id: 304, region_id: 30, name: 'Granada' },
    
    // Cataluña (40)
    { id: 401, region_id: 40, name: 'Barcelona' },
    { id: 402, region_id: 40, name: 'L\'Hospitalet de Llobregat' },
    { id: 403, region_id: 40, name: 'Badalona' },
    { id: 404, region_id: 40, name: 'Terrassa' },
    
    // Galicia (50)
    { id: 501, region_id: 50, name: 'Vigo' },
    { id: 502, region_id: 50, name: 'A Coruña' },
    { id: 503, region_id: 50, name: 'Ourense' },
    { id: 504, region_id: 50, name: 'Santiago de Compostela' },
    
    // País Vasco (60)
    { id: 601, region_id: 60, name: 'Bilbao' },
    { id: 602, region_id: 60, name: 'Vitoria-Gasteiz' },
    { id: 603, region_id: 60, name: 'San Sebastián' }
];
