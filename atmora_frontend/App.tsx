import React from 'react';
import VerticalDateSlider from './components/VerticalDateSlider';
import BottomHorizontalBar from './components/BottomHorizontalBar';

export default function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800 transition-colors">
      {/* Main surface; replace with your map beneath the overlays */}
      <main className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('/placeholder-map.png')] bg-cover bg-center opacity-10 dark:opacity-30" />

        {/* Overlays */}
        <VerticalDateSlider />
        <BottomHorizontalBar />
      </main>
    </div>
  );
}
