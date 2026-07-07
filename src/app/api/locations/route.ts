import { NextResponse } from 'next/server';
import spainLocations from '@/lib/spainLocations.json';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'countries') {
            return NextResponse.json([{ id: 1, name: 'España' }]);
        }

        if (type === 'regions') {
            const countryId = searchParams.get('countryId');
            if (!countryId) return NextResponse.json({ error: 'Missing countryId' }, { status: 400 });
            
            const regionsList = spainLocations.map(ccaa => ({
                id: ccaa.id,
                country_id: 1,
                name: ccaa.name
            })).sort((a, b) => a.name.localeCompare(b.name));
            
            return NextResponse.json(regionsList);
        }

        if (type === 'municipalities') {
            const regionId = searchParams.get('regionId');
            if (!regionId) return NextResponse.json({ error: 'Missing regionId' }, { status: 400 });
            
            const selectedCcaa = spainLocations.find(ccaa => ccaa.id === parseInt(regionId));
            if (!selectedCcaa) return NextResponse.json([]);

            const sortedMuni = [...selectedCcaa.municipalities].sort((a, b) => a.localeCompare(b));
            const municipalitiesList = sortedMuni.map((muni, index) => ({
                id: (parseInt(regionId) * 10000) + index,
                region_id: parseInt(regionId),
                name: muni
            }));
            
            return NextResponse.json(municipalitiesList);
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
