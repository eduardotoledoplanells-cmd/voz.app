import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
    try {
        const { categoryName } = await request.json();

        if (!categoryName) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            // Fallback for demo purposes if no key is present
            // In a real scenario, we might return an error or a specific status
            console.log('No OpenAI API Key found, using fallback.');

            const fallbackDescriptions: Record<string, string> = {
                'default': `Descubre nuestra selección de ${categoryName}. Encuentra los mejores productos con garantía y calidad asegurada.`
            };

            return NextResponse.json({
                description: fallbackDescriptions[categoryName] || fallbackDescriptions['default'],
                source: 'fallback'
            });
        }

        let description = '';
        let source = 'ai';

        try {
            const openai = new OpenAI({ apiKey });

            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto en e-commerce y SEO. Tu tarea es generar descripciones atractivas y optimizadas para categorías de una tienda online. La descripción debe ser de un párrafo, basándose estrictamente en el Título de la Categoría proporcionado. Responde solo con la descripción en español."
                    },
                    {
                        role: "user",
                        content: `El Título de la Categoría es: "${categoryName}". Usa este título exacto para generar la descripción.`
                    }
                ],
                model: "gpt-3.5-turbo",
            });

            description = completion.choices[0].message.content || '';
        } catch (openaiError) {
            console.error('OpenAI API Error:', openaiError);
            console.log('Falling back to local description generation.');

            const fallbackDescriptions: Record<string, string> = {
                'default': `Descubre nuestra increíble selección de ${categoryName}. Ofrecemos los mejores productos del mercado con garantía de calidad y precios competitivos. ¡Explora ahora y encuentra lo que buscas!`
            };
            description = fallbackDescriptions[categoryName] || fallbackDescriptions['default'];
            source = 'fallback_error';
        }

        return NextResponse.json({
            description,
            source
        });

    } catch (error) {
        console.error('General Error:', error);
        return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
    }
}
