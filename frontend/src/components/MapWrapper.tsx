'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with ssr: false to prevent SSR hydration timeout
const LeafletMap = dynamic(() => import('./SpatialMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-cyan-400">Loading Geospatial Telemetry Grid...</span>
    </div>
  ),
});

export default function MapWrapper(props: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[520px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LeafletMap {...props} />;
}
