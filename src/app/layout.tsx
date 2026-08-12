import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/context/AuthContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import PushNotificationManager from '@/app/components/PushNotificationManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LYVO - La comunidad del video y audio',
  description: 'Comparte tus momentos en LYVO',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LYVO',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo/logo-short.png', type: 'image/png' },
      { url: '/logo/logo-voz.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/logo/logo-short.png', sizes: '180x180', type: 'image/png' },
      { url: '/logo/logo-voz.png', type: 'image/png' }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo/logo-short.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/logo-short.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <GlobalErrorBoundary>
          <AuthProvider>
            <PushNotificationManager />
            {children}
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
