import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const OFFERS_FILE = path.join(process.cwd(), 'src', 'data', 'custom-offers.json');

// GET - Listar todas las ofertas (solo admin)
export async function GET() {
    try {
        const fs = require('fs');

        if (!existsSync(OFFERS_FILE)) {
            return NextResponse.json({ offers: [] });
        }

        const data = fs.readFileSync(OFFERS_FILE, 'utf8');
        const offers = JSON.parse(data);

        // Ordenar por fecha más reciente primero
        offers.offers.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(offers);
    } catch (error) {
        console.error('Error reading offers:', error);
        return NextResponse.json({ error: 'Error al leer las ofertas' }, { status: 500 });
    }
}

// POST - Crear nueva solicitud de oferta
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const description = formData.get('description') as string;
        const images = formData.getAll('images') as File[];

        // Validaciones
        if (!name || !email || !phone || !description) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        if (images.length === 0 || images.length > 10) {
            return NextResponse.json(
                { error: 'Debes subir entre 1 y 10 imágenes' },
                { status: 400 }
            );
        }

        // Validar tamaño de archivos
        const maxSize = 5 * 1024 * 1024; // 5MB
        for (const image of images) {
            if (image.size > maxSize) {
                return NextResponse.json(
                    { error: 'Cada imagen debe ser menor a 5MB' },
                    { status: 400 }
                );
            }
        }

        // Crear ID único para la oferta
        const offerId = uuidv4();
        const offerDir = path.join(process.cwd(), 'public', 'images', 'custom-offers', offerId);

        // Crear directorio para las imágenes
        await mkdir(offerDir, { recursive: true });

        // Guardar imágenes
        const imagePaths: string[] = [];
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const ext = image.name.split('.').pop();
            const filename = `image-${i + 1}.${ext}`;
            const filepath = path.join(offerDir, filename);

            await writeFile(filepath, buffer);
            imagePaths.push(`/images/custom-offers/${offerId}/${filename}`);
        }

        // Crear objeto de oferta
        const offer = {
            id: offerId,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            description,
            images: imagePaths,
            status: 'pending',
            createdAt: new Date().toISOString(),
            adminNotes: ''
        };

        // Leer archivo de ofertas existente
        const fs = require('fs');
        let offersData = { offers: [] };

        if (existsSync(OFFERS_FILE)) {
            const data = fs.readFileSync(OFFERS_FILE, 'utf8');
            offersData = JSON.parse(data);
        }

        // Agregar nueva oferta
        offersData.offers.push(offer);

        // Guardar archivo actualizado
        fs.writeFileSync(OFFERS_FILE, JSON.stringify(offersData, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Solicitud enviada correctamente',
            offerId
        });
    } catch (error) {
        console.error('Error creating offer:', error);
        return NextResponse.json(
            { error: 'Error al procesar la solicitud' },
            { status: 500 }
        );
    }
}
