import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PLATFORM_NAME } from '@/lib/branding';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: PLATFORM_NAME,
  description: 'Technical screening portal for Arfa Developers candidates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
