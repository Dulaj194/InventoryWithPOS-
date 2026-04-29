import './globals.css';
import type { Metadata, Viewport } from 'next';
import PWARegistration from '../components/PWARegistration';

export const metadata: Metadata = {
  title: 'myPosSystem Admin',
  description: 'SaaS POS and Inventory admin panel starter',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#154d71',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
