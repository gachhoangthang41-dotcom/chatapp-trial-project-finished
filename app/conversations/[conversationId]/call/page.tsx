'use client';

import dynamic from 'next/dynamic';

const CallRoom = dynamic(() => import('./CallRoom'), { ssr: false });

export default function Page() {
  return <CallRoom />;
}
