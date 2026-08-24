import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LocationProvider } from '@/context/LocationContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: 'NER Smart Logistics | AI-Enabled Corridor Intelligence',
  description: 'Disaster-Resilient Logistics and Telemetry Platform for Northeast India',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NER Logistics',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[100dvh] w-full overflow-x-hidden antialiased selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200`}
      >
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider>{children}</LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
