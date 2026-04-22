'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Tag, TimeEntry, FocusSession, ActiveSession, FocusTimerState } from '@/types';
import { format } from 'date-fns';

const STORAGE_KEYS = {
  TASKS: 'flowforge_tasks',
  TAGS: 'flowforge_tags',
  TIME_ENTRIES: 'flowforge_time_entries',
  FOCUS_SESSIONS: 'flowforge_focus_sessions',
  ACTIVE_SESSION: 'flowforge_active_session',
  FOCUS_TIMER_STATE: 'flowforge_focus_timer_state',
};

const DEFAULT_TASKS: Task[] = [
  { id: 'without-task', name: 'Without task', color: '#3b82f6', totalTime: 0, isDefault: true },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'study', name: '#study', sessions: 0, totalTime: 0 },
  { id: 'work', name: '#work', sessions: 0, totalTime: 0 },
  { id: 'personal', name: '#personal', sessions: 0, totalTime: 0 },
  { id: 'college', name: '#college', sessions: 0, totalTime: 0 },
  { id: 'project', name: '#project', sessions: 0, totalTime: 0 },
];

const DEFAULT_FOCUS_STATE: FocusTimerState = {
  duration: 25,
  startTime: null,
  remainingSeconds: 25 * 60,
  isActive: false,
  selectedTaskId: 'without-task',
};

export function useAppData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>(DEFAULT_FOCUS_STATE);
  const [isMiniTimerOpen, setIsMiniTimerOpen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoggingRef = useRef(false);

  // --- Utility & Action Functions ---

  const addTask = useCallback((name: string, color: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      name,
      color,
      totalTime: 0,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    if (id === 'without-task') return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTimeEntries((prev) => prev.filter((e) => e.taskId !== id));
  }, []);

  const addTag = useCallback((name: string) => {
    const formattedName = name.startsWith('#') ? name : `#${name}`;
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: formattedName,
      sessions: 0,
      totalTime: 0,
    };
    setTags((prev) => [...prev, newTag]);
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTimer = useCallback((taskId: string, tagId?: string) => {
    setActiveSession({
      taskId,
      tagId,
      startTime: Date.now(),
    });
  }, []);

  const stopTimer = useCallback(() => {
    if (!activeSession) return;

    const endTime = Date.now();
    const duration = endTime - activeSession.startTime;
    const task = tasks.find(t => t.id === activeSession.taskId) || DEFAULT_TASKS[0];
    const tag = tags.find(t => t.id === activeSession.tagId);

    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      taskId: activeSession.taskId,
      taskName: task.name,
      tagId: activeSession.tagId,
      tagName: tag?.name,
      startTime: activeSession.startTime,
      endTime,
      duration,
      date: format(new Date(activeSession.startTime), 'yyyy-MM-dd'),
      color: task.color,
    };

    setTimeEntries((prev) => [newEntry, ...prev]);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeSession.taskId ? { ...t, totalTime: t.totalTime + duration } : t
      )
    );

    if (activeSession.tagId) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === activeSession.tagId
            ? { ...t, totalTime: t.totalTime + duration, sessions: t.sessions + 1 }
            : t
        )
      );
    }

    setActiveSession(null);
  }, [activeSession, tasks, tags]);

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (!entry) return prev;

      setTasks((tasksPrev) =>
        tasksPrev.map((t) =>
          t.id === entry.taskId ? { ...t, totalTime: Math.max(0, t.totalTime - entry.duration) } : t
        )
      );

      if (entry.tagId) {
        setTags((tagsPrev) =>
          tagsPrev.map((t) =>
            t.id === entry.tagId
              ? { ...t, totalTime: Math.max(0, t.totalTime - entry.duration), sessions: Math.max(0, t.sessions - 1) }
              : t
          )
        );
      }

      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const addFocusSession = useCallback((durationMinutes: number) => {
    const newSession: FocusSession = {
      id: crypto.randomUUID(),
      duration: durationMinutes,
      timestamp: Date.now(),
    };
    setFocusSessions((prev) => [newSession, ...prev]);
  }, []);

  const cleanupDuplicateEntries = useCallback(() => {
    setTimeEntries(prev => {
      const uniqueEntries: TimeEntry[] = [];
      const duplicatesToRemove: TimeEntry[] = [];

      // Sort by timestamp to keep the first one
      const sorted = [...prev].sort((a, b) => a.startTime - b.startTime);

      sorted.forEach(entry => {
        const isDuplicate = uniqueEntries.find(ue => 
          ue.taskName === entry.taskName &&
          ue.duration === entry.duration &&
          Math.abs(ue.startTime - entry.startTime) < 2000 // Within 2 seconds (more aggressive)
        );

        if (isDuplicate) {
          duplicatesToRemove.push(entry);
        } else {
          uniqueEntries.push(entry);
        }
      });

      if (duplicatesToRemove.length > 0) {
        // Correct task total times
        setTasks(tasksPrev => 
          tasksPrev.map(t => {
            const removedForTask = duplicatesToRemove
              .filter(d => d.taskId === t.id)
              .reduce((sum, d) => sum + d.duration, 0);
            return { ...t, totalTime: Math.max(0, t.totalTime - removedForTask) };
          })
        );

        // Correct tag total times
        setTags(tagsPrev => 
          tagsPrev.map(t => {
            const removedForTag = duplicatesToRemove
              .filter(d => d.tagId === t.id)
              .reduce((sum, d) => sum + d.duration, 0);
            const removedSessions = duplicatesToRemove.filter(d => d.tagId === t.id).length;
            return { 
              ...t, 
              totalTime: Math.max(0, t.totalTime - removedForTag),
              sessions: Math.max(0, t.sessions - removedSessions)
            };
          })
        );
      }

      // Return unique entries sorted by newest first
      return uniqueEntries.sort((a, b) => b.startTime - a.startTime);
    });
  }, []);

  const toggleFocusTimer = useCallback(() => {
    setFocusTimer(prev => {
      if (prev.isActive) {
        return { ...prev, isActive: false, startTime: null };
      } else {
        isLoggingRef.current = false; // Reset lock when starting
        const elapsedSeconds = (prev.duration * 60) - prev.remainingSeconds;
        return { ...prev, isActive: true, startTime: Date.now() - (elapsedSeconds * 1000) };
      }
    });
  }, []);

  const resetFocusTimer = useCallback(() => {
    setFocusTimer(prev => ({
      ...prev,
      isActive: false,
      startTime: null,
      remainingSeconds: prev.duration * 60,
    }));
  }, []);

  const setFocusDuration = useCallback((minutes: number) => {
    setFocusTimer(prev => ({
      ...prev,
      duration: minutes,
      isActive: false,
      startTime: null,
      remainingSeconds: minutes * 60,
    }));
  }, []);

  const setManualDuration = useCallback((minutes: number) => {
    setFocusTimer(prev => {
      if (prev.isActive) return prev;
      return {
        ...prev,
        duration: minutes,
        remainingSeconds: minutes * 60,
        startTime: null,
      };
    });
  }, []);

  const setFocusTask = useCallback((taskId: string) => {
    setFocusTimer(prev => ({ ...prev, selectedTaskId: taskId }));
  }, []);

  const toggleMiniTimer = useCallback(() => {
    setIsMiniTimerOpen(prev => !prev);
  }, []);

  const setPipActive = useCallback((active: boolean) => {
    setIsPipActive(active);
  }, []);

  // --- Effects ---

  // Initial load
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const savedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
    const savedEntries = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    const savedFocus = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    const savedFocusState = localStorage.getItem(STORAGE_KEYS.FOCUS_TIMER_STATE);

    setTasks(savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS);
    setTags(savedTags ? JSON.parse(savedTags) : DEFAULT_TAGS);
    setTimeEntries(savedEntries ? JSON.parse(savedEntries) : []);
    setFocusSessions(savedFocus ? JSON.parse(savedFocus) : []);
    setActiveSession(savedActive ? JSON.parse(savedActive) : null);
    
    if (savedFocusState) {
      const parsed = JSON.parse(savedFocusState);
      if (parsed.isActive && parsed.startTime) {
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - parsed.startTime) / 1000);
        const actualRemaining = Math.max(0, (parsed.duration * 60) - elapsedSinceStart);
        setFocusTimer({ ...parsed, remainingSeconds: actualRemaining });
      } else {
        setFocusTimer(parsed);
      }
    }
    
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    setIsLoading(false);
  }, []);

  // Tracking Timer effect
  useEffect(() => {
    if (activeSession) {
      setElapsedTime(Date.now() - activeSession.startTime);
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - activeSession.startTime);
      }, 1000);
    } else {
      setElapsedTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  // Focus Timer effect
  useEffect(() => {
    if (focusTimer.isActive && focusTimer.remainingSeconds > 0) {
      // isLoggingRef is NOT reset here. It is only reset when the timer starts via toggleFocusTimer or duration change.
      focusTimerRef.current = setInterval(() => {
        setFocusTimer(prev => {
          if (prev.remainingSeconds <= 1) {
            if (focusTimerRef.current) clearInterval(focusTimerRef.current);
            return { ...prev, isActive: false, remainingSeconds: 0, startTime: null };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
      
      // If it just finished (remainingSeconds is 0 and isActive was just turned off)
      if (focusTimer.remainingSeconds === 0 && !isLoggingRef.current) {
        isLoggingRef.current = true;
        
        // Generate a unique sessionId for this completion event
        // The timestamp of completion is a good enough candidate for a sessionId to prevent multiple logs of the same completion
        const sessionId = `focus_${Date.now()}_${focusTimer.duration}`;

        // Play sound
        audioRef.current?.play().catch(() => {});
        
        // Log session to focus sessions history
        addFocusSession(focusTimer.duration);

        // AUTO-LOG to Time Tracking system
        const task = tasks.find(t => t.id === focusTimer.selectedTaskId) || DEFAULT_TASKS[0];
        const durationMs = focusTimer.duration * 60 * 1000;
        const endTime = Date.now();
        const startTime = endTime - durationMs;

        // CHECK IF SESSION ID ALREADY EXISTS in current timeEntries
        const isDuplicateSession = timeEntries.some(entry => entry.sessionId === sessionId);
        
        if (!isDuplicateSession) {
          const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            sessionId: sessionId,
            taskId: task.id,
            taskName: task.name,
            startTime,
            endTime,
            duration: durationMs,
            date: format(new Date(startTime), 'yyyy-MM-dd'),
            color: task.color,
          };

          setTimeEntries(entries => {
            // Final defensive check against state-level duplicates before adding
            if (entries.some(e => e.sessionId === sessionId)) return entries;
            return [newEntry, ...entries];
          });

          setTasks(allTasks => allTasks.map(t => 
            t.id === task.id ? { ...t, totalTime: t.totalTime + durationMs } : t
          ));

          // Explicitly reset the 'active task' and timer state after logging
          setFocusTimer(prev => ({
            ...prev,
            selectedTaskId: 'without-task',
            remainingSeconds: prev.duration * 60,
            isActive: false,
            startTime: null
          }));
        }
      }
    }
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [focusTimer.isActive, focusTimer.remainingSeconds, focusTimer.duration, focusTimer.selectedTaskId, tasks, timeEntries, addFocusSession]);

  // Auto-save effect
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries));
      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(focusSessions));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(activeSession));
      localStorage.setItem(STORAGE_KEYS.FOCUS_TIMER_STATE, JSON.stringify(focusTimer));
    }
  }, [tasks, tags, timeEntries, focusSessions, activeSession, focusTimer, isLoading]);

  return {
    tasks,
    tags,
    timeEntries,
    focusSessions,
    activeSession,
    focusTimer,
    isMiniTimerOpen,
    isPipActive,
    elapsedTime,
    isLoading,
    addTask,
    deleteTask,
    addTag,
    deleteTag,
    startTimer,
    stopTimer,
    deleteTimeEntry,
    addFocusSession,
    cleanupDuplicateEntries,
    toggleFocusTimer,
    resetFocusTimer,
    setFocusDuration,
    setManualDuration,
    setFocusTask,
    toggleMiniTimer,
    setPipActive,
  };
}
