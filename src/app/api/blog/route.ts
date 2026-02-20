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

// GET - Fetch all articles or filter by category/tag
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const tag = searchParams.get('tag');
        const search = searchParams.get('search');
        const published = searchParams.get('published');

        const blogData = readBlogData();
        let articles = blogData.articles;

        // Filter by published status
        if (published === 'true') {
            articles = articles.filter((article: any) => article.published);
        }

        // Filter by category
        if (category) {
            articles = articles.filter((article: any) =>
                article.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by tag
        if (tag) {
            articles = articles.filter((article: any) =>
                article.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
            );
        }

        // Search in title, excerpt, and content
        if (search) {
            const searchLower = search.toLowerCase();
            articles = articles.filter((article: any) =>
                article.title.toLowerCase().includes(searchLower) ||
                article.excerpt.toLowerCase().includes(searchLower) ||
                article.content.toLowerCase().includes(searchLower)
            );
        }

        // Sort by date (newest first)
        articles.sort((a: any, b: any) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        return NextResponse.json({
            articles,
            categories: blogData.categories
        });
    } catch (error) {
        console.error('Error fetching blog articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

// POST - Create new article
export async function POST(request: Request) {
    try {
        const newArticle = await request.json();
        const blogData = readBlogData();

        // Generate ID
        const maxId = blogData.articles.reduce((max: number, article: any) =>
            Math.max(max, parseInt(article.id)), 0
        );
        newArticle.id = String(maxId + 1);

        // Generate slug from title if not provided
        if (!newArticle.slug) {
            newArticle.slug = newArticle.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        // Set timestamps
        const now = new Date().toISOString();
        newArticle.publishedAt = newArticle.publishedAt || now;
        newArticle.updatedAt = now;
        newArticle.views = 0;

        blogData.articles.push(newArticle);
        writeBlogData(blogData);

        return NextResponse.json(newArticle, { status: 201 });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }
}
