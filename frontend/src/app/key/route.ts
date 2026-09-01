import { NextResponse } from 'next/server';

export async function GET() {
  const content = 'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBA27+k9KjFz+K6YZEp3m+LfZXT9Q//iXgtH4Aknrp5aOQqaDtROZKODaqD7KR7OMSxWQ110G7QVyFrRINA8IK5I= fielriopardo';
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
