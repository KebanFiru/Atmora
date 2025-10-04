'use client';

import dynamic from 'next/dynamic';

const SelectorSelector = dynamic(() => import('../../components/SelectorSelector'), { ssr: false });

export default function Main() {
  return <SelectorSelector />;
}
