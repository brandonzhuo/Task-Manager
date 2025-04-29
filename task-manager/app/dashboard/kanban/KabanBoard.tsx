'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { addTask, removeTask, moveTask, setTasks,updateTaskContent } from '../../store/tasksSlice';
import type { ColumnId, Task, TasksState } from '../../store/tasksSlice';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { destroyCookie, parseCookies } from 'nookies';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  role: string;
}

const KanbanBoard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks);
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch userId from JWT
  useEffect(() => {
    const cookies = parseCookies();
    const token = cookies.token;
    if (token) {
      const decoded = jwtDecode<DecodedToken>(token);
      setUserId(decoded.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch tasks from DB
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const dbTasks = await res.json();

        const initialTasks: TasksState = {
          todo: [],
          inProgress: [],
          done: [],
        };

        dbTasks.forEach((task: any) => {
          const columnId = task.status as ColumnId;
          initialTasks[columnId].push({
            id: task.id.toString(),
            content: task.title,
            description: task.description || '',
          });
        });

        dispatch(setTasks(initialTasks));
      } catch (err) {
        console.error(err);
      }
    };

    fetchTasks();
  }, [dispatch]);

  // Handle drag end
  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId as ColumnId;
    const destCol = destination.droppableId as ColumnId;
    const movedTask = tasks[sourceCol][source.index];

    dispatch(
      moveTask({
        source: sourceCol,
        destination: destCol,
        sourceIndex: source.index,
        destIndex: destination.index,
      })
    );

    try {
      await fetch(`/api/tasks/${movedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: movedTask.content,
          status: destCol,
        }),
      });
    } catch (err) {
      console.error('Failed to update task status', err);
      alert('Failed to save task position!');
    }
  };

  // Add new task
  const handleAddTask = async (columnId: ColumnId) => {
    if (!userId) return;

    const title = 'New Task';
    const description = '';
    const dueDate = new Date().toISOString();
    const status = columnId;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate, status, userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask = await res.json();

      dispatch(
        addTask({
          columnId,
          task: {
            id: createdTask.id.toString(),
            content: createdTask.title,
          },
        })
      );
    } catch (err) {
      console.error(err);
      alert('Could not create task');
    }
  };

  // Delete task
  const handleRemoveTask = async (columnId: ColumnId, taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      dispatch(removeTask({ columnId, taskId }));
    } catch (err) {
      console.error(err);
      alert('Could not delete task');
    }
  };

  // Update task title
  const handleUpdateTask = async (taskId: string, title: string, description: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
    } catch (err) {
      console.error('Failed to update task');
    }
  };
  
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      destroyCookie(null, 'token');
      router.push('/login');
    }
  };

  let debounceTimer: NodeJS.Timeout;
  const debounceUpdateTask = (taskId: string, title: string, description: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleUpdateTask(taskId, title, description);
    }, 500);
  };

  const columns: ColumnId[] = ['todo', 'inProgress', 'done'];
  const columnNames: Record<ColumnId, string> = {
    todo: 'Todo',
    inProgress: 'In Progress',
    done: 'Done',
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Kanban Board</h1>
        <button
          onClick={handleSignOut}
          className="bg-white text-purple-600 font-semibold py-2 px-6 rounded-full shadow hover:bg-purple-100 transition"
        >
          Sign Out
        </button>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex gap-6 overflow-x-auto">
          {columns.map((columnId) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div
                  className="flex-1 min-w-[300px] bg-white p-4 rounded-lg shadow-md"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2 className="text-xl font-bold mb-4 text-purple-600">{columnNames[columnId]}</h2>

                  {tasks[columnId].map((task, index) => (
                    <Draggable draggableId={task.id} index={index} key={task.id}>
                      {(provided, snapshot) => {
                        const [hovered, setHovered] = useState(false);

                        const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const newContent = e.target.value;
                          dispatch(updateTaskContent({ columnId, taskId: task.id, newContent }));
                          debounceUpdateTask(task.id, newContent, task.description || '');
                        };
                        
                        const handleDelete = async () => {
                          const confirmDelete = confirm('Are you sure you want to delete this task?');
                          if (confirmDelete) {
                            await handleRemoveTask(columnId, task.id);
                          }
                        };

                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative p-3 mb-3 rounded-xl shadow-lg transition-colors ${
                              snapshot.isDragging
                                ? 'bg-purple-100 border border-purple-400'
                                : 'bg-white/90 border border-white'
                            }`}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                          >
                            {hovered && (
                              <button
                                onClick={handleDelete}
                                className="absolute -top-2 -right-2 transition-all duration-200 ease-in-out hover:scale-125 hover:opacity-80"
                              >
                                <img 
                                  src="/close.png" 
                                  alt="Delete" 
                                  className="w-5 h-5"
                                />
                              </button>
                            )}
                            <input
                              type="text"
                              value={task.content}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                dispatch(updateTaskContent({ columnId, taskId: task.id, newContent: newTitle }));
                                debounceUpdateTask(task.id, newTitle, task.description || '');
                              }}
                              placeholder="Task title..."
                              className="w-full mb-2 p-2 text-sm text-gray-800 font-semibold rounded-md border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                            />

                            <textarea
                              value={task.description || ''}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                dispatch(updateTaskContent({ columnId, taskId: task.id, newDescription: newDesc }));
                                debounceUpdateTask(task.id, task.content, newDesc);
                              }}
                              placeholder="Task description..."
                              className="w-full p-3 text-sm text-gray-800 rounded-md border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none shadow-inner"
                              rows={4}
                            />
                          </div>
                        );
                      }}
                    </Draggable>
                  ))}

                  {provided.placeholder}

                  <button
                    onClick={() => handleAddTask(columnId)}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-md hover:opacity-90 transition text-sm"
                  >
                    + Add another card
                  </button>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
