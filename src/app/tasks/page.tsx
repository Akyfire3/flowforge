'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAppDataContext } from '@/lib/context';
import { formatShortTime } from '@/lib/utils';

const COLORS = [
  '#4ade80', // green
  '#f87171', // red
  '#c084fc', // purple
  '#fb923c', // orange
  '#facc15', // yellow
  '#60a5fa', // blue
  '#22d3ee', // cyan
  '#f472b6', // pink
];

export default function TasksPage() {
  const { tasks, addTask, deleteTask, isLoading } = useAppDataContext();
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    addTask(newTaskName.trim(), selectedColor);
    setNewTaskName('');
  };

  if (isLoading) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tasks</h1>

      <form onSubmit={handleAddTask} className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#262626]">
        <input
          type="text"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="New task name..."
          className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-[#a3a3a3]"
        />
        
        <div className="flex items-center gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!newTaskName.trim()}
          className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 hover:bg-[#262626]/30 transition-colors border-b border-[#262626] last:border-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />
              <span className="font-medium">{task.name}</span>
              {task.isDefault && <span className="text-xs text-[#a3a3a3] italic">Default task</span>}
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-[#a3a3a3] text-sm">{formatShortTime(task.totalTime)}</span>
              {!task.isDefault && (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-[#a3a3a3] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
