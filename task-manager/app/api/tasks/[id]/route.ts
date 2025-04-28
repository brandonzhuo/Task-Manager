import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update a task
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { title, description, status } = await request.json();

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(params.id) },
      data: {
        title,
        description,
        status, // <-- update the new status here
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}


// Handle DELETE (Delete Task)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = Number(params.id);

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
