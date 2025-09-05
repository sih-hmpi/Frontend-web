"use client";

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Correctly type the dynamic import
const MapWithNoSSR = dynamic<ComponentType>(
  () => import('./map-component'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    )
  }
);

export function WellMapViewer() {
  return (
    <div className="h-full w-full relative">
      <MapWithNoSSR />
    </div>
  );
}
