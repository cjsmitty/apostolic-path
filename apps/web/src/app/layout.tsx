import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Apostolic Path - Discipleship Platform',
  description:
    'Cloud-based discipleship platform for Apostolic churches. Track Bible studies, First Steps, and New Birth journeys.',
  keywords: ['UPCI', 'Apostolic', 'discipleship', 'church', 'Bible study', 'new birth'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
