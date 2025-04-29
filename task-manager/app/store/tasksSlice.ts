import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export type Task = {
  id: string;
  content: string;
  description?: string;
};

export type TasksState = {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
};

export type ColumnId = keyof TasksState;

const initialState: TasksState = {
  todo: [{ id: '1', content: '' }],
  inProgress: [{ id: '2', content: '' }],
  done: [{ id: '3', content: '' }],
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<{ columnId: ColumnId; task: Task }>) => {
      state[action.payload.columnId].push(action.payload.task);
    },
    removeTask: (state, action: PayloadAction<{ columnId: ColumnId; taskId: string }>) => {
      state[action.payload.columnId] = state[action.payload.columnId].filter(
        (task) => task.id !== action.payload.taskId
      );
    },
    moveTask: (state, action: PayloadAction<{ source: ColumnId; destination: ColumnId; sourceIndex: number; destIndex: number }>) => {
      const [moved] = state[action.payload.source].splice(action.payload.sourceIndex, 1);
      state[action.payload.destination].splice(action.payload.destIndex, 0, moved);
    },
    setTasks: (state, action: PayloadAction<TasksState>) => {
      state.todo = action.payload.todo;
      state.inProgress = action.payload.inProgress;
      state.done = action.payload.done;
    },
    updateTaskContent: (
      state,
      action: PayloadAction<{ columnId: ColumnId; taskId: string; newContent?: string; newDescription?: string }>
    ) => {
      const task = state[action.payload.columnId].find(t => t.id === action.payload.taskId);
      if (task) {
        if (action.payload.newContent !== undefined) {
          task.content = action.payload.newContent;
        }
        if (action.payload.newDescription !== undefined) {
          task.description = action.payload.newDescription;
        }
      }
    },
  },
});


export const { addTask, removeTask, moveTask, setTasks, updateTaskContent } = tasksSlice.actions;
export default tasksSlice.reducer;
