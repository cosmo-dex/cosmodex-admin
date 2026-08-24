import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CosmoDex Admin Portal',
  description: 'Mission Control for Super Admin, Learning Admin, and Battle Arena',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#06020f] text-white min-h-screen antialiased selection:bg-[#E873C3]/30">
        {children}
      </body>
    </html>
  );
}
