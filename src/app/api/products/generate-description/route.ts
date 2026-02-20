import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { title } = await request.json();

        if (!title) {
            return NextResponse.json(
                { message: 'El título es requerido' },
                { status: 400 }
            );
        }

        // SIMULATION MODE (Cost Free)
        // We generate a description based on templates and keywords from the title

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate "thinking" time

        const lowerTitle = title.toLowerCase();
        let type = 'producto';
        if (lowerTitle.includes('ps4') || lowerTitle.includes('playstation') || lowerTitle.includes('nintendo') || lowerTitle.includes('sega') || lowerTitle.includes('xbox')) {
            if (lowerTitle.includes('consola')) {
                type = 'consola';
            } else if (lowerTitle.includes('mando') || lowerTitle.includes('controller')) {
                type = 'accesorio';
            } else {
                type = 'juego';
            }
        }

        let description = '';

        if (type === 'juego') {
            const adjectives = ['increíble', 'fantástico', 'clásico', 'emocionante', 'imprescindible'];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];

            description = `¡Disfruta de este ${adj} título! "${title}" es una joya que no puede faltar en tu colección.\n\nEste cartucho/disco ha sido probado minuciosamente por nuestro equipo y funciona a la perfección. Conserva toda la magia original y te transportará horas de diversión.\n\nEstado: Usado, en excelentes condiciones de funcionamiento.`;
        } else if (type === 'consola') {
            description = `¡Revive la historia con esta ${title}!\n\nUna oportunidad única para hacerte con este sistema legendario. La consola ha sido revisada internamente, limpiada y testeada para asegurar que carga tus juegos favoritos sin problemas.\n\nIncluye el cableado necesario para empezar a jugar. ¡Lista para enchufar y disfrutar!`;
        } else {
            description = `Añade "${title}" a tu setup retro.\n\nEste artículo se encuentra en buen estado de conservación y es el complemento perfecto para tu colección. Ha sido verificado para garantizar su funcionalidad.\n\n¡Aprovecha esta oportunidad antes de que se agote!`;
        }

        return NextResponse.json({
            description: description,
            mock: true
        });

    } catch (error: any) {
        console.error('Error generating description:', error);
        return NextResponse.json(
            { message: 'Error al generar la descripción', details: error.message },
            { status: 500 }
        );
    }
}
