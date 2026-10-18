import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
