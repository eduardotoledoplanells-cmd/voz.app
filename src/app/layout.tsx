import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { SellProvider } from '@/context/SellContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RevoluxBit - Tu tienda de videojuegos retro',
  description: 'Compra y vende videojuegos y consolas retro',
  manifest: '/manifest.json',
  themeColor: '#e60000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RevoluxBit',
  },
  icons: {
    icon: '/logo/logo-short.png',
    apple: '/logo/logo-short.png',
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
