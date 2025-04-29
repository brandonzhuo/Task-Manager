import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// -----------------------------
// 1. Define the structure of each task
// -----------------------------
export type Task = {
  id: string;            // Unique identifier for the task
  content: string;       // The title or name of the task
  description?: string;  // Optional: more detailed info
  dueDate?: string;      // Optional: deadline in YYYY-MM-DD format
};

// -----------------------------
// 2. Define the structure of the tasks state
// -----------------------------
export type TasksState = {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
};

// Type for column keys (either 'todo', 'inProgress', or 'done')
export type ColumnId = keyof TasksState;

// -----------------------------
// 3. Initial state for the board
// -----------------------------
const initialState: TasksState = {
  todo: [{ id: '1', content: '' }],
  inProgress: [{ id: '2', content: '' }],
  done: [{ id: '3', content: '' }],
};

// -----------------------------
// 4. Create the slice
// action	A plain object that describes what happened (e.g., "add a task")
// payload	The data carried by the action (e.g., which task to add, which task to remove)
// state	The current state (your tasks board) that can be updated inside the reducer
// -----------------------------
const tasksSlice = createSlice({
  name: 'tasks',             // Name used in Redux DevTools
  initialState,              // The initial structure of the state
  reducers: {
    // 4.1 Add a new task to a specific column
    addTask: (state, action: PayloadAction<{ columnId: ColumnId; task: Task }>) => {
      state[action.payload.columnId].push(action.payload.task);
    },

    // 4.2 Remove a task by ID from a specific column
    removeTask: (state, action: PayloadAction<{ columnId: ColumnId; taskId: string }>) => {
      state[action.payload.columnId] = state[action.payload.columnId].filter(
        (task) => task.id !== action.payload.taskId
      );
    },

    // 4.3 Move a task from one column and index to another
    moveTask: (
      state,
      action: PayloadAction<{
        source: ColumnId;
        destination: ColumnId;
        sourceIndex: number;
        destIndex: number;
      }>
    ) => {
      const [moved] = state[action.payload.source].splice(action.payload.sourceIndex, 1); // Remove the task from the source column at sourceIndex
      state[action.payload.destination].splice(action.payload.destIndex, 0, moved); // Insert it into the destination column at destIndex
    },

    // 4.4 Replace the entire board's task state (e.g., after fetching from the database)
    setTasks: (state, action: PayloadAction<TasksState>) => {
      state.todo = action.payload.todo;
      state.inProgress = action.payload.inProgress;
      state.done = action.payload.done;
    },

    // 4.5 Update a task’s content, description, or due date
    updateTaskContent: (
      state,
      action: PayloadAction<{
        columnId: ColumnId;
        taskId: string;
        newContent?: string;
        newDescription?: string;
        newDueDate?: string;
      }>
    ) => {
      const task = state[action.payload.columnId].find(t => t.id === action.payload.taskId);
      if (task) {
        if (action.payload.newContent !== undefined) task.content = action.payload.newContent;
        if (action.payload.newDescription !== undefined) task.description = action.payload.newDescription;
        if (action.payload.newDueDate !== undefined) task.dueDate = action.payload.newDueDate;
      }
    },
  },
});

// -----------------------------
// 5. Export actions and reducer
// -----------------------------

// Export each reducer action so you can use them in components (e.g., dispatch(addTask(...)))
export const {
  addTask,
  removeTask,
  moveTask,
  setTasks,
  updateTaskContent
} = tasksSlice.actions;

// Export the reducer itself so it can be added to the Redux store
export default tasksSlice.reducer;
