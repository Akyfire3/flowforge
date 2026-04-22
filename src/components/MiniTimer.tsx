'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { useAppDataContext } from '@/lib/context';
import { cn } from '@/lib/utils';

export function MiniTimer() {
  const { 
    tasks, 
    focusTimer, 
    isMiniTimerOpen, 
    toggleMiniTimer, 
    toggleFocusTimer, 
    resetFocusTimer,
    setPipActive,
    isPipActive
  } = useAppDataContext();

  const [pipWindow, setPipWindow] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { duration, remainingSeconds, isActive, selectedTaskId } = focusTimer;
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0] || { name: 'Without task', color: '#3b82f6' };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert('Floating mode (Document PiP) is not supported in this browser. Using standard overlay instead.');
      toggleMiniTimer();
      return;
    }

    try {
      // @ts-ignore
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 200,
      });

      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pip.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          if (styleSheet.href) {
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          }
        }
      });

      // Handle close
      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
        setPipActive(false);
      });

      setPipWindow(pip);
      setPipActive(true);
      // Close the standard overlay if it was open
      if (isMiniTimerOpen) toggleMiniTimer();
    } catch (err) {
      console.error('Failed to open PiP window:', err);
    }
  };

  useEffect(() => {
    // If mini timer button was clicked and we aren't in PiP, decide whether to open PiP
    // For this implementation, we'll trigger PiP from the main button click in Focus.tsx
    // but keep standard overlay as fallback or if user prefers.
  }, [isMiniTimerOpen]);

  // Standard Overlay Content
  const TimerContent = (
    <div className={cn(
      "flex flex-col items-center bg-[#1a1a1a] text-white p-4 rounded-2xl border border-[#262626] h-full justify-center",
      isPipActive ? "w-full" : ""
    )}>
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedTask.color }} />
          <span className="text-xs font-medium text-[#a3a3a3] truncate">{selectedTask.name}</span>
        </div>
        {!isPipActive && (
          <button 
            onClick={toggleMiniTimer}
            className="text-[#a3a3a3] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold text-white tracking-tighter tabular-nums mb-4">
          {formatTime(remainingSeconds)}
        </span>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleFocusTimer}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
              isActive 
                ? "bg-red-500/20 text-red-500 border border-red-500/30" 
                : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            )}
          >
            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
          </button>
          <button
            onClick={resetFocusTimer}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#262626] text-[#a3a3a3] hover:text-white border border-white/5 transition-all active:scale-90"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Trigger PiP from an external function call (will be wired to Focus.tsx button)
  useEffect(() => {
    // Expose the function globally or via context to be triggered
    // @ts-ignore
    window.requestFlowForgePiP = requestPiP;
  }, [selectedTask, remainingSeconds, isActive, isMiniTimerOpen]);

  if (isPipActive && pipWindow) {
    return createPortal(TimerContent, pipWindow.document.body);
  }

  if (!isMiniTimerOpen) return null;

  return (
    <div className="fixed bottom-24 right-8 w-64 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      {TimerContent}
    </div>
  );
}
