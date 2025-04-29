import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/jwt'; // Utility to decode & verify JWT token
import { cookies } from 'next/headers';   // Access cookies from incoming request

// Create a new Prisma client to interact with your database
const prisma = new PrismaClient();

// -------------------------------
// POST /api/tasks → Create a new task
// POST	Adds a new task to the database (with title, description, etc.)
// Frontend sends: POST /api/tasks with JSON body { title, description, dueDate, status }
// Backend reads token from cookie
// Token is valid → insert into DB
// Respond with: 201 + created task
// -------------------------------
export async function POST(request: Request) {
  try {
    // Read token from cookies (used to identify the logged-in user)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // If no token found, block access
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify the token to get user info (e.g., id from JWT)
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get data from request body
    const { title, description, dueDate, status } = await request.json();
    const userId = decoded.id; // Use ID from token, not from frontend

    // Make sure required fields exist
    if (!title || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new task in the database using Prisma
    // Pull these fields from the frontend request (from Kanban board when a user adds a task)
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || '', // fallback to empty string
        dueDate: dueDate ? new Date(dueDate) : new Date(), // fallback to now
        status,
        userId,
      },
    });

    // Respond with the created task
    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    // Catch any error and respond with a 500 status
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// -------------------------------
// GET /api/tasks → Get all tasks for the logged-in user
// GET	Fetches all tasks belonging to the currently logged-in user
// Frontend sends: GET /api/tasks
// Backend checks token
// If valid → fetch all tasks for user
// Respond with: 200 + task list
// -------------------------------
export async function GET() {
  try {
    // Read token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // If no token found, block access
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    // Fetch all tasks for the current user, ordered by ID
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });

    // Respond with the list of tasks
    return NextResponse.json(tasks, { status: 200 });

  } catch (error) {
    // Catch and report any error
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
