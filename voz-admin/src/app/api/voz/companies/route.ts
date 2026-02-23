import { NextResponse } from 'next/server';
import { getCompanies, addCompany, deleteCompany, Company, addCreator, Creator } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const data = await getCompanies();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeName = 'Admin', ...companyData } = body;

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

        const result = await addCompany(newCompany, employeeName);

        // --- SYNC WITH APP PROFILE (CREATOR) ---
        const handle = `@${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const newCreator: any = {
            id: `cr-${newCompany.id}`,
            handle: handle,
            status: 'active',
            reputation: 10,
            walletBalance: 0,
            joinedAt: newCompany.joinedAt
        };
        await addCreator(newCreator, employeeName);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const employeeName = searchParams.get('employeeName') || 'Admin';

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = await deleteCompany(id, employeeName);
        if (!success) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
