import 'leaflet/dist/leaflet.css'; // ✅ Leaflet CSS
import './globals.css';            // ✅ Tailwind CSS

import type { Metadata } from 'next';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
