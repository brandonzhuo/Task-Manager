import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './tasksSlice';

// Create the Redux store
// This is the central place that holds the entire state of your app
export const store = configureStore({
  
  // Here we define all the slices (state "modules") your app will use
  // Each slice manages a part of the global state
  reducer: {

    // The 'tasks' key will store the data managed by tasksReducer (e.g. kanban tasks)
    tasks: tasksReducer, 
  },
});

// Infer and export the type of the root state (the full state object structure)
// This helps with autocompletion and type safety in useSelector
export type RootState = ReturnType<typeof store.getState>;

// Export the type for dispatch function from the store
// This ensures that when we use dispatch, it's typed correctly for all async and sync actions
export type AppDispatch = typeof store.dispatch;
