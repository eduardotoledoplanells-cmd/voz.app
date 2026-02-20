import { Product } from '@/types';
import { getProducts } from '@/lib/db';
import ProductList from './ProductList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const products: Product[] = getProducts();

    return <ProductList initialProducts={products} />;
}
