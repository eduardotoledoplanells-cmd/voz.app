import { NextResponse } from 'next/server';
import { getCampaigns, addCampaign, deleteCampaign, incrementCampaignImpressions, Campaign, getCompanies } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const [campaigns, companies] = await Promise.all([
            getCampaigns(),
            getCompanies()
        ]);

        // Join campaigns with company info (name and derived handle)
        const enrichedCampaigns = campaigns.map(camp => {
            const company = companies.find(c => c.id === camp.companyId);
            return {
                ...camp,
                companyName: company ? company.name : 'Voz Promoción',
                companyHandle: company ? `@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '@voz_promocion'
            };
        });

        return NextResponse.json(enrichedCampaigns);
    } catch (error) {
        console.error('Error fetching enriched campaigns:', error);
        return NextResponse.json({ error: 'Failed to fetch enriched campaigns' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeName = 'Admin', ...campaignData } = body;

        const newCampaign: Campaign = {
            id: uuidv4(),
            companyId: campaignData.companyId,
            name: campaignData.name,
            budget: campaignData.budget || 0,
            status: 'draft',
            type: campaignData.type || 'video',
            videoUrl: campaignData.videoUrl || '',
            startDate: campaignData.startDate || null,
            endDate: campaignData.endDate || null,
            forceView: campaignData.forceView || false,
            target: campaignData.target || 'all',
            impressions: 0,
            createdAt: new Date().toISOString()
        };

        const result = await addCampaign(newCampaign, employeeName);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        if (id && action === 'impression') {
            const success = await incrementCampaignImpressions(id);
            if (!success) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action or missing ID' }, { status: 400 });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const employeeName = searchParams.get('employeeName') || 'Admin';

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = await deleteCampaign(id, employeeName);
        if (!success) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }
}
