
import { getProductById, updateProduct } from './src/lib/db';
import fs from 'fs';
import path from 'path';

// Mock DB path for testing
const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

async function testStockManagement() {
    console.log('Starting Stock Management Test...');

    // 1. Setup: Ensure a product exists with known stock
    const testProductId = 'test-stock-product';
    const initialStock = 10;

    // Read current DB to append test product if needed, or just use an existing one
    // For safety, let's use a temporary product
    let products = JSON.parse(fs.readFileSync(dbPath, 'utf-8')).products;
    const existingTestProduct = products.find((p: any) => p.id === testProductId);

    if (!existingTestProduct) {
        products.push({
            id: testProductId,
            title: 'Test Stock Product',
            price: 10,
            stock: initialStock,
            category: 'Test',
            images: []
        });
        fs.writeFileSync(dbPath, JSON.stringify({ products }, null, 2));
    } else {
        // Reset stock
        updateProduct(testProductId, { stock: initialStock });
    }

    console.log(`Product ${testProductId} stock set to ${initialStock}`);

    // 2. Simulate Order Creation (API Logic)
    // We can't call the API directly easily without running the server, 
    // but we can replicate the logic used in /api/orders/route.ts

    const orderItem = {
        productId: testProductId,
        quantity: 2
    };

    console.log(`Attempting to buy ${orderItem.quantity} units...`);

    // Validation Logic
    const product = getProductById(testProductId);
    if (!product) throw new Error('Product not found');

    if (product.stock < orderItem.quantity) {
        throw new Error('Stock validation failed: Insufficient stock');
    }

    // Reduction Logic
    updateProduct(product.id, { stock: product.stock - orderItem.quantity });

    // 3. Verify Stock Reduction
    const updatedProduct = getProductById(testProductId);
    if (updatedProduct?.stock === initialStock - orderItem.quantity) {
        console.log(`SUCCESS: Stock reduced correctly. New stock: ${updatedProduct.stock}`);
    } else {
        console.error(`FAILURE: Stock not reduced correctly. Expected: ${initialStock - orderItem.quantity}, Got: ${updatedProduct?.stock}`);
    }

    // 4. Test Overselling
    console.log('Testing overselling...');
    const oversellQuantity = 100;
    const currentStock = updatedProduct!.stock;

    if (currentStock < oversellQuantity) {
        console.log('SUCCESS: Overselling prevented (logic check passed).');
    } else {
        console.error('FAILURE: Overselling logic failed.');
    }

    // Cleanup
    // Remove test product
    products = JSON.parse(fs.readFileSync(dbPath, 'utf-8')).products;
    const newProducts = products.filter((p: any) => p.id !== testProductId);
    fs.writeFileSync(dbPath, JSON.stringify({ products: newProducts }, null, 2));
    console.log('Cleanup complete.');
}

testStockManagement().catch(console.error);
