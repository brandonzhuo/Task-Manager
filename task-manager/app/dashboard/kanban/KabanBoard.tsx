'use client'; // Enable Client-Side rendering (since Next.js 13 by default is server components)

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'; // Drag-and-Drop library
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks
import { RootState, AppDispatch } from '../../store/store'; // Redux store types
import { addTask, removeTask, moveTask, setTasks, updateTaskContent } from '../../store/tasksSlice'; // Redux actions
import type { ColumnId, Task, TasksState } from '../../store/tasksSlice'; // Type definitions
import { useEffect, useState } from 'react'; // React hooks
import { useRouter } from 'next/navigation'; // Next.js client-side navigation
import { destroyCookie, parseCookies } from 'nookies'; // Handle cookies (for auth token)
import { jwtDecode } from 'jwt-decode'; // Decode JWT token

// Interface for decoded token structure
interface DecodedToken {
  id: number;
  role: string;
}

const KanbanBoard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks); // Get tasks state from Redux
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  // ------------------------
  // Step 1. Get user ID from JWT Token
  // ------------------------
  useEffect(() => {
    const cookies = parseCookies(); // 1. Get all cookies from browser
    const token = cookies.token; // 2. Try to read the 'token' cookie (JWT token)
    if (token) {
      const decoded = jwtDecode<DecodedToken>(token); // 3. Decode the token to get user info
      setUserId(decoded.id); // 4. Store user's id into local state
    } else {
      router.push('/login'); // 5. No token = redirect to login page
    }
  }, [router]);

  // ------------------------
  // Step 2. Fetch user's tasks from backend when page loads
  // Make a GET request to your server /api/tasks
  // Backend checks user's token, fetches all user's tasks
  // Frontend receives a list of task objects
  // Organises them into todo, inProgress, and done
  // Pushes organised tasks into Redux using dispatch(setTasks(initialTasks))
  // Kanban board automatically renders with the fetched tasks!
  // ------------------------
  useEffect(() => {
    // Function to fetch tasks from the server
    const fetchTasks = async () => {
      try {
        // 1. Call your backend API (/api/tasks) to get user's tasks
        const res = await fetch('/api/tasks');
  
        // 2. If server response is not OK (status code 200), throw an error
        if (!res.ok) throw new Error('Failed to fetch tasks');
  
        // 3. Convert server response (JSON) into JS array
        const dbTasks = await res.json();
  
        // 4. Prepare empty initial structure for Redux
        const initialTasks: TasksState = {
          todo: [],
          inProgress: [],
          done: [],
        };
  
        // 5. Loop through each task fetched from database
        dbTasks.forEach((task: any) => {
          const columnId = task.status as ColumnId; // Get task's status (todo, inProgress, done)
  
          // 6. Push the task into the correct column array
          initialTasks[columnId].push({
            id: task.id.toString(),             // Always use string IDs for frontend consistency
            content: task.title,                // Task title
            description: task.description || '', // Task description (fallback to empty string)
            dueDate: task.dueDate || '',         // Task due date (fallback to empty string)
          });
        });
  
        // 7. Save the final grouped tasks into Redux store
        dispatch(setTasks(initialTasks)); 
  
      } catch (err) {
        // 8. If something went wrong (network error etc), log error
        console.error(err);
      }
    };
  
    // Call fetchTasks immediately when page loads
    fetchTasks();
  }, [dispatch]); // Dependency array: only re-run if `dispatch` function changes (rare)
  
  // ------------------------
  // Step 3. Handle dragging and dropping of tasks
  // ------------------------
  const handleOnDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return; // Dropped outside list
    if (source.droppableId === destination.droppableId && source.index === destination.index) return; // Same spot

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

    // Update status in database
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

  // ------------------------
  // Step 4. Handle creating a new task
  // ------------------------
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

  // ------------------------
  // Step 5. Handle deleting a task
  // ------------------------
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

  // ------------------------
  // Step 6. Handle updating a task (title, description, dueDate)
  // ------------------------
  const handleUpdateTask = async (taskId: string, title: string, description: string, dueDate: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate }),
      });
    } catch (err) {
      console.error('Failed to update task');
    }
  };

  // ------------------------
  // Step 7. Handle user logout
  // ------------------------
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      destroyCookie(null, 'token'); // Clear token
      router.push('/login'); // Redirect to login
    }
  };

  // ------------------------
  // Step 8. Debounce update task (to avoid spamming server while typing)
  // ------------------------
  let debounceTimer: NodeJS.Timeout;
  const debounceUpdateTask = (taskId: string, title: string, description: string, dueDate: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleUpdateTask(taskId, title, description, dueDate);
    }, 500); // 500ms after user stops typing
  };

  // Columns and their titles
  const columns: ColumnId[] = ['todo', 'inProgress', 'done'];
  const columnNames: Record<ColumnId, string> = {
    todo: 'Todo',
    inProgress: 'In Progress',
    done: 'Done',
  };

  // ------------------------
  // Step 9. Render the Kanban Board
  // ------------------------
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

                        // Update title immediately
                        const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const newContent = e.target.value;
                          dispatch(updateTaskContent({ columnId, taskId: task.id, newContent }));
                          debounceUpdateTask(task.id, newContent, task.description || '', task.dueDate || '');
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
                                <img src="/close.png" alt="Delete" className="w-5 h-5" />
                              </button>
                            )}

                            {/* Title input */}
                            <input
                              type="text"
                              value={task.content}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                dispatch(updateTaskContent({ columnId, taskId: task.id, newContent: newTitle }));
                                debounceUpdateTask(task.id, newTitle, task.description || '', task.dueDate || '');
                              }}
                              placeholder="Task title..."
                              className="w-full mb-2 p-2 text-sm text-gray-800 font-semibold rounded-md border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                            />

                            {/* Description input */}
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                dispatch(updateTaskContent({ columnId, taskId: task.id, newDescription: newDesc }));
                                debounceUpdateTask(task.id, task.content, newDesc, task.dueDate || '');
                              }}
                              placeholder="Task description..."
                              className="w-full p-3 text-sm text-gray-800 rounded-md border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none shadow-inner"
                              rows={4}
                            />

                            {/* Due date input */}
                            <label className="block mt-2 mb-1 text-xs font-bold text-purple-700">Due By:</label>
                            <input
                              type="date"
                              value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                              onChange={(e) => {
                                const newDueDate = e.target.value;
                                dispatch(updateTaskContent({ columnId, taskId: task.id, newDueDate: newDueDate }));
                                debounceUpdateTask(task.id, task.content, task.description || '', newDueDate);
                              }}
                              className="w-full mt-2 p-2 text-sm font-bold text-gray-700 rounded-md border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
