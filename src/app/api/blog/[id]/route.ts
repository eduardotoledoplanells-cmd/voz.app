import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const blogFilePath = path.join(process.cwd(), 'data', 'blog.json');

function readBlogData() {
    const fileContents = fs.readFileSync(blogFilePath, 'utf8');
    return JSON.parse(fileContents);
}

function writeBlogData(data: any) {
    fs.writeFileSync(blogFilePath, JSON.stringify(data, null, 2));
}

// GET - Fetch single article by ID or slug
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const blogData = readBlogData();
        const article = blogData.articles.find((a: any) =>
            a.id === id || a.slug === id
        );

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Increment views
        article.views = (article.views || 0) + 1;
        writeBlogData(blogData);

        return NextResponse.json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }
}

// PUT - Update article
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const updates = await request.json();
        const { id } = await params;
        const blogData = readBlogData();

        const articleIndex = blogData.articles.findIndex((a: any) => a.id === id);

        if (articleIndex === -1) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Update article
        blogData.articles[articleIndex] = {
            ...blogData.articles[articleIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        writeBlogData(blogData);

        return NextResponse.json(blogData.articles[articleIndex]);
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
}

// DELETE - Delete article
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const blogData = readBlogData();
        const articleIndex = blogData.articles.findIndex((a: any) => a.id === id);

        if (articleIndex === -1) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        blogData.articles.splice(articleIndex, 1);
        writeBlogData(blogData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }
}
