import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLAIR — Credit Limit AI Review',
  description:
    'Instant AI-generated credit assessments for your overseas buyers. Powered by professional credit underwriting methodology.',
  keywords: ['credit assessment', 'trade credit', 'credit limit', 'credit underwriting', 'buyer risk'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
