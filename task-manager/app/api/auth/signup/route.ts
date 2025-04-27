import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '@/utils/jwt';  // Ensure this utility is available

export const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON request body
    const { name, email, password } = await request.json();

    // Check if the email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // Default role is 'USER'
      },
    });

    // Generate JWT token
    const token = generateToken(user);

    // Send response with the token
    return NextResponse.json({ token });
  } catch (error) {
    console.error(error); // Log error for debugging purposes
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  } finally {
    // Ensuring Prisma client connection is closed
    await prisma.$disconnect();
  }
}
