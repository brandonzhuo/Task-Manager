import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Edge-compatible JWT secret
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    // Token is valid
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid token', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Protect only dashboard routesnpm
export const config = {
  matcher: ['/dashboard/:path*'],
};
