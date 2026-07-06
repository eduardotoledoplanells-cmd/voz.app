import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'countries') {
            const { data, error } = await supabase.from('countries').select('*').order('name');
            if (error) throw error;
            return NextResponse.json(data);
        }

        if (type === 'regions') {
            const countryId = searchParams.get('countryId');
            if (!countryId) return NextResponse.json({ error: 'Missing countryId' }, { status: 400 });
            
            const { data, error } = await supabase.from('regions').select('*').eq('country_id', countryId).order('name');
            if (error) throw error;
            return NextResponse.json(data);
        }

        if (type === 'municipalities') {
            const regionId = searchParams.get('regionId');
            if (!regionId) return NextResponse.json({ error: 'Missing regionId' }, { status: 400 });
            
            const { data, error } = await supabase.from('municipalities').select('*').eq('region_id', regionId).order('name');
            if (error) throw error;
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
