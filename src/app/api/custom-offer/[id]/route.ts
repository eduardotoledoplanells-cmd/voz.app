import { NextRequest, NextResponse } from 'next/server';
import { existsSync, rmSync } from 'fs';
import path from 'path';

const OFFERS_FILE = path.join(process.cwd(), 'src', 'data', 'custom-offers.json');

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Leer archivo de ofertas
        const fs = require('fs');

        if (!existsSync(OFFERS_FILE)) {
            return NextResponse.json({ error: 'No se encontraron ofertas' }, { status: 404 });
        }

        const data = fs.readFileSync(OFFERS_FILE, 'utf8');
        const offersData = JSON.parse(data);

        // Buscar la oferta
        const offerIndex = offersData.offers.findIndex((offer: any) => offer.id === id);

        if (offerIndex === -1) {
            return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
        }

        // Eliminar carpeta de imágenes
        const offerDir = path.join(process.cwd(), 'public', 'images', 'custom-offers', id);

        if (existsSync(offerDir)) {
            rmSync(offerDir, { recursive: true, force: true });
        }

        // Eliminar oferta del array
        offersData.offers.splice(offerIndex, 1);

        // Guardar archivo actualizado
        fs.writeFileSync(OFFERS_FILE, JSON.stringify(offersData, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Oferta eliminada correctamente'
        });
    } catch (error) {
        console.error('Error deleting offer:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la oferta' },
            { status: 500 }
        );
    }
}
