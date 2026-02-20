
import { NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');
        const testProductId = 'test-stock-product-api';
        const initialStock = 10;

        // 1. Setup
        let products = JSON.parse(await fs.readFile(dbPath, 'utf-8')).products;
        const existingTestProduct = products.find((p: any) => p.id === testProductId);

        if (!existingTestProduct) {
            products.push({
                id: testProductId,
                title: 'Test Stock Product API',
                price: 10,
                stock: initialStock,
                category: 'Test',
                images: []
            });
            await fs.writeFile(dbPath, JSON.stringify({ products }, null, 2));
        } else {
            updateProduct(testProductId, { stock: initialStock });
        }

        // 2. Test Logic
        const orderItem = { productId: testProductId, quantity: 2 };

        // Validation
        const product = getProductById(testProductId);
        if (!product) throw new Error('Product not found');
        if (product.stock < orderItem.quantity) throw new Error('Stock validation failed');

        // Reduction
        updateProduct(product.id, { stock: product.stock - orderItem.quantity });

        // 3. Verify
        const updatedProduct = getProductById(testProductId);
        const success = updatedProduct?.stock === initialStock - orderItem.quantity;

        // Cleanup
        products = JSON.parse(await fs.readFile(dbPath, 'utf-8')).products;
        const newProducts = products.filter((p: any) => p.id !== testProductId);
        await fs.writeFile(dbPath, JSON.stringify({ products: newProducts }, null, 2));

        return NextResponse.json({
            success,
            message: success ? 'Stock reduced correctly' : 'Stock reduction failed',
            initial: initialStock,
            final: updatedProduct?.stock
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
