import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.ts');

export async function GET() {
    try {
        const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');

        // Extract categories array from the file
        const match = fileContent.match(/export const categories: Category\[\] = (\[[\s\S]*?\]);/);
        if (!match) {
            return NextResponse.json({ error: 'Could not parse categories' }, { status: 500 });
        }

        // Parse the categories (this is a simplified approach)
        // In production, you might want to use a proper parser
        const categoriesString = match[1];
        const categories = eval(categoriesString);

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error reading categories:', error);
        return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, name, slug, image, description } = await request.json();

        const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');

        // Find and replace the category
        const regex = new RegExp(
            `{[^}]*id:\\s*'${id}'[^}]*}`,
            'g'
        );

        const updatedContent = fileContent.replace(regex, (match) => {
            let updatedMatch = match;

            // Helper to safely replace property values
            const replaceProp = (key: string, value: string) => {
                const propRegex = new RegExp(`${key}:\\s*'[^']*'`, 'g');
                if (updatedMatch.match(propRegex)) {
                    updatedMatch = updatedMatch.replace(propRegex, `${key}: '${value}'`);
                }
            };

            replaceProp('name', name);
            replaceProp('slug', slug);
            replaceProp('image', image);

            // Handle description which might be optional or missing in original
            const descRegex = /description:\s*'[^']*'/;
            if (updatedMatch.match(descRegex)) {
                updatedMatch = updatedMatch.replace(descRegex, `description: '${description}'`);
            } else if (description) {
                // Add description if it's new and we have a value
                // Insert before the closing brace (simplistic approach)
                updatedMatch = updatedMatch.replace(/\s*}$/, `,\n        description: '${description}'\n    }`);
            }

            return updatedMatch;
        });

        await fs.writeFile(categoriesFilePath, updatedContent, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}
