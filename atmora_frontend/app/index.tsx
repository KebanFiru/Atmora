import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import LeafletMap with SSR disabled
const LeafletMap = dynamic(() => import('../components/LeafletMap'), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Leaflet Map with Tailwind</title>
      </Head>
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Leaflet Map + Tailwind + Next.js</h1>
        <LeafletMap />
      </main>
    </>
  );
}
