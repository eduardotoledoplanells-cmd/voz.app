import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { SellProvider } from '@/context/SellContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VOZ - La comunidad del video y audio',
  description: 'Comparte tus momentos en VOZ',
  manifest: '/manifest.json',
  themeColor: '#8E2DE2',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VOZ',
  },
  icons: {
    icon: '/logo/logo-voz.png',
    apple: '/logo/logo-voz.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <SellProvider>
                {children}
              </SellProvider>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
