import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  
  response.headers.set(
    'Set-Cookie',
    serialize('token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Expire the cookie immediately
    })
  );

  return response;
}
