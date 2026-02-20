import HeroSlider from '@/components/ui/HeroSlider';
import PromoSlider from '@/components/ui/PromoSlider';
import ProductCard from '@/components/ui/ProductCard';
import CategoryCard from '@/components/ui/CategoryCard';
import { getProducts } from '@/lib/db'; // Use DB source
import { getCategoriesByType } from '@/lib/categories';
import styles from './page.module.css';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensure page updates on every request

export default function Home() {
  const products = getProducts(); // Fetch latest products

  // Función para mezclar array aleatoriamente (Fisher-Yates shuffle)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Obtener categorías destacadas (consolas más populares)
  const featuredCategories = [
    ...getCategoriesByType('playstation').filter(c => c.slug === 'playstation-5'),
    ...getCategoriesByType('nintendo').filter(c => c.slug === 'switch'),
    ...getCategoriesByType('xbox').filter(c => c.slug === 'xbox-series'),
    ...getCategoriesByType('playstation').filter(c => c.slug === 'playstation-4'),
  ];

  // Productos destacados en orden aleatorio
  const featuredProducts = shuffleArray(products).slice(0, 8); // Limit to 8 for sanity

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <HeroSlider />

      {/* Categorías Destacadas */}
      <div className={styles.sectionTitle}>
        <h2>Categorías Populares</h2>
        <Link href="/categories" className={styles.seeAll}>Ver todas &gt;</Link>
      </div>

      <div className={styles.categoriesGrid}>
        {featuredCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* ROBcoin Promo Slider - Desactivado temporalmente con Zona Arcade */}
      {/* <PromoSlider /> */}

      <div className={styles.sectionTitle}>
        <h2>Destacados</h2>
        <a href="/category/all" className={styles.seeAll}>Ver todo &gt;</a>
      </div>

      <div className={styles.grid}>
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className={styles.sectionTitle}>
        <h2>Recién llegados</h2>
        <a href="/category/new" className={styles.seeAll}>Ver todo &gt;</a>
      </div>

      <div className={styles.grid}>
        {products.slice(-4).reverse().map((product) => (
          <ProductCard key={`new-${product.id}`} product={product} />
        ))}
      </div>
    </div>
  );
}
