import '@/app/globals.css';

export const metadata = {
  title: 'HOTS - Hara Operational & Training System',
  description: 'Hara Chicken Training & Operations Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#070101] text-white">
        {children}
      </body>
    </html>
  );
}
