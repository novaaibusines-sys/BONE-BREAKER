import { Task, Habit, CalendarEvent, Note, ChatMessage, AppSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: 'bb_tasks_v1',
  HABITS: 'bb_habits_v1',
  EVENTS: 'bb_events_v1',
  NOTES: 'bb_notes_v1',
  CHAT: 'bb_chat_v1',
  SETTINGS: 'bb_settings_v1',
};

// Formats YYYY-MM-DD
export function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Initial motivational warrior seed data
const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: '5:00 AM Morning Strike & Hydration',
    description: '1 Liter cold water, electrolyte salt, 15 min mobility drill.',
    dueDate: getTodayDateStr(),
    dueTime: '05:30',
    priority: 'high',
    category: 'Discipline',
    completed: true,
    completedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-1', title: '1L Cold Water + Himalayan Salt', completed: true },
      { id: 'st-2', title: '15 min Hip & Spine Mobility', completed: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Heavy Compound Lifts: Deadlift & Overhead Press',
    description: 'Warm up thoroughly. 5x5 working sets. Zero failure to focus.',
    dueDate: getTodayDateStr(),
    dueTime: '16:00',
    priority: 'high',
    category: 'Training',
    completed: false,
    subtasks: [
      { id: 'st-3', title: 'Dynamic Warmup', completed: false },
      { id: 'st-4', title: 'Working Sets 5x5', completed: false },
      { id: 'st-5', title: 'Cooldown & Grip Hangs', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Strategic Focus Block: Complete Priority Project Deliverable',
    description: 'No notifications. 90 minutes of pure deep work execution.',
    dueDate: getTodayDateStr(),
    dueTime: '11:00',
    priority: 'medium',
    category: 'Work',
    completed: false,
    subtasks: [
      { id: 'st-6', title: 'Outline core architecture', completed: true },
      { id: 'st-7', title: 'Finalize implementation & test', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Cold Shower Protocol',
    description: '3 minutes freezing water. Mental shock and nervous system resilience.',
    category: 'Discipline',
    frequency: 'daily',
    reminderTime: '06:00',
    createdAt: new Date().toISOString(),
    history: {
      [getTodayDateStr()]: true,
    },
    currentStreak: 12,
    bestStreak: 28,
  },
  {
    id: 'habit-2',
    title: 'Daily Iron Workout',
    description: 'Push beyond comfort zone. Build unbreakable armor.',
    category: 'Training',
    frequency: 'daily',
    reminderTime: '16:00',
    createdAt: new Date().toISOString(),
    history: {
      [getTodayDateStr()]: false,
    },
    currentStreak: 5,
    bestStreak: 14,
  },
  {
    id: 'habit-3',
    title: 'Read 20 Pages of Philosophy / Tactics',
    description: 'Marcus Aurelius, Sun Tzu, or deep skill acquisition.',
    category: 'Mind',
    frequency: 'daily',
    reminderTime: '21:00',
    createdAt: new Date().toISOString(),
    history: {},
    currentStreak: 8,
    bestStreak: 21,
  },
  {
    id: 'habit-4',
    title: 'Nightly Battle Review & Plan Tomorrow',
    description: 'No screens 30m before sleep. Write tomorrow’s top 3 missions.',
    category: 'Warfare',
    frequency: 'daily',
    reminderTime: '22:00',
    createdAt: new Date().toISOString(),
    history: {},
    currentStreak: 4,
    bestStreak: 9,
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'The Iron Creed: Rules of Engagement',
    content: `1. Pain is information. Weakness is an illusion of the undisciplined mind.
2. What you do in private echoes in your character.
3. Show up when you are tired. That is where victory is forged.
4. Keep the blade sharp: Sleep, Fuel, Train, Execute.`,
    pinned: true,
    tags: ['Creed', 'Mindset', 'Discipline'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Tactical Strength Progression',
    content: `Current Bench Target: 120kg
Current Squat Target: 160kg
Current Deadlift Target: 200kg

RPE Guidelines: Never ego-lift. Perfect form over heavy junk volume.`,
    pinned: false,
    tags: ['Training', 'Fitness', 'Goals'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  notificationsEnabled: false,
  soundEnabled: true,
  dailyReminderTime: '08:00',
  userName: 'Warrior',
};

// Storage operations
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      saveTasks(DEFAULT_TASKS);
      return DEFAULT_TASKS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load tasks:', err);
    return DEFAULT_TASKS;
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      // Seed some past history for habits so the heatmap and streaks look motivating right away
      const today = new Date();
      const seededHabits = [...DEFAULT_HABITS];
      
      // Seed last 14 days of history
      for (let i = 1; i <= 14; i++) {
        const past = new Date(today);
        past.setDate(past.getDate() - i);
        const pastStr = formatDateStr(past);
        if (i % 2 === 0 || i < 7) {
          seededHabits[0].history[pastStr] = true;
        }
        if (i % 3 !== 0) {
          seededHabits[1].history[pastStr] = true;
        }
        if (i < 10) {
          seededHabits[2].history[pastStr] = true;
        }
      }
      saveHabits(seededHabits);
      return seededHabits;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load habits:', err);
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits:', err);
  }
}

export function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load events:', err);
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events:', err);
  }
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) {
      saveNotes(DEFAULT_NOTES);
      return DEFAULT_NOTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load notes:', err);
    return DEFAULT_NOTES;
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

export function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (!raw) {
      const initialChat: ChatMessage[] = [
        {
          id: 'welcome-msg',
          sender: 'assistant',
          content: `Welcome to the arena, Warrior. I am your BONE BREAKER AI Coach.

No excuses. No procrastination. Tell me what needs to be conquered today, or tap one of the battle directives below to plan your day, analyze your habits, or ignite your discipline.`,
          timestamp: new Date().toISOString(),
        },
      ];
      saveChat(initialChat);
      return initialChat;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat:', err);
    return [];
  }
}

export function saveChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save chat:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Calculate streak helper
export function updateHabitStreak(habit: Habit): Habit {
  const history = habit.history || {};
  let currentStreak = 0;
  let bestStreak = habit.bestStreak || 0;

  const today = new Date();
  const todayStr = formatDateStr(today);

  // If completed today, streak starts at 1
  let checkDate = new Date(today);
  if (history[todayStr]) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If not completed today, check if completed yesterday to keep streak alive
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (history[formatDateStr(yesterday)]) {
      checkDate = yesterday;
    } else {
      // Streak broken
      return { ...habit, currentStreak: 0 };
    }
  }

  // Count backwards
  while (true) {
    const dateStr = formatDateStr(checkDate);
    if (history[dateStr]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return {
    ...habit,
    currentStreak,
    bestStreak,
  };
}

// Export All App Data as JSON
export function exportAllData(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tasks: loadTasks(),
    habits: loadHabits(),
    events: loadEvents(),
    notes: loadNotes(),
    chat: loadChat(),
    settings: {
      ...loadSettings(),
      // Never export API key for user safety unless explicitly needed
    },
  };
  return JSON.stringify(data, null, 2);
}

// Import App Data from JSON
export function importAllData(jsonStr: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.tasks)) saveTasks(parsed.tasks);
    if (Array.isArray(parsed.habits)) saveHabits(parsed.habits);
    if (Array.isArray(parsed.events)) saveEvents(parsed.events);
    if (Array.isArray(parsed.notes)) saveNotes(parsed.notes);
    if (Array.isArray(parsed.chat)) saveChat(parsed.chat);
    if (parsed.settings && typeof parsed.settings === 'object') {
      const existingSettings = loadSettings();
      saveSettings({ ...existingSettings, ...parsed.settings });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// Reset All App Data
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.HABITS);
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  localStorage.removeItem(STORAGE_KEYS.CHAT);
  // Keep API key if set in settings
  const cur = loadSettings();
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  if (cur.geminiApiKey) {
    saveSettings({ ...DEFAULT_SETTINGS, geminiApiKey: cur.geminiApiKey });
  }
}
