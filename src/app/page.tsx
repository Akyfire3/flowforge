'use client';

import { useState } from 'react';
import { Play, Square, ChevronDown, X, Clock } from 'lucide-react';
import { useAppDataContext } from '@/lib/context';
import { formatDuration, formatShortTime, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function TimeTrackingPage() {
  const { 
    tasks, 
    tags, 
    timeEntries, 
    deleteTimeEntry, 
    isLoading, 
    activeSession, 
    elapsedTime, 
    startTimer, 
    stopTimer,
    cleanupDuplicateEntries
  } = useAppDataContext();

  const [selectedTaskId, setSelectedTaskId] = useState('without-task');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Sync selectedTaskId if tasks change (e.g. task deleted)
  const isTaskIdValid = tasks.some(t => t.id === selectedTaskId);
  const effectiveTaskId = isTaskIdValid ? selectedTaskId : 'without-task';
  
  if (isLoading) return null;

  const isTracking = !!activeSession;
  
  // Use session info if tracking, otherwise use local selection
  const currentTaskId = activeSession?.taskId || effectiveTaskId;
  const currentTagId = activeSession?.tagId || selectedTagId;

  const selectedTask = tasks.find(t => t.id === currentTaskId) || tasks[0] || { id: 'without-task', name: 'Without task', color: '#3b82f6' };
  const selectedTag = tags.find(t => t.id === currentTagId);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTimer();
    } else {
      startTimer(selectedTaskId, selectedTagId || undefined);
    }
  };

  // Group entries by date
  const groupedEntries = timeEntries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof timeEntries>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Time tracking</h1>
          {timeEntries.length > 0 && (
            <button
              onClick={cleanupDuplicateEntries}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all flex items-center gap-1.5"
              title="Remove duplicate entries from focus sessions"
            >
              <X className="w-3 h-3" />
              Cleanup history
            </button>
          )}
        </div>
        {isTracking && (
          <div className="text-2xl font-mono text-white bg-[#1a1a1a] px-4 py-2 rounded-lg border border-[#262626]">
            {formatDuration(elapsedTime)}
          </div>
        )}
      </div>

      {/* Tracking Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#1a1a1a] p-5 rounded-2xl border border-[#262626]">
        <div className="relative group">
          <button 
            disabled={isTracking}
            className={cn(
              "flex items-center gap-2 bg-[#262626] hover:bg-[#333] px-5 py-2.5 rounded-xl text-sm transition-colors border border-[#333]",
              isTracking && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTask.color }} />
            <span className="font-medium">{selectedTask.name}</span>
            <ChevronDown className="w-4 h-4 text-[#a3a3a3]" />
          </button>
          {!isTracking && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden py-2">
              {tasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
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

        <div className="flex flex-wrap gap-2.5">
          {tags.map(tag => (
            <button
              key={tag.id}
              disabled={isTracking}
              onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium transition-all border",
                currentTagId === tag.id 
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-[#262626] border-[#333] text-[#a3a3a3] hover:text-white hover:bg-[#333]",
                isTracking && currentTagId !== tag.id && "opacity-50 cursor-not-allowed"
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleToggleTracking}
          className={cn(
            "flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]",
            isTracking 
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
              : "bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-green-500/20"
          )}
        >
          {isTracking ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isTracking ? 'Stop work' : 'Start work'}
        </button>
      </div>

      {/* History List */}
      <div className="space-y-6">
        {sortedDates.map(date => {
          const dayEntries = groupedEntries[date];
          const totalDayTime = dayEntries.reduce((sum, e) => sum + e.duration, 0);
          const formattedDate = format(parseISO(date), 'eee, dd/MM/yyyy');

          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-[#a3a3a3] text-sm">
                  <ChevronDown className="w-4 h-4" />
                  {formattedDate}
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex h-1.5 w-24 bg-[#262626] rounded-full overflow-hidden">
                      {dayEntries.map((e) => (
                        <div 
                          key={e.id} 
                          style={{ 
                            width: `${(e.duration / totalDayTime) * 100}%`,
                            backgroundColor: e.color
                          }} 
                        />
                      ))}
                   </div>
                   <span className="font-bold text-sm">{formatShortTime(totalDayTime)}</span>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-[#262626] overflow-hidden">
                {dayEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-4 border-b border-[#262626] last:border-none group hover:bg-[#262626]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: entry.color }} />
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{entry.taskName}</span>
                        {entry.tagName && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            {entry.tagName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-[#a3a3a3] text-sm">{formatShortTime(entry.duration)}</span>
                      <button 
                        onClick={() => deleteTimeEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <X className="w-4 h-4 text-[#a3a3a3] hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {timeEntries.length === 0 && (
          <div className="text-center py-20 text-[#a3a3a3]">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No time entries yet. Start tracking your work!</p>
          </div>
        )}
      </div>
    </div>
  );
}
