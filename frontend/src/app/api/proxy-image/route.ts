import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  // Allow only known image CDNs
  const allowed = [
    'cdn.meutimao.com.br',
    'www.meutimao.com.br',
    'corinthians.com.br',
    'scontent',
    'fielriopardo.com.br',
  ];
  let parsed: URL;
  try { parsed = new URL(url); } catch { return new NextResponse('Invalid url', { status: 400 }); }
  if (!allowed.some(h => parsed.hostname.includes(h))) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FielRioPardo/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return new NextResponse('Upstream error', { status: 502 });

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
