import { NextResponse } from 'next/server';
import { staticCountries, staticRegions, staticMunicipalities } from '@/lib/staticLocations';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'countries') {
            return NextResponse.json(staticCountries);
        }

        if (type === 'regions') {
            const countryId = searchParams.get('countryId');
            if (!countryId) return NextResponse.json({ error: 'Missing countryId' }, { status: 400 });
            
            const filtered = staticRegions.filter(r => r.country_id === parseInt(countryId));
            return NextResponse.json(filtered);
        }

        if (type === 'municipalities') {
            const regionId = searchParams.get('regionId');
            if (!regionId) return NextResponse.json({ error: 'Missing regionId' }, { status: 400 });
            
            const filtered = staticMunicipalities.filter(m => m.region_id === parseInt(regionId));
            return NextResponse.json(filtered);
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
