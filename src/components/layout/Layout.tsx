import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-bg">
      <Header />
      <main className="mx-auto w-full max-w-layout flex-1 box-border px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}
