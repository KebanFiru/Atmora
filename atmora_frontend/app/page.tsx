'use client'; // Required if you want client-side hooks or dynamic imports here

import dynamic from 'next/dynamic';

// Dynamically import the LeafletMap component with SSR disabled
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false });

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Leaflet Map with Next.js App Router + Tailwind CSS</h1>
      <div className="w-full max-w-4xl h-[80vh] rounded-lg shadow-lg overflow-hidden">
        <LeafletMap />
      </div>
    </main>
  );
}
