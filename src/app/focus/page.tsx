'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, ExternalLink, ChevronDown, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDataContext } from '@/lib/context';

const DURATIONS = [25, 45, 60, 90];

export default function FocusSessionsPage() {
  const { 
    tasks,
    focusTimer, 
    isLoading, 
    toggleFocusTimer, 
    resetFocusTimer, 
    setFocusDuration,
    setManualDuration,
    setFocusTask,
    toggleMiniTimer,
  } = useAppDataContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (isLoading) return null;

  const { duration, remainingSeconds, isActive, selectedTaskId } = focusTimer;
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0] || { id: 'without-task', name: 'Without task', color: '#3b82f6' };
  
  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeClick = () => {
    if (!isActive) {
      setIsEditing(true);
      setEditValue(Math.floor(remainingSeconds / 60).toString());
    }
  };

  const handleManualSubmit = () => {
    const mins = parseInt(editValue);
    if (!isNaN(mins) && mins > 0 && mins <= 999) {
      setManualDuration(mins);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handlePiPClick = () => {
    // @ts-ignore
    if (window.requestFlowForgePiP) {
      // @ts-ignore
      window.requestFlowForgePiP();
    } else {
      toggleMiniTimer();
    }
  };

  // SVG Circle properties
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Offset should be full (circumference) when progress is 0, and 0 when progress is 100
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12">
      <div className="w-full max-w-xl flex items-center justify-between">
         <h1 className="text-3xl font-bold">Focus sessions</h1>
      </div>

      {/* Task Selection Dropdown */}
      <div className="relative group">
        <button 
          disabled={isActive}
          className={cn(
            "flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#262626] px-5 py-2.5 rounded-xl text-sm transition-colors border border-[#262626] shadow-xl min-w-[200px] justify-between",
            isActive && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTask.color }} />
            <span className="font-medium text-white">{selectedTask.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#a3a3a3]" />
        </button>
        {!isActive && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden py-2">
            {tasks.map(t => (
              <button
                key={t.id}
                onClick={() => setFocusTask(t.id)}
                className={cn(
                  "w-full text-left px-5 py-2.5 text-sm hover:bg-[#262626] flex items-center gap-3 transition-colors",
                  selectedTaskId === t.id && "bg-[#262626]"
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className={selectedTaskId === t.id ? "text-white font-medium" : "text-[#a3a3a3]"}>{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center">
        {/* Progress Circle */}
        <svg className="w-[300px] h-[300px] -rotate-90">
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="#262626"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="#60a5fa"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear shadow-blue-500/50"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={handleManualSubmit}
              onKeyDown={handleKeyDown}
              className="text-6xl font-medium text-white bg-transparent border-none focus:outline-none w-32 text-center tracking-tighter tabular-nums"
            />
          ) : (
            <span 
              onClick={handleTimeClick}
              className={cn(
                "text-6xl font-medium text-white tracking-tighter tabular-nums",
                !isActive && "cursor-pointer hover:text-blue-400 transition-colors"
              )}
            >
              {formatTime(remainingSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleFocusTimer}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all text-white shadow-2xl active:scale-95",
              isActive 
                ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30" 
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            )}
          >
            {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
          </button>
        </div>

        <button
          onClick={resetFocusTimer}
          className="flex items-center gap-2 text-[#a3a3a3] hover:text-white text-sm font-medium transition-colors bg-[#262626] px-4 py-2 rounded-full border border-white/5"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <div className="flex flex-col items-center gap-4">
           <span className="text-xs text-[#a3a3a3] font-bold uppercase tracking-widest">Select Duration</span>
           <div className="flex gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setFocusDuration(d)}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-bold transition-all border",
                  duration === d 
                    ? "bg-[#262626] border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10" 
                    : "bg-transparent border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#333]"
                )}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <button 
          onClick={handlePiPClick}
          className="p-3 bg-[#1a1a1a] border border-[#262626] rounded-xl hover:bg-[#262626] transition-colors text-[#a3a3a3] hover:text-white shadow-xl"
        >
          <Monitor className="w-5 h-5" />
        </button>
        <button className="p-3 bg-[#1a1a1a] border border-[#262626] rounded-xl hover:bg-[#262626] transition-colors text-[#a3a3a3] hover:text-white shadow-xl">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
