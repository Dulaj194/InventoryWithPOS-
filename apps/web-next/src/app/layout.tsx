import './globals.css';
import type { Metadata } from 'next';
import PWARegistration from '../components/PWARegistration';

export const metadata: Metadata = {
  title: 'myPosSystem Admin',
  description: 'SaaS POS and Inventory admin panel starter',
  manifest: '/manifest.json',
  themeColor: '#154d71',
  icons: {
    icon: '/favicon.svg',
  },
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
