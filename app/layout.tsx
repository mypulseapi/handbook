import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';
import type { Metadata } from 'next';

/*
 * metadataBase is set because the OG image routes resolve against it. Without it Next falls back
 * to localhost:3000 and every shared link renders a broken preview, which is only noticed after
 * someone posts one.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://developer.thepulseapi.com'),
  title: { default: 'PULSE Developers', template: '%s - PULSE Developers' },
  description: 'Build with the PULSE Decision API: real-time persona inference for e-commerce.',
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
