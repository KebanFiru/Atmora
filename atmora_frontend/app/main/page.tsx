'use client';

import dynamic from 'next/dynamic';

// Dynamically import SelectorSwitch with SSR disabled (client-only)
const SelectorSwitch = dynamic(() => import('../../components/SelectorSelector'), { ssr: false });

export default function Main() {
  return <SelectorSwitch />;
}
