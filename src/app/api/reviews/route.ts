import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { rateLimiter } from '@/lib/rate-limiter';

const reviewsFilePath = path.join(process.cwd(), 'src', 'data', 'reviews.json');

// Ensure reviews file exists
async function ensureReviewsFile() {
    try {
        await fs.access(reviewsFilePath);
    } catch {
        const dir = path.dirname(reviewsFilePath);
        await fs.mkdir(dir, { recursive: true });
        // Initial dummy reviews
        const initialReviews = [
            {
                id: '1',
                productId: '1',
                userName: 'Juan Pérez',
                rating: 5,
                comment: 'Excelente teléfono, llegó muy rápido y en perfecto estado.',
                date: new Date().toISOString(),
                approved: true
            },
            {
                id: '2',
                productId: '1',
                userName: 'María García',
                rating: 4,
                comment: 'Buen producto, aunque la batería podría durar un poco más.',
                date: new Date(Date.now() - 86400000).toISOString(),
                approved: true
            },
            {
                id: '3',
                productId: '2',
                userName: 'Carlos Ruiz',
                rating: 5,
                comment: 'La PS5 es increíble, gráficos espectaculares.',
                date: new Date(Date.now() - 172800000).toISOString(),
                approved: true
            }
        ];
        await fs.writeFile(reviewsFilePath, JSON.stringify(initialReviews, null, 2));
    }
}

export async function GET(request: Request) {
    try {
        await ensureReviewsFile();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        const data = await fs.readFile(reviewsFilePath, 'utf-8');
        const reviews = JSON.parse(data);

        if (productId) {
            // Only return approved reviews
            const filteredReviews = reviews.filter((r: any) => r.productId === productId && r.approved === true);
            return NextResponse.json(filteredReviews);
        }

        // Only return approved reviews
        const approvedReviews = reviews.filter((r: any) => r.approved === true);

        return NextResponse.json(approvedReviews);
    } catch (error) {
        console.error('Error reading reviews:', error);
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureReviewsFile();
        const newReview = await request.json();

        // Rate limiting: 1 review per hour per user
        const userId = newReview.userName || 'anonymous';
        const hourInMs = 60 * 60 * 1000;

        if (!rateLimiter.check(`review:${userId}`, 1, hourInMs)) {
            const resetTime = rateLimiter.getResetTime(`review:${userId}`);
            const minutesLeft = Math.ceil(resetTime / (60 * 1000));
            return NextResponse.json(
                { error: `Debes esperar ${minutesLeft} minutos antes de publicar otro comentario.` },
                { status: 429 }
            );
        }

        // Add ID if missing
        if (!newReview.id) {
            newReview.id = Date.now().toString();
        }

        // Set as unapproved by default (requires admin approval)
        newReview.approved = false;

        const data = await fs.readFile(reviewsFilePath, 'utf-8');
        const reviews = JSON.parse(data);

        reviews.push(newReview);

        await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2));

        return NextResponse.json(newReview);
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
