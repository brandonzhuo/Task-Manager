'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { addTask, removeTask, moveTask } from '../../store/tasksSlice';
import type { ColumnId, Task } from '../../store/tasksSlice';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { destroyCookie, parseCookies } from 'nookies'; // 
import { jwtDecode } from 'jwt-decode';
import { setTasks } from '../../store/tasksSlice';
import { TasksState } from '../../store/tasksSlice';

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
      router.push('/login'); // No token = not logged in
    }
  }, [router]);

  // Fetch tasks from DB on page load
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
          });
        });
  
        dispatch(setTasks(initialTasks)); 
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchTasks();
  }, [dispatch]);
  

  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
  
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
  
    const sourceCol = source.droppableId as ColumnId;
    const destCol = destination.droppableId as ColumnId;
  
    const movedTask = tasks[sourceCol][source.index];
  
    // First: Dispatch to Redux immediately
    dispatch(
      moveTask({
        source: sourceCol,
        destination: destCol,
        sourceIndex: source.index,
        destIndex: destination.index,
      })
    );
  
    try {
      // Then: Update backend status
      await fetch(`/api/tasks/${movedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: movedTask.content,  // Keep title the same
          status: destCol,           // Change status!
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
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      dispatch(removeTask({ columnId, taskId }));
    } catch (err) {
      console.error(err);
      alert('Could not delete task');
    }
  };

  // Update task title
  const handleUpdateTask = async (taskId: string, newContent: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newContent,
          description: '',
          status: undefined,
        }),
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
                        const [taskContent, setTaskContent] = useState(task.content);
                        const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const newContent = e.target.value;
                          setTaskContent(newContent);
                          await handleUpdateTask(task.id, newContent);
                        };

                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-gray-100 p-3 mb-3 rounded-md shadow-sm border ${
                              snapshot.isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                            }`}
                          >
                            <textarea
                              value={taskContent}
                              onChange={handleContentChange}
                              placeholder="Write a task..."
                              className="w-full p-2 text-black text-sm rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-transparent"
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleRemoveTask(columnId, task.id)}
                                className="text-red-400 text-xs hover:text-red-600 mt-2"
                              >
                                Delete
                              </button>
                            </div>
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
