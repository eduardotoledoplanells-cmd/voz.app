import { NextResponse } from 'next/server';
import OpenAI from 'openai';
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

// Temas para generar artículos variados
const BLOG_TOPICS = [
    "Historia de una consola retro específica",
    "Guía de compra para coleccionistas principiantes",
    "Análisis de mercado de videojuegos retro",
    "Cómo reparar y mantener hardware retro",
    "Top juegos más valiosos de una plataforma",
    "Evolución de un género de videojuegos",
    "Consejos para vender videojuegos retro",
    "Comparativa entre consolas de la misma generación",
    "Historia de un estudio de videojuegos clásico",
    "Guía de modificaciones y mejoras para consolas retro"
];

const CATEGORIES = [
    "Historia y Nostalgia",
    "Guías y Tutoriales",
    "Análisis de Mercado",
    "Noticias",
    "Consejos de Compra/Venta"
];

export async function GET(request: Request) {
    try {
        // Verificar si hay API key configurada
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: 'OpenAI API key not configured',
                message: 'Por favor, añade OPENAI_API_KEY a tu archivo .env.local'
            }, { status: 500 });
        }

        const blogData = readBlogData();
        const articles = blogData.articles;

        // Verificar si han pasado 6 días desde la última publicación
        if (articles.length > 0) {
            const lastArticle = articles.sort((a: any, b: any) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            )[0];

            const daysSinceLastPost = Math.floor(
                (Date.now() - new Date(lastArticle.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastPost < 6) {
                return NextResponse.json({
                    message: `No es necesario crear un nuevo artículo todavía. Último artículo publicado hace ${daysSinceLastPost} días.`,
                    nextPostIn: `${6 - daysSinceLastPost} días`
                });
            }
        }

        // Inicializar OpenAI
        const openai = new OpenAI({ apiKey });

        // Seleccionar tema aleatorio
        const topic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

        // Generar contenido con OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un experto en videojuegos retro y coleccionismo. Escribe artículos informativos, entretenidos y profesionales para un blog de una tienda de videojuegos retro llamada RevoluxBit. El tono debe ser cercano pero profesional, dirigido a coleccionistas y entusiastas del retro gaming.`
                },
                {
                    role: "user",
                    content: `Escribe un artículo completo sobre: "${topic}". 
                    
El artículo debe tener:
1. Un título atractivo y SEO-friendly
2. Un extracto de 1-2 líneas que enganche al lector
3. Contenido en HTML con etiquetas <h2>, <h3>, <p>, <ul>, <li>, <strong>
4. Entre 800-1200 palabras
5. 3-5 tags relevantes
6. Categoría: ${category}

Responde SOLO con un JSON válido en este formato exacto:
{
  "title": "título del artículo",
  "excerpt": "extracto breve",
  "content": "contenido HTML completo",
  "tags": ["tag1", "tag2", "tag3"]
}`
                }
            ],
            temperature: 0.8,
            max_tokens: 3000
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            throw new Error('No se recibió respuesta de OpenAI');
        }

        // Parsear la respuesta
        const generatedContent = JSON.parse(responseText);

        // Generar ID y slug
        const maxId = articles.reduce((max: number, article: any) =>
            Math.max(max, parseInt(article.id)), 0
        );
        const newId = String(maxId + 1);

        const slug = generatedContent.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Crear nuevo artículo
        const newArticle = {
            id: newId,
            slug: slug,
            title: generatedContent.title,
            excerpt: generatedContent.excerpt,
            content: generatedContent.content,
            author: "RevoluxBit AI",
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: category,
            tags: generatedContent.tags,
            featuredImage: "/images/blog/placeholder.png", // Usar imagen placeholder
            published: true,
            views: 0
        };

        // Añadir al blog
        blogData.articles.push(newArticle);
        writeBlogData(blogData);

        return NextResponse.json({
            success: true,
            message: 'Nuevo artículo creado exitosamente',
            article: {
                id: newArticle.id,
                title: newArticle.title,
                slug: newArticle.slug
            }
        });

    } catch (error: any) {
        console.error('Error generando artículo:', error);
        return NextResponse.json({
            error: 'Error al generar artículo',
            details: error.message
        }, { status: 500 });
    }
}
