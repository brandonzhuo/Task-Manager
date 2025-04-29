import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// -------------------------------
// Handle PUT request (update a task)
// -------------------------------
// PUT /api/tasks/:id → Update an existing task
// PUT Updates task fields (title, description, dueDate, status) based on the task ID
// Frontend sends: PUT /api/tasks/:id with JSON body { title?, description?, dueDate?, status? }
// Backend reads ID from params
// Fetches the existing task from DB
// Updates only provided fields, keeps others unchanged
// Responds with: 200 + updated task JSON
// -------------------------------
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 1. Get the task ID from the URL params
    const { id } = await context.params;

    // 2. Read the request body (contains fields like title, description, etc.)
    const body = await request.json();
    const { title, description, dueDate, status } = body;

    // 3. Find the existing task in database
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    // 4. If no such task exists, return 404 error
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 5. Update the task: Only override fields that are provided, else keep old values
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title: title ?? existingTask.title,                      // if title is provided, update it; else keep old title
        description: description ?? existingTask.description,    // same for description
        dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate, // parse date string into Date object if provided
        status: status ?? existingTask.status,                   // same for status
      },
    });

    // 6. Return the updated task as JSON
    return NextResponse.json(updatedTask);

  } catch (error: any) {
    // 7. If something went wrong (server error, etc.)
    console.error('Error updating task:', error.message || error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}


// -------------------------------
// Handle DELETE request (delete a task)
// -------------------------------
// DELETE /api/tasks/:id → Delete an existing task
// DELETE Removes a task permanently from the database based on the task ID
// Frontend sends: DELETE /api/tasks/:id
// Backend reads ID from params
// Deletes the matching task from database
// Responds with: 200 + success message
// -------------------------------
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 1. Get the task ID from URL params
    const { id } = await context.params;

    // 2. Delete the task with that ID from the database
    await prisma.task.delete({
      where: { id: Number(id) },
    });

    // 3. Send back success response
    return NextResponse.json({ message: 'Task deleted' }, { status: 200 });

  } catch (error) {
    // 4. If something went wrong (e.g., task not found, server error)
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

