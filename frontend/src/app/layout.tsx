import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prelegal — Mutual NDA Creator',
  description: 'Fill in a form and download a completed Mutual NDA document.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
