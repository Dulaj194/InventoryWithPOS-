import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'myPosSystem Admin',
  description: 'SaaS POS and Inventory admin panel starter',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
