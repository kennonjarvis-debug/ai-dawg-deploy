import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/lib/auth/session-provider';
import { AudioProvider } from '@/src/core/AudioProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DAWG AI - AI-Powered Vocal Coach & DAW',
  description: 'Create professional songs with AI-guided adaptive journeys',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
