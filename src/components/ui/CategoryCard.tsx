import Link from 'next/link';
import { Category } from '@/types';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
    category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
    return (
        <Link href={`/categories/${category.slug}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img
                    src={category.image}
                    alt={category.name}
                    className={styles.image}
                />
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{category.name}</h3>
                {category.description && (
                    <p className={styles.description}>{category.description}</p>
                )}
                {category.productCount !== undefined && (
                    <p className={styles.productCount}>
                        {category.productCount} productos
                    </p>
                )}
            </div>
            <div className={styles.overlay}>
                <span className={styles.viewButton}>Ver categoría →</span>
            </div>
        </Link>
    );
}
