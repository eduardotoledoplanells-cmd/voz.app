import { NextResponse } from 'next/server';
import { getCompanies, addCompany, deleteCompany, Company, addCreator, Creator } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const data = getCompanies();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeName = 'Admin', ...companyData } = body;
        // Basic validation could go here

        const newCompany: Company = {
            id: uuidv4(),
            name: companyData.name,
            legalName: companyData.legalName || companyData.name,
            taxId: companyData.taxId,
            address: companyData.address || '',
            city: companyData.city || '',
            zip: companyData.zip || '',
            country: companyData.country || '',
            phone: companyData.phone || '',
            contactEmail: companyData.contactEmail,
            balance: companyData.balance || 0,
            joinedAt: new Date().toISOString()
        };

        const result = addCompany(newCompany, employeeName);

        // --- SYNC WITH APP PROFILE (CREATOR) ---
        // Create a corresponding profile for the company
        const handle = `@${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const newCreator: Creator = {
            id: `cr-${newCompany.id}`,
            userHandle: handle,
            realName: newCompany.name,
            totalCoins: 0,
            withdrawableCoins: 0,
            earnedEuro: 0,
            stats: {
                totalGifts: 0,
                totalPMs: 0,
                earnedFromGifts: 0,
                earnedFromPMs: 0
            },
            status: 'active',
            joinedAt: newCompany.joinedAt
        };
        addCreator(newCreator, employeeName);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const employeeName = searchParams.get('employeeName') || 'Admin';

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = deleteCompany(id, employeeName);
        if (!success) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
