import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const product = getProductById(id);

    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const price = Number(formData.get('price'));
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const grade = formData.get('grade') as 'A' | 'B' | 'C' | undefined;
    const isOnSale = formData.get('isOnSale') === 'true';
    const salePrice = formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined;
    const isFeatured = formData.get('isFeatured') === 'on';
    const stock = formData.get('stock') ? Number(formData.get('stock')) : 1;
    const sellerId = formData.get('sellerId') as string | undefined;
    const buyPrice = formData.get('buyPrice') ? Number(formData.get('buyPrice')) : undefined;
    const limitOnePerCustomer = formData.get('limitOnePerCustomer') === 'on';

    // Handle images (mixed existing strings and new Files)
    const images: string[] = [];

    // Process product_images in order
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

    const updates = {
        title,
        price,
        category,
        description,
        grade,
        isOnSale,
        salePrice,
        images,
        isFeatured,
        stock,
        sellerId,
        buyPrice,
        limitOnePerCustomer
    };

    const updatedProduct = updateProduct(id, updates);

    if (!updatedProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const success = deleteProduct(id);

    if (!success) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
}
