import './globals.css';
import 'leaflet/dist/leaflet.css';
import Main from './main/page';

export const metadata = {
  title: "Atmora",
  description: "Atmora Weather App",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Main/>
        {children}
      </body>
    </html>
  );
}