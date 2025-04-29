import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { title, description, dueDate, status } = body;

    // Fetch the existing task first
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only override fields if new values are provided
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title: title ?? existingTask.title,
        description: description ?? existingTask.description,
        dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate,
        status: status ?? existingTask.status,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Error updating task:', error.message || error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// Delete a task
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;  // <-- await params properly
    await prisma.task.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: 'Task deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
