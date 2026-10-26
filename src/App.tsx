import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActiveTab, 
  Task, 
  Habit, 
  CalendarEvent, 
  Note, 
  ChatMessage, 
  AppSettings 
} from './types';
import { 
  loadTasks, 
  saveTasks, 
  loadHabits, 
  saveHabits, 
  loadEvents, 
  saveEvents, 
  loadNotes, 
  saveNotes, 
  loadChat, 
  saveChat, 
  loadSettings, 
  saveSettings,
  updateHabitStreak,
  getTodayDateStr
} from './utils/storage';
import { notifications } from './utils/notifications';
import { sounds } from './utils/sound';
import { SkullLogo } from './components/SkullLogo';
import { Navigation } from './components/Navigation';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DashboardView } from './components/views/DashboardView';
import { CalendarView } from './components/views/CalendarView';
import { TasksView } from './components/views/TasksView';
import { HabitsView } from './components/views/HabitsView';
import { AICoachView } from './components/views/AICoachView';
import { NotesView } from './components/views/NotesView';
import { SettingsView } from './components/views/SettingsView';
import { WifiOff, Flame } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Application Data States
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents());
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [chat, setChat] = useState<ChatMessage[]>(() => loadChat());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Quick Task Modal trigger state for cross-view actions
  const [openNewTaskModal, setOpenNewTaskModal] = useState(false);
  const [newTaskPreselectedDate, setNewTaskPreselectedDate] = useState<string | undefined>(undefined);

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync sound setting
  useEffect(() => {
    sounds.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Periodic Reminder Checker
  useEffect(() => {
    const interval = setInterval(() => {
      notifications.checkDueReminders(tasks, habits);
    }, 25000); // Check every 25 seconds
    return () => clearInterval(interval);
  }, [tasks, habits]);

  // Recalculate streak totals
  const totalStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);
  }, [habits]);

  // Pending today's tasks count
  const pendingTasksCount = useMemo(() => {
    const today = getTodayDateStr();
    return tasks.filter((t) => !t.completed && (t.dueDate === today || t.dueDate < today)).length;
  }, [tasks]);

  // Task Handlers
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
          subtasks: t.subtasks.map((st) => ({ ...st, completed: nextCompleted })),
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasks(updated);
  };

  // Habit Handlers
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const currentHist = h.history || {};
        const isDone = Boolean(currentHist[dateStr]);
        const nextHist = { ...currentHist, [dateStr]: !isDone };
        const habitWithNewHistory = { ...h, history: nextHist };
        return updateHabitStreak(habitWithNewHistory);
      }
      return h;
    });
    setHabits(updated);
    saveHabits(updated);
  };

  const handleAddHabit = (
    newHabitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'history'>
  ) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      bestStreak: 0,
      history: {},
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    const habitWithUpdatedStreak = updateHabitStreak(updatedHabit);
    const updated = habits.map((h) => (h.id === updatedHabit.id ? habitWithUpdatedStreak : h));
    setHabits(updated);
    saveHabits(updated);
  };

  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    saveHabits(updated);
  };

  // Calendar Event Handlers
  const handleAddEvent = (newEventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: CalendarEvent = {
      ...newEventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...events, newEvent];
    setEvents(updated);
    saveEvents(updated);
  };

  // Note Handlers
  const handleAddNote = (newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...newNoteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveNotes(updated);
  };

  // Chat Handlers
  const handleSaveChat = (messages: ChatMessage[]) => {
    setChat(messages);
    saveChat(messages);
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDataReset = () => {
    setTasks(loadTasks());
    setHabits(loadHabits());
    setEvents(loadEvents());
    setNotes(loadNotes());
    setChat(loadChat());
    setSettings(loadSettings());
  };

  return (
    <div className="min-h-screen bg-[#181211] text-[#EDEFF1] flex flex-col md:flex-row antialiased selection:bg-[#E0262B] selection:text-white">
      {/* Navigation: Sidebar on desktop, Bottom Nav on mobile */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingTasksCount={pendingTasksCount}
        totalStreak={totalStreak}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        {/* Mobile Top Navigation Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#231b19] border-b border-[#382d2a] sticky top-0 z-30 pt-safe">
          <div className="flex items-center gap-2.5">
            <SkullLogo size={36} glow={true} animatedEye={true} />
            <div>
              <div className="font-warrior text-sm font-extrabold tracking-wider text-[#EDEFF1] flex items-center gap-1">
                <span>BONE</span>
                <span className="text-[#E0262B]">BREAKER</span>
              </div>
              <div className="text-[9px] font-mono text-[#9A9DA1] uppercase tracking-wider">
                TRAINING PROTOCOL
              </div>
            </div>
          </div>

          {/* Quick Streak Badge on Mobile */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181211] border border-[#382d2a] rounded clip-angular-sm">
            <Flame className="w-3.5 h-3.5 text-[#E0262B] fill-current" />
            <span className="font-warrior text-xs font-bold text-[#EDEFF1]">{totalStreak}d</span>
          </div>
        </header>

        {/* Offline Mode Indicator */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-white px-4 py-1.5 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b border-amber-500">
            <WifiOff className="w-3.5 h-3.5" />
            <span>OFFLINE TRAINING MODE — Local cache is active. All data remains safe.</span>
          </div>
        )}

        {/* Inner Content Container */}
        <div className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto">
          {/* PWA Install Banner */}
          <PWAInstallBanner />

          {/* Active Screen View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              habits={habits}
              onToggleTask={handleToggleTask}
              onToggleHabit={handleToggleHabit}
              onNavigate={setActiveTab}
              onOpenNewTaskModal={() => {
                setNewTaskPreselectedDate(undefined);
                setOpenNewTaskModal(true);
                setActiveTab('tasks');
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              habits={habits}
              events={events}
              onToggleTask={handleToggleTask}
              onToggleHabit={handleToggleHabit}
              onAddEvent={handleAddEvent}
              onOpenTaskModalWithDate={(dateStr) => {
                setNewTaskPreselectedDate(dateStr);
                setOpenNewTaskModal(true);
                setActiveTab('tasks');
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              initialModalOpen={openNewTaskModal}
              initialDate={newTaskPreselectedDate}
              onCloseInitialModal={() => {
                setOpenNewTaskModal(false);
                setNewTaskPreselectedDate(undefined);
              }}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsView
              habits={habits}
              onAddHabit={handleAddHabit}
              onUpdateHabit={handleUpdateHabit}
              onDeleteHabit={handleDeleteHabit}
              onToggleHabit={handleToggleHabit}
            />
          )}

          {activeTab === 'coach' && (
            <AICoachView
              chatMessages={chat}
              onSaveChat={handleSaveChat}
              tasks={tasks}
              habits={habits}
              notes={notes}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onDataReset={handleDataReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
