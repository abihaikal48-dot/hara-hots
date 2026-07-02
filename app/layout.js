import './globals.css';

export const metadata = {
  title: 'HOTS - Hara Operational & Training System',
  description: 'Sistem Operasional dan CBT Pelatihan Kru Hara Chicken',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-deep text-white antialiased">
        <main className="min-h-screen pb-20 select-none">
          {children}
        </main>
      </body>
    </html>
  );
}
