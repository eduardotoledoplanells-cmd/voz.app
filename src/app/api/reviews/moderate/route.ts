import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Review } from '@/types';

const reviewsFilePath = path.join(process.cwd(), 'src', 'data', 'reviews.json');

// Approve a review
export async function PUT(request: Request) {
    try {
        const { id, approved } = await request.json();

        const data = await fs.readFile(reviewsFilePath, 'utf-8');
        const reviews: Review[] = JSON.parse(data);

        const reviewIndex = reviews.findIndex(r => r.id === id);
        if (reviewIndex === -1) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        reviews[reviewIndex].approved = approved;
        await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

// Delete a review
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        const data = await fs.readFile(reviewsFilePath, 'utf-8');
        const reviews: Review[] = JSON.parse(data);

        const filteredReviews = reviews.filter(r => r.id !== id);
        await fs.writeFile(reviewsFilePath, JSON.stringify(filteredReviews, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
