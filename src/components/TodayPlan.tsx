import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  mustDo: boolean;
}

const STORAGE_KEY = 'today-plan-tasks';

const TodayPlan: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      return [];
    }
  });
  const [newTask, setNewTask] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Sort tasks to keep Must Do items at the top
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.mustDo && !b.mustDo) return -1;
    if (!a.mustDo && b.mustDo) return 1;
    return 0;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      // Silently handle storage errors
    }
  }, [tasks]);

  // Keyboard navigation for reordering
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedTaskId) return; // Only proceed if a task is selected

      const selectedIndex = sortedTasks.findIndex(task => task.id === selectedTaskId);
      if (selectedIndex === -1) return; 

      let moved = false; // Flag to check if a move happened

      if (event.key === 'ArrowUp') {
        if (selectedIndex > 0) {
          event.preventDefault(); // Prevent page scrolling
          moveTask(selectedIndex, 'up');
          moved = true;
        }
      } else if (event.key === 'ArrowDown') {
        if (selectedIndex < sortedTasks.length - 1) {
          event.preventDefault(); // Prevent page scrolling
          moveTask(selectedIndex, 'down');
          moved = true;
        }
      }

      // If a move happened, ensure the newly positioned task is selected and focused
      if (moved) {
        // After moving, the task's ID remains the same, but its index changes.
        // We need to re-find its new position in the updated tasks array for correct re-focusing.
        const newIndex = sortedTasks.findIndex(task => task.id === selectedTaskId); // Find the task's new index
        if (newIndex !== -1) {
          // Re-focus the element if it exists
          setTimeout(() => { 
            taskRefs.current[selectedTaskId]?.focus();
          }, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, sortedTasks]); // Depend on selectedTaskId and sortedTasks for up-to-date state

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: String(Date.now()), text: newTask.trim(), completed: false, mustDo: false }]);
      setNewTask('');
      setSelectedTaskId(null); 
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const toggleMustDo = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent task selection when clicking the pin
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, mustDo: !task.mustDo } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    setSelectedTaskId(null); 
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    if (direction === 'up') {
      if (index === 0) return; 
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    } else {
      if (index === newTasks.length - 1) return; 
      [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
    }
    setTasks(newTasks);
  };

  const handleTaskClick = (id: string) => {
    const newSelectedId = id === selectedTaskId ? null : id;
    setSelectedTaskId(newSelectedId);
    if (newSelectedId) {
      // Focus the element after state update and re-render
      setTimeout(() => {
        taskRefs.current[newSelectedId]?.focus();
      }, 0);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800">Today's Plan</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-2 h-full overflow-y-auto p-2">
        {sortedTasks.map((task, index) => (
          <div
            key={task.id}
            ref={el => { taskRefs.current[task.id] = el; } }
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors outline-none \
              ${task.id === selectedTaskId ? 'bg-blue-100 ring-2 ring-blue-500 ring-offset-2' : 'bg-gray-50 hover:bg-gray-100'} \
              ${task.mustDo ? 'border-l-4 border-l-amber-500' : ''}`}
            onClick={() => handleTaskClick(task.id)}
            tabIndex={0} // Make the div focusable
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              className="h-5 w-5 text-blue-500"
            />
            <button
              onClick={(e) => toggleMustDo(task.id, e)}
              className={`p-1 rounded-full transition-colors ${
                task.mustDo 
                  ? 'text-amber-500 hover:text-amber-600' 
                  : 'text-gray-400 hover:text-amber-500'
              }`}
              title={task.mustDo ? "Unpin task" : "Pin task to top"}
            >
              {task.mustDo ? (
                <BookmarkIconSolid className="h-5 w-5" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
            </button>
            <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {task.text}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              className="p-1 text-red-500 hover:text-red-600"
              title="Delete Task"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayPlan; 