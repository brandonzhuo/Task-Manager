import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '@/utils/jwt';  // Correct relative path

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON request body
    const { email, password } = await request.json();

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Respond with the token
    return NextResponse.json({ token });
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  } finally {
    // Ensure Prisma client disconnects after the request
    await prisma.$disconnect();
  }
}
