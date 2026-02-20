import { NextResponse } from 'next/server';
import { Analytics } from '@/types';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const ANALYTICS_FILE = path.join(process.cwd(), 'src', 'data', 'analytics.json');

async function getAnalytics(): Promise<Analytics> {
    try {
        const data = await readFile(ANALYTICS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {
            totalViews: 0,
            productViews: {}
        };
    }
}

async function saveAnalytics(analytics: Analytics) {
    await writeFile(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
}

// GET: Retrieve analytics data
export async function GET() {
    try {
        const analytics = await getAnalytics();

        // Convert to array and sort by view count
        const topProducts = Object.entries(analytics.productViews)
            .map(([productId, data]) => ({
                productId,
                ...data
            }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            totalViews: analytics.totalViews,
            topProducts
        });
    } catch (error) {
        console.error('Analytics GET error:', error);
        return NextResponse.json(
            { message: 'Error al obtener estadísticas' },
            { status: 500 }
        );
    }
}

// POST: Track a product view
export async function POST(request: Request) {
    try {
        const { productId, productTitle, category } = await request.json();

        if (!productId || !productTitle) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const analytics = await getAnalytics();

        // Increment total views
        analytics.totalViews++;

        // Update product-specific views
        if (!analytics.productViews[productId]) {
            analytics.productViews[productId] = {
                count: 0,
                title: productTitle,
                category: category || '',
                lastViewed: new Date().toISOString()
            };
        }

        analytics.productViews[productId].count++;
        analytics.productViews[productId].lastViewed = new Date().toISOString();

        await saveAnalytics(analytics);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics POST error:', error);
        return NextResponse.json(
            { message: 'Error al registrar vista' },
            { status: 500 }
        );
    }
}
