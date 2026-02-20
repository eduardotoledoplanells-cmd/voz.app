import { Category } from '@/types';
import CategoryCard from './CategoryCard';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
    categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
    return (
        <div className={styles.grid}>
            {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
            ))}
        </div>
    );
}
