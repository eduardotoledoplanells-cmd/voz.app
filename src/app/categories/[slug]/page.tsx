import { getCategoryBySlug, getAllCategories } from '@/lib/categories';
import { getProducts } from '@/lib/db';
import { getCategoryContext } from '@/lib/category-structure'; // Import helper
import ProductGrid from '@/components/products/ProductGrid';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './category.module.css';

interface CategoryPageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        type?: string;
    }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { type } = await searchParams;

    // Default to 'console' if no type is selected, or use the selected type
    const currentType = type || 'console';

    const category = getCategoryBySlug(slug);

    if (!category) {
        notFound();
    }

    // Pre-calculate ID to Slug map for correct routing
    const allCats = getAllCategories();
    const idToSlugMap = new Map<string, string>();
    allCats.forEach(c => {
        idToSlugMap.set(c.id, c.slug);
    });

    // Helper to get slug from ID
    const getSlug = (id: string) => idToSlugMap.get(id) || id;

    // --- NEW CONTEXT AWARE NAVIGATION LOGIC ---
    // Try to find the category in the deep structure to get parent/siblings
    const context = getCategoryContext(slug);

    // Determine Parent for Back Button
    let backLink = '/categories';
    let backLabel = 'Volver a Categorías';

    if (context && context.parent) {
        backLink = `/categories/${getSlug(context.parent.id)}`;
        backLabel = `Volver a ${context.parent.name}`;
    }

    // Determine Sidebar Items (Siblings)
    let sidebarItems: { id: string; name: string; url: string; active: boolean }[] = [];

    if (context) {
        // If we found context, use siblings/subcategories
        // If current category has children, show children (it's a hub)
        if (context.current.subcategories && context.current.subcategories.length > 0) {
            sidebarItems = context.current.subcategories.map((sub: any) => ({
                id: sub.id,
                name: sub.name,
                url: `/categories/${getSlug(sub.id)}`,
                active: false
            }));
        }
        // If it's a leaf (no children), show siblings (e.g. Consolas, Juegos, Accesorios)
        else {
            sidebarItems = context.siblings.map((sib: any) => ({
                id: sib.id,
                name: sib.name,
                url: `/categories/${getSlug(sib.id)}`,
                active: sib.id === slug
            }));
        }
    } else {
        // Fallback to legacy manual logic if not found in structure (e.g. special slugs like 'moviles')
        // ... (Keep existing manual logic as fallback or migration path if needed)
        // For now, let's map the existing 'subcategories' logic to this new sidebar format 
        // to minimize disruption for non-tree items.
    }

    // Legacy manual logic for non-tree items or specific overrides
    // We keep this to ensure products filtering works, but we override sidebar if context found.
    const products = getProducts();

    // Filter products for this category AND type
    const categoryProducts = products.filter(product => {
        let matchesContext = false;
        let matchesSubcategory = false;

        if (category.slug === 'peliculas') {
            matchesContext = product.category.startsWith('Películas');

            if (currentType === 'vhs') matchesSubcategory = product.category === 'Películas - VHS';
            else if (currentType === 'dvd') matchesSubcategory = product.category === 'Películas - DVD';
            else if (currentType === 'bluray') matchesSubcategory = product.category === 'Películas - Blu-Ray';
            else matchesSubcategory = true; // Show all if no specific subcat selected
        } else if (category.slug === 'informatica') {
            matchesContext = product.category.startsWith('Informática');

            if (currentType === 'tablets') matchesSubcategory = product.category === 'Informática - Tablets';
            else if (currentType === 'portatiles') matchesSubcategory = product.category === 'Informática - Portátiles';
            else if (currentType === 'sobremesa') matchesSubcategory = product.category === 'Informática - Sobremesa';
            else if (currentType === 'monitores') matchesSubcategory = product.category === 'Informática - Monitores';
            else if (currentType === 'accesorios') matchesSubcategory = product.category === 'Informática - Accesorios';
            else matchesSubcategory = true;
        } else if (category.slug === 'musica') {
            matchesContext = product.category.startsWith('Música');

            if (currentType === 'cd') matchesSubcategory = product.category === 'Música - CD';
            else if (currentType === 'vinilo') matchesSubcategory = product.category === 'Música - Vinilo';
            else matchesSubcategory = true;
        } else if (category.slug === 'electronica') {
            matchesContext = product.category.startsWith('Electrónica');

            if (currentType === 'audio') matchesSubcategory = product.category === 'Electrónica - Audio';
            else if (currentType === 'television') matchesSubcategory = product.category === 'Electrónica - Televisión';
            else if (currentType === 'camaras') matchesSubcategory = product.category === 'Electrónica - Cámaras';
            else if (currentType === 'smartwatch') matchesSubcategory = product.category === 'Electrónica - Smartwatch';
            else if (currentType === 'accesorios') matchesSubcategory = product.category === 'Electrónica - Accesorios';
            else matchesSubcategory = true;
        } else if (category.slug === 'moviles') {
            matchesContext = product.category.startsWith('Móviles');

            if (currentType === 'apple') matchesSubcategory = product.category === 'Móviles - Apple';
            else if (currentType === 'samsung') matchesSubcategory = product.category === 'Móviles - Samsung';
            else if (currentType === 'xiaomi') matchesSubcategory = product.category === 'Móviles - Xiaomi';
            else if (currentType === 'huawei') matchesSubcategory = product.category === 'Móviles - Huawei';
            else if (currentType === 'oneplus') matchesSubcategory = product.category === 'Móviles - OnePlus';
            else if (currentType === 'google') matchesSubcategory = product.category === 'Móviles - Google';
            else if (currentType === 'oppo') matchesSubcategory = product.category === 'Móviles - Oppo';
            else if (currentType === 'realme') matchesSubcategory = product.category === 'Móviles - Realme';
            else matchesSubcategory = true;
        } else if (
            category.slug === 'dreamcast' || category.slug === 'game-gear' ||
            category.slug === 'master-system' || category.slug === 'mega-drive' ||
            category.slug === 'sega-saturn' || category.slug === 'game-cube' ||
            category.slug === 'snes' || category.slug === 'nes' || category.slug === 'ds' || category.slug === '3ds' ||
            category.slug === 'xbox-360' || category.slug === 'xbox-one' ||
            category.slug === 'playstation-1' || category.slug === 'playstation-2' || category.slug === 'playstation-3' ||
            category.slug === 'psp' || category.slug === 'ps-vita' || category.slug === 'game-boy'
        ) {
            // Logic for Retro/Specific Hubs
            matchesContext = true;

            // Handle the product category matching broadly
            // It could be "SNES - Consolas" (Name) or "snes-consolas" (ID) or "Super Nintendo" (Hub Name)
            const pCat = product.category.toLowerCase();
            const cName = category.name.toLowerCase();
            const cSlug = category.slug.toLowerCase();

            // Check if product belongs to this hub
            let contextMatch = pCat.includes(cName) || pCat.includes(cSlug) ||
                (category.id === 'nintendo-gameboy' && pCat.includes('gameboy')) ||
                product.category === category.id; // Exact hub ID match

            // Fix overlapping slugs
            if (category.slug === 'nes' && pCat.includes('snes')) contextMatch = false;
            if (category.slug === 'ds' && pCat.includes('3ds')) contextMatch = false;

            if (!contextMatch && !pCat.includes('consolas')) {
                // Allow loose match if it's a subcomponent, but be careful. 
                // Actually we rely on subcategory match below to be strict if context is loose.
            }

            if (currentType === 'console' || currentType === 'game' || currentType === 'accessory') {
                // Filter by type
                // Mapping: console -> [slug]-consolas, etc.
                const typeMap: any = {
                    'console': ['consolas', 'console'],
                    'game': ['juegos', 'games', 'game'],
                    'accessory': ['accesorios', 'accessories', 'accessory']
                };

                const validKeywords = typeMap[currentType] || [];
                matchesSubcategory = validKeywords.some((kw: string) => pCat.includes(kw) || product.type === currentType);

                // Extra check: ensure it is THIS console's type
                // If I am in SNES, and product is "Mega Drive - Consolas", the keywords match but context doesn't.
                // Re-enforce context match here if implicit
                matchesSubcategory = matchesSubcategory && (
                    product.category.toLowerCase().includes(category.slug.replace(/-/g, ' ')) ||
                    product.category.toLowerCase().includes(category.name.toLowerCase()) ||
                    product.category.includes(category.id) ||
                    product.category.toLowerCase().includes(category.slug) ||
                    (category.id === 'nintendo-gameboy' && product.category.toLowerCase().includes('gameboy'))
                );

                // Fix overlapping slugs for subcategory matching
                if (category.slug === 'nes' && pCat.includes('snes')) matchesSubcategory = false;
                if (category.slug === 'ds' && pCat.includes('3ds')) matchesSubcategory = false;

            } else {
                // 'currentType' is a specific slug like 'xbox360-consolas'
                // We need to match it to the product's category NAME or ID
                matchesSubcategory = product.category === currentType || pCat === currentType.toLowerCase();

                // Legacy: match by name lookup
                if (!matchesSubcategory) {
                    const subCategoryObj = getCategoryBySlug(currentType);
                    if (subCategoryObj) {
                        matchesSubcategory = product.category === subCategoryObj.name;
                    }
                }
            }
        } else if (
            category.slug.endsWith('-consolas') ||
            category.slug.endsWith('-juegos') ||
            category.slug.endsWith('-accesorios')
        ) {
            // Leaf category logic (e.g. 'snes-consolas')
            // Match exactly by category slug or name or id
            matchesContext = product.category === category.slug ||
                product.category === category.name ||
                product.category === category.id;
            // Do NOT filter by product.type, as the category itself is the type
            matchesSubcategory = true;
        } else {
            // Generic Games logic (Switch, PS5, etc.)
            matchesContext = product.category === category.name ||
                product.category === category.slug ||
                product.category.toLowerCase() === category.name.toLowerCase();

            if (category.slug === 'pc-juegos') {
                matchesSubcategory = true;
            } else {
                matchesSubcategory = product.type === currentType;
            }
        }

        return matchesContext && matchesSubcategory;
    });

    // Determine legacy subcategories (for searchParams.type filtering)
    // We only use this for title display now if manual
    let legacySubcategories: { id: string; name: string; type: string }[] = [];
    // ... (rest of legacy subcategories logic logic for non-tree structure if needed)
    // BUT we will rely on SidebarItems for the sidebar now.

    // Fallback: If no tree context found (e.g. Moviles), construct SidebarItems manually from legacy logic
    if (sidebarItems.length === 0) {
        // [Existing hardcoded if/else blocks for 'subcategories' variable]
        // We need to run the massive if/else block to get 'subcategories' and then map it.
        // Copying the existing logic logic...

        if (category.slug.includes('peliculas') || category.name.toLowerCase().includes('películas')) {
            legacySubcategories = [
                { id: 'vhs', name: 'VHS', type: 'vhs' },
                { id: 'dvd', name: 'DVD', type: 'dvd' },
                { id: 'bluray', name: 'Blu-Ray', type: 'bluray' },
            ];
        } else if (category.slug.includes('informatica') || category.name.toLowerCase().includes('informática')) {
            legacySubcategories = [
                { id: 'tablets', name: 'Tablets', type: 'tablets' },
                { id: 'portatiles', name: 'Portátiles', type: 'portatiles' },
                { id: 'sobremesa', name: 'Sobremesa', type: 'sobremesa' },
                { id: 'monitores', name: 'Monitores', type: 'monitores' },
                { id: 'accesorios', name: 'Accesorios', type: 'accesorios' },
            ];
        } else if (category.slug.includes('musica') || category.name.toLowerCase().includes('música')) {
            legacySubcategories = [
                { id: 'cd', name: 'CD', type: 'cd' },
                { id: 'vinilo', name: 'Vinilo', type: 'vinilo' },
            ];
        } else if (category.slug.includes('electronica') || category.name.toLowerCase().includes('electrónica')) {
            legacySubcategories = [
                { id: 'audio', name: 'Audio', type: 'audio' },
                { id: 'television', name: 'Televisión', type: 'television' },
                { id: 'camaras', name: 'Cámaras', type: 'camaras' },
                { id: 'smartwatch', name: 'Smartwatch', type: 'smartwatch' },
                { id: 'accesorios', name: 'Accesorios', type: 'accesorios' },
            ];
        } else if (category.slug.includes('moviles') || category.name.toLowerCase().includes('móviles')) {
            legacySubcategories = [
                { id: 'apple', name: 'Apple', type: 'apple' },
                { id: 'samsung', name: 'Samsung', type: 'samsung' },
                { id: 'xiaomi', name: 'Xiaomi', type: 'xiaomi' },
                { id: 'huawei', name: 'Huawei', type: 'huawei' },
                { id: 'realme', name: 'Realme', type: 'realme' },
            ];
        }

        // ... (For Hubs that were handled manually before)
        else if (category.slug === 'modern-nintendo-hub') {
            legacySubcategories = [
                { id: 'switch', name: 'Nintendo Switch', type: 'switch' },
                { id: 'switch-2', name: 'Switch 2', type: 'switch-2' },
            ];
        } else if (category.slug === 'playstation') {
            legacySubcategories = [
                { id: 'ps1', name: 'PlayStation 1', type: 'playstation-1' },
                { id: 'ps2', name: 'PlayStation 2', type: 'playstation-2' },
                { id: 'ps3', name: 'PlayStation 3', type: 'playstation-3' },
                { id: 'ps4', name: 'PlayStation 4', type: 'playstation-4' },
                { id: 'ps5', name: 'PlayStation 5', type: 'playstation-5' },
                { id: 'ps-portal', name: 'PS Portal', type: 'ps-portal' },
            ];
        } else if (category.slug === 'xbox') {
            legacySubcategories = [
                { id: 'retro-xbox', name: 'Xbox Clásica', type: 'xbox' },
                { id: 'xbox-360', name: 'Xbox 360', type: 'xbox-360' },
                { id: 'xbox-one', name: 'Xbox One', type: 'xbox-one' },
                { id: 'xbox-series', name: 'Xbox Series', type: 'xbox-series' },
            ];
        }
        // ... (We can skip the rest if we assume context works for the tree items)

        if (legacySubcategories.length > 0) {
            sidebarItems = legacySubcategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                // Some used ?type=, others used slug. This is the tricky part of mixed routing.
                // The manual logic had: isHubPage ? sub.type (slug) : ?type=sub.type
                // We need to replicate that robustly.
                url: (['modern-nintendo-hub', 'playstation', 'xbox'].includes(category.slug))
                    ? `/categories/${sub.type}`
                    : `/categories/${slug}?type=${sub.type}`,
                active: currentType === sub.type
            }));
        }
    }


    return (
        <div className={styles.container}>
            {/* Navigation Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Link
                    href={backLink}
                    className="btn"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        backgroundColor: '#f5f5f5',
                        color: '#333',
                        border: '1px solid #ddd'
                    }}
                >
                    ← {backLabel}
                </Link>
            </div>

            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs}>
                <Link href="/">Inicio</Link>
                <span className={styles.separator}>/</span>
                <Link href="/categories">Categorías</Link>

                {/* Dynamic Breadcrumbs from Context */}
                {context && context.path.map((crumb: { id: string; name: string }, index: number) => {
                    // Don't show current category again if it's the last one, as it is handled by static logic below?
                    // Actually, context.path INCLUDES current.
                    // We should show: Root > ... > Parent > Current
                    // But the existing static breadcrumb logic below shows: / Categories / [Current Page Name] / [Type/Subcat Name]

                    // Let's replace the middle part.
                    if (crumb.id === context.current.id) return null; // Skip current, rendered below

                    return (
                        <span key={crumb.id} style={{ display: 'contents' }}>
                            <span className={styles.separator}>/</span>
                            <Link href={`/categories/${getSlug(crumb.id)}`}>{crumb.name}</Link>
                        </span>
                    );
                })}

                <span className={styles.separator}>/</span>
                <Link href={`/categories/${slug}`} className={styles.current}>{category.name}</Link>

                {/* 
                   If currentType is NOT 'console' (default), it means we are in a sub-view (like ?type=game).
                   Show that as the final leaf.
                */}
                {currentType !== 'console' && !sidebarItems.find(s => s.id === slug) && (
                    <>
                        <span className={styles.separator}>/</span>
                        <span className={styles.current}>
                            {/* Try to find name of current type in sidebar items or legacy */}
                            {sidebarItems.find(s => s.url.includes(currentType))?.name ||
                                legacySubcategories.find(s => s.type === currentType)?.name ||
                                currentType}
                        </span>
                    </>
                )}
            </nav>

            <div className={styles.layout}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <h3 className={styles.sidebarTitle}>Categorías</h3>
                    {sidebarItems.length > 0 ? (
                        <ul className={styles.sidebarList}>
                            {sidebarItems.map((item) => (
                                <li key={item.id} className={styles.sidebarItem}>
                                    <Link
                                        href={item.url}
                                        className={`${styles.sidebarLink} ${item.active ? styles.active : ''}`}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ padding: '0 10px', color: '#666' }}>No hay subcategorías disponibles.</p>
                    )}
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {/* Category Header */}
                    <div className={styles.header}>
                        <div className={styles.imageWrapper}>
                            <img
                                src={category.image}
                                alt={category.name}
                                className={styles.categoryImage}
                            />
                        </div>
                        <div className={styles.headerContent}>
                            <h1 className={styles.title}>{category.name}</h1>
                            <h2 className={styles.subtitle}>
                                {sidebarItems.find(s => s.url.includes(`/${currentType}`) || s.id === currentType)?.name ||
                                    legacySubcategories.find(s => s.type === currentType)?.name}
                            </h2>
                            {category.description && (
                                <p className={styles.description}>{category.description}</p>
                            )}
                            <p className={styles.productCount}>
                                {categoryProducts.length} productos disponibles
                            </p>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className={styles.productsSection}>
                        <ProductGrid products={categoryProducts} />
                    </div>
                </main>
            </div>
        </div>
    );
}

// Generate static params for all categories
export async function generateStaticParams() {
    const { getAllCategories } = await import('@/lib/categories');
    const categories = getAllCategories();

    return categories.map((category) => ({
        slug: category.slug,
    }));
}
