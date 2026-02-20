import { getAllCategories } from '@/lib/categories';
import CategoryGrid from '@/components/ui/CategoryGrid';
import styles from './categories.module.css';

export default function CategoriesPage() {
    const allCategories = getAllCategories();

    // Filter only main game hub categories (not individual consoles)
    const gameHubCategories = allCategories.filter(cat =>
        cat.id === 'nintendo-ds-hub' ||
        cat.id === 'modern-nintendo-hub' ||
        cat.id === 'nintendo-wii-hub' ||
        cat.id === 'playstation-hub' ||
        cat.id === 'playstation-portatil-hub' ||
        cat.id === 'xbox-hub' ||
        cat.id === 'pc-juegos' ||
        cat.id === 'juegos-retro'
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Categorías de Juegos</h1>
                <p className={styles.subtitle}>
                    Explora nuestra colección de juegos, consolas y accesorios
                </p>
            </div>

            <CategoryGrid categories={gameHubCategories} />
        </div>
    );
}
