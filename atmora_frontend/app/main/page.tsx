'use client';

import dynamic from 'next/dynamic';
import WeatherForm from '../../components/WeatherForm';
// Dynamically import SelectorSwitch with SSR disabled (client-only)
const SelectorSelector = dynamic(() => import('../../components/SelectorSelector'), { ssr: false });

export default function Main() {
  return (
    <>
      <WeatherForm/>
      <SelectorSelector />
  
    </>
    );
}
