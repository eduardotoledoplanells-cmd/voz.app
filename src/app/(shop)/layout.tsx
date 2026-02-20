import "../globals.css";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/context/CartContext';
import { SellProvider } from '@/context/SellContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import CookieBanner from '@/components/legal/CookieBanner';
import ContentProtection from '@/components/ui/ContentProtection';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <SellProvider>
                <FavoritesProvider>
                    <Header />
                    <main style={{ minHeight: '80vh' }}>
                        {children}
                    </main>
                    <Footer />
                    <CookieBanner />
                    <ContentProtection />
                </FavoritesProvider>
            </SellProvider>
        </CartProvider>
    );
}
