import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/jwt'; // Make sure you have this!
import { cookies } from 'next/headers'; // Server-side cookies

const prisma = new PrismaClient();

// Handle POST (Create Task)
export async function POST(request: Request) {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;


    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { title, description, dueDate, status } = await request.json();
    const userId = decoded.id; // Get user ID from token!

    if (!title || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || '',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        status,
        userId, // No more taking userId from client!
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// Handle GET (Fetch Tasks for logged-in user)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    console.log(userId)

    const tasks = await prisma.task.findMany({
      where: { userId }, // Fetch only user's tasks
      orderBy: { id: 'asc' },
    });

    console.log(tasks.length)

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
