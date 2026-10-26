export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory = 
  | 'Training' 
  | 'Discipline' 
  | 'Work' 
  | 'Mind' 
  | 'Warfare' 
  | 'General';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  reminderTime?: string; // 'none' | 'at_due' | '15m' | '30m' | '1h' | '1d'
  priority: Priority;
  category: string;
  completed: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekdays';
  selectedDays?: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  reminderTime?: string; // HH:MM
  createdAt: string;
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
  currentStreak: number;
  bestStreak: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  category: string;
  notes?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppSettings {
  geminiApiKey: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderTime: string; // HH:MM
  userName: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'calendar' 
  | 'tasks' 
  | 'habits' 
  | 'coach' 
  | 'notes' 
  | 'settings';
