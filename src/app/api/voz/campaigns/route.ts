import { NextResponse } from 'next/server';
import { getCampaigns, addCampaign, getCompanies, addCompany, Campaign, Company } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get('userHandle');

        if (!userHandle) {
            return NextResponse.json({ error: 'userHandle is required' }, { status: 400 });
        }

        const [campaigns, companies] = await Promise.all([
            getCampaigns(),
            getCompanies()
        ]);

        // Find company associated with the userHandle
        // We match company.name === userHandle since we use it to auto-create companies
        const userCompany = companies.find(c => c.name === userHandle);

        if (!userCompany) {
            // User has no company yet, so no campaigns
            return NextResponse.json([]);
        }

        // Filter campaigns belonging to this company
        const userCampaigns = campaigns.filter(c => c.companyId === userCompany.id);

        return NextResponse.json(userCampaigns);
    } catch (error) {
        console.error('Error fetching creator campaigns:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userHandle, userRealName, userEmail, ...campaignData } = body;

        if (!userHandle || !campaignData.videoUrl || !campaignData.name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if company exists
        const companies = await getCompanies();
        let userCompany = companies.find(c => c.name === userHandle);

        if (!userCompany) {
            // Create company for the creator
            const newCompany: Company = {
                id: uuidv4(),
                name: userHandle,
                legalName: userRealName || userHandle,
                taxId: 'CREATOR',
                address: '',
                city: '',
                zip: '',
                country: '',
                phone: '',
                contactEmail: userEmail || '',
                balance: 0,
                joinedAt: new Date().toISOString()
            };

            const addedCompany = await addCompany(newCompany, 'Creator Auto');
            if (!addedCompany) {
                return NextResponse.json({ error: 'Failed to create company for creator' }, { status: 500 });
            }
            userCompany = addedCompany;
        }

        // Create campaign
        const newCampaign: Campaign = {
            id: uuidv4(),
            companyId: userCompany.id,
            name: campaignData.name,
            budget: campaignData.budget || 0,
            status: 'draft', // Campaigns start as draft or active depending on billing
            type: 'video',
            videoUrl: campaignData.videoUrl,
            startDate: new Date().toISOString(),
            endDate: null,
            forceView: false,
            minViewTime: 0,
            target: 'all',
            impressions: 0,
            createdAt: new Date().toISOString(),
            targetCountries: campaignData.targetCountries || [],
            targetRegions: campaignData.targetRegions || [],
            targetInterests: campaignData.targetInterests || [],
            target_municipalities: campaignData.target_municipalities || [],
            priority: campaignData.priority || 'Local_Standard',
            packSize: campaignData.packSize || 1000 // Default 1000 impressions pack
        };

        // If packSize is 0, it means infinite/budget based. But for creators we use packs.
        if (newCampaign.packSize > 0) {
             newCampaign.status = 'active'; // Auto-activate creator packs for testing
        }

        const result = await addCampaign(newCampaign, userHandle);
        return NextResponse.json({ success: true, campaign: result });
    } catch (error) {
        console.error('Error creating creator campaign:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}
