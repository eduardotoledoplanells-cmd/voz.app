import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const reviewsFilePath = path.join(process.cwd(), 'src', 'data', 'reviews.json');

// Get ALL reviews (including unapproved) - for admin only
export async function GET() {
    try {
        const data = await fs.readFile(reviewsFilePath, 'utf-8');
        const reviews = JSON.parse(data);
        return NextResponse.json(reviews);
    } catch (error) {
        console.error('Error reading reviews:', error);
        return NextResponse.json([], { status: 200 });
    }
}
