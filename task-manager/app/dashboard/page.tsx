'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Task type
type Task = {
  id: string;
  content: string;
};

// Task state type
type Tasks = {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
};

const KanbanBoard = () => {
  const [tasks, setTasks] = useState<Tasks>({
    todo: [{ id: '1', content: 'Task 1' }, { id: '2', content: 'Task 2' }],
    inProgress: [{ id: '3', content: 'Task 3' }],
    done: [{ id: '4', content: 'Task 4' }],
  });

  // Add a task
  const addTask = (columnId: keyof Tasks, content: string) => {
    const newTask: Task = {
      id: String(Date.now()), // Unique ID based on timestamp
      content,
    };

    setTasks((prevState) => ({
      ...prevState,
      [columnId]: [...prevState[columnId], newTask], // Add task to the specified column
    }));
  };

  // Remove a task
  const removeTask = (columnId: keyof Tasks, taskId: string) => {
    setTasks((prevState) => ({
      ...prevState,
      [columnId]: prevState[columnId].filter((task) => task.id !== taskId), // Filter out task
    }));
  };

  // Handle the drag end event
  const handleOnDragEnd = (result: any) => {
    const { destination, source } = result;

    if (!destination) {
      return; // Dropped outside the board
    }

    // If the task is dropped in the same place, no need to do anything
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const startColumn = tasks[source.droppableId as keyof Tasks];
    const finishColumn = tasks[destination.droppableId as keyof Tasks];
    const [movedTask] = startColumn.splice(source.index, 1);
    finishColumn.splice(destination.index, 0, movedTask);

    setTasks({
      ...tasks,
      [source.droppableId]: startColumn,
      [destination.droppableId]: finishColumn,
    });
  };

  return (
    <div>
      <div className="kanban-board">
        {Object.keys(tasks).map((columnId) => (
          <Droppable droppableId={columnId} key={columnId}>
            {(provided) => (
              <div
                className="column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2 className="column-title">{columnId}</h2>
                {tasks[columnId as keyof Tasks].map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        className="task"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {task.content}
                        <button
                          onClick={() => removeTask(columnId as keyof Tasks, task.id)}
                          className="remove-task-btn"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {/* Button to add a task to the column */}
                <button
                  onClick={() => addTask(columnId as keyof Tasks, 'New Task')}
                  className="add-task-btn"
                >
                  Add Task
                </button>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
