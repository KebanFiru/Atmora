'use client';

import dynamic from 'next/dynamic';

// SelectorSwitch'i dinamik yükle, ssr false çünkü leaflet client-only
const SelectorSwitch = dynamic(() => import('../../components/SelectorSelector'), { ssr: false });

export default function Main() {
  return <SelectorSwitch />;
}
