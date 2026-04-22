export interface Task {
  id: string;
  name: string;
  color: string;
  totalTime: number; // in milliseconds
  isDefault?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  sessions: number;
  totalTime: number; // in milliseconds
}

export interface TimeEntry {
  id: string;
  sessionId?: string; // Unique ID for focus sessions to prevent duplicates
  taskId: string;
  taskName: string;
  tagId?: string;
  tagName?: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  duration: number; // milliseconds
  date: string; // ISO date string (YYYY-MM-DD)
  color: string;
}

export interface ActiveSession {
  taskId: string;
  tagId?: string;
  startTime: number;
}

export interface FocusTimerState {
  duration: number; // in minutes
  startTime: number | null; // timestamp when started
  remainingSeconds: number; // seconds left
  isActive: boolean;
  selectedTaskId: string;
}

export interface FocusSession {
  id: string;
  duration: number; // minutes
  timestamp: number;
}
