'use client';

import dynamic from 'next/dynamic';

// Dynamically import SelectorSwitch with SSR disabled (client-only)
const SelectorSelector = dynamic(() => import('../../components/SelectorSelector'), { ssr: false });

export default function Main() {
  return <SelectorSelector />;
}
