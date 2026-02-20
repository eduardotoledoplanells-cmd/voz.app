import { NextResponse } from 'next/server';
import { getProducts, addProduct } from '@/lib/db';
import { Product } from '@/types';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET() {
    const products = getProducts();
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const price = Number(formData.get('price'));
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const grade = formData.get('grade') as 'A' | 'B' | 'C' | undefined;
    const sellerId = formData.get('sellerId') as string | undefined;

    const images: string[] = [];

    // Process product_images in order
    // formData.getAll doesn't guarantee order if they are intermixed with other fields, 
    // but usually browser appends in order of calling append().
    // safely iterate all entries and check keys
    for (const [key, value] of Array.from(formData.entries())) {
        if (key === 'product_images') {
            if (value instanceof File) {
                const buffer = Buffer.from(await value.arrayBuffer());
                const safeName = value.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
                const filename = `${Date.now()}-${safeName}`;
                const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

                await writeFile(filepath, buffer);
                images.push(`/uploads/${filename}`);
            } else if (typeof value === 'string') {
                images.push(value);
            }
        }
    }

    // Capture gallery images (legacy support or if still used separately)
    // In our new frontend we don't use 'galleryImages' anymore for main product images,
    // everything is in 'product_images'.
    const galleryImages = formData.getAll('galleryImages') as string[];
    if (galleryImages.length > 0) {
        images.push(...galleryImages);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now();
    const counter = String(timestamp).slice(-3);

    const newProduct: Product = {
        id: timestamp.toString(),
        reference: `REF-${year}-${month}-${day}-${counter}`,
        title,
        price,
        category,
        description,
        grade,
        images,
        isOnSale: formData.get('isOnSale') === 'on',
        salePrice: formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined,
        isFeatured: formData.get('isFeatured') === 'on',
        stock: formData.get('stock') ? Number(formData.get('stock')) : 1,
        buyPrice: formData.get('buyPrice') ? Number(formData.get('buyPrice')) : undefined,
        sellerId,
        limitOnePerCustomer: formData.get('limitOnePerCustomer') === 'on'
    };

    const savedProduct = addProduct(newProduct);
    return NextResponse.json(savedProduct);
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { message: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { deleteProducts } = await import('@/lib/db');
        const success = deleteProducts(ids);

        if (success) {
            return NextResponse.json({ message: 'Products deleted successfully' });
        } else {
            return NextResponse.json(
                { message: 'No products deleted' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { message: 'Error deleting products' },
            { status: 500 }
        );
    }
}
