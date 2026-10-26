import React, { useState, useMemo } from 'react';
import { Task, Habit, CalendarEvent } from '../../types';
import { formatDateStr, getTodayDateStr } from '../../utils/storage';
import { sounds } from '../../utils/sound';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Tag
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  habits: Habit[];
  events: CalendarEvent[];
  onToggleTask: (taskId: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  onOpenTaskModalWithDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  habits,
  events,
  onToggleTask,
  onToggleHabit,
  onAddEvent,
  onOpenTaskModalWithDate,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateStr());
  
  // Quick Add Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [eventCategory, setEventCategory] = useState('Training');
  const [eventNotes, setEventNotes] = useState('');

  const todayStr = getTodayDateStr();

  // Navigation handlers
  const handlePrev = () => {
    sounds.playClick();
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    sounds.playClick();
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    sounds.playClick();
    setCurrentDate(new Date());
    setSelectedDateStr(todayStr);
  };

  // Build items mapping: dateStr -> hasItems
  const dateIndicators = useMemo(() => {
    const map = new Map<string, { hasTasks: boolean; hasEvents: boolean; count: number }>();

    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const current = map.get(t.dueDate) || { hasTasks: false, hasEvents: false, count: 0 };
      current.hasTasks = true;
      current.count++;
      map.set(t.dueDate, current);
    });

    events.forEach((e) => {
      if (!e.date) return;
      const current = map.get(e.date) || { hasTasks: false, hasEvents: false, count: 0 };
      current.hasEvents = true;
      current.count++;
      map.set(e.date, current);
    });

    return map;
  }, [tasks, events]);

  // Days matrix for Month View
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: true });
    }

    // Next month padding to fill grid (total multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Days for Week View
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Sunday

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: d.getMonth() === currentDate.getMonth(),
      });
    }
    return days;
  }, [currentDate]);

  // Items for currently selected day
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === selectedDateStr);
  }, [tasks, selectedDateStr]);

  const selectedDayEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDateStr);
  }, [events, selectedDateStr]);

  const selectedDayHabits = useMemo(() => {
    return habits.map((h) => ({
      ...h,
      doneOnDate: Boolean(h.history && h.history[selectedDateStr]),
    }));
  }, [habits, selectedDateStr]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    onAddEvent({
      title: eventTitle.trim(),
      date: selectedDateStr,
      time: eventTime,
      category: eventCategory,
      notes: eventNotes.trim(),
    });
    setEventTitle('');
    setEventNotes('');
    setShowEventModal(false);
    sounds.playAlert();
  };

  const currentMonthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Calendar Header Control Bar */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#181211] text-[#E0262B] border border-[#382d2a]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-warrior text-xl font-bold text-[#EDEFF1]">
              TACTICAL CALENDAR
            </h1>
            <p className="text-xs text-[#9A9DA1] font-mono">{currentMonthName}</p>
          </div>
        </div>

        {/* View Switcher & Month Stepper */}
        <div className="flex items-center gap-2">
          {/* Month / Week Toggle */}
          <div className="flex bg-[#181211] p-1 border border-[#382d2a] clip-angular-sm">
            <button
              onClick={() => {
                sounds.playClick();
                setViewMode('month');
              }}
              className={`px-3 py-1 text-xs font-bold font-warrior transition ${
                viewMode === 'month' ? 'bg-[#E0262B] text-white' : 'text-[#9A9DA1] hover:text-[#EDEFF1]'
              }`}
            >
              MONTH
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setViewMode('week');
              }}
              className={`px-3 py-1 text-xs font-bold font-warrior transition ${
                viewMode === 'week' ? 'bg-[#E0262B] text-white' : 'text-[#9A9DA1] hover:text-[#EDEFF1]'
              }`}
            >
              WEEK
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] text-xs font-bold font-warrior border border-[#382d2a] transition clip-angular-sm"
          >
            TODAY
          </button>

          <div className="flex items-center">
            <button
              onClick={handlePrev}
              className="p-1.5 bg-[#181211] hover:bg-[#2c2220] text-[#9A9DA1] hover:text-[#EDEFF1] border border-[#382d2a] transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 bg-[#181211] hover:bg-[#2c2220] text-[#9A9DA1] hover:text-[#EDEFF1] border border-[#382d2a] border-l-0 transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-warrior text-xs font-bold text-[#9A9DA1] py-2 border-b border-[#382d2a]">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 mt-2">
          {(viewMode === 'month' ? monthDays : weekDays).map((dayItem) => {
            const isSelected = dayItem.dateStr === selectedDateStr;
            const isToday = dayItem.dateStr === todayStr;
            const indicator = dateIndicators.get(dayItem.dateStr);
            const hasItems = indicator && indicator.count > 0;

            return (
              <button
                key={dayItem.dateStr}
                onClick={() => {
                  sounds.playClick();
                  setSelectedDateStr(dayItem.dateStr);
                }}
                className={`relative flex flex-col items-center justify-start p-2 min-h-14 sm:min-h-16 transition-all border clip-angular-sm ${
                  isSelected
                    ? 'bg-[#2c2220] border-[#E0262B] ring-1 ring-[#E0262B] glow-red'
                    : isToday
                    ? 'bg-[#181211] border-[#E0262B]/50'
                    : dayItem.isCurrentMonth
                    ? 'bg-[#181211] border-[#382d2a] hover:border-[#9A9DA1]/50'
                    : 'bg-[#140e0e] border-[#251d1c] opacity-40 hover:opacity-75'
                }`}
              >
                <span
                  className={`text-xs font-mono font-bold ${
                    isSelected
                      ? 'text-[#E0262B]'
                      : isToday
                      ? 'text-white underline decoration-[#E0262B] decoration-2'
                      : dayItem.isCurrentMonth
                      ? 'text-[#EDEFF1]'
                      : 'text-[#9A9DA1]'
                  }`}
                >
                  {dayItem.date.getDate()}
                </span>

                {/* Red dot badge indicator */}
                {hasItems && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E0262B] animate-pulse glow-red" />
                    {indicator.count > 1 && (
                      <span className="text-[9px] font-mono font-bold text-[#EDEFF1]/70">
                        {indicator.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Tactical Dossier */}
      <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#382d2a] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#E0262B]">
                SELECTED DOSSIER:
              </span>
              <span className="font-warrior text-base font-bold text-[#EDEFF1]">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#9A9DA1]">All targets, check-ins, and scheduled engagements</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTaskModalWithDate(selectedDateStr)}
              className="flex items-center gap-1.5 bg-[#E0262B] hover:bg-[#c01d22] text-white px-3 py-1.5 text-xs font-bold font-warrior clip-angular-sm glow-red"
            >
              <Plus className="w-3.5 h-3.5" />
              + MISSION
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setShowEventModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a] px-3 py-1.5 text-xs font-bold font-warrior clip-angular-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0262B]" />
              + EVENT
            </button>
          </div>
        </div>

        {/* Selected Day Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Column 1: Missions */}
          <div className="bg-[#181211] p-4 border border-[#382d2a] clip-angular-sm">
            <h3 className="font-warrior text-xs font-bold text-[#EDEFF1] mb-3 flex items-center justify-between">
              <span>MISSIONS ({selectedDayTasks.length})</span>
            </h3>
            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-[#9A9DA1] italic py-4">No missions set for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      sounds.playTaskComplete();
                      onToggleTask(t.id);
                    }}
                    className="p-2.5 bg-[#231b19] border border-[#382d2a] hover:border-[#E0262B]/60 transition cursor-pointer flex items-start gap-2.5 clip-angular-sm"
                  >
                    <button className="mt-0.5 text-[#9A9DA1]">
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#E0262B]" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold ${t.completed ? 'line-through text-[#9A9DA1]' : 'text-[#EDEFF1]'}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] text-[#9A9DA1] mt-0.5 flex items-center gap-2">
                        <span>{t.category}</span>
                        {t.dueTime && <span>{t.dueTime}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Scheduled Events */}
          <div className="bg-[#181211] p-4 border border-[#382d2a] clip-angular-sm">
            <h3 className="font-warrior text-xs font-bold text-[#EDEFF1] mb-3">
              ENGAGEMENTS / EVENTS ({selectedDayEvents.length})
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="text-xs text-[#9A9DA1] italic py-4">No calendar events logged.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((e) => (
                  <div key={e.id} className="p-2.5 bg-[#231b19] border border-[#382d2a] clip-angular-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-[#EDEFF1]">
                      <span>{e.title}</span>
                      {e.time && (
                        <span className="text-[10px] text-[#E0262B] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {e.time}
                        </span>
                      )}
                    </div>
                    {e.notes && <p className="text-[11px] text-[#9A9DA1] mt-1">{e.notes}</p>}
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 bg-[#2c2220] text-[#9A9DA1] rounded">
                      {e.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Habit Strikes on this day */}
          <div className="bg-[#181211] p-4 border border-[#382d2a] clip-angular-sm">
            <h3 className="font-warrior text-xs font-bold text-[#EDEFF1] mb-3">
              HABIT STRIKES RECORD
            </h3>
            <div className="space-y-2">
              {selectedDayHabits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    sounds.playHabitCheck();
                    onToggleHabit(h.id, selectedDateStr);
                  }}
                  className={`p-2.5 border transition cursor-pointer flex items-center justify-between clip-angular-sm ${
                    h.doneOnDate
                      ? 'bg-[#281313] border-[#E0262B]/50'
                      : 'bg-[#231b19] border-[#382d2a]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-[#EDEFF1] truncate">{h.title}</div>
                    <div className="text-[10px] text-[#9A9DA1] flex items-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3 text-[#E0262B]" />
                      <span>{h.currentStreak}d streak</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold font-warrior px-2 py-0.5 rounded ${
                      h.doneOnDate ? 'bg-[#E0262B] text-white' : 'bg-[#2c2220] text-[#9A9DA1]'
                    }`}
                  >
                    {h.doneOnDate ? 'CONQUERED' : 'UNSTUCK'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#231b19] border-2 border-[#E0262B] p-5 clip-angular">
            <h3 className="font-warrior text-base font-bold text-[#EDEFF1] mb-3 pb-2 border-b border-[#382d2a]">
              ADD EVENT TO {selectedDateStr}
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sparring Session, War Council Meeting"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  >
                    <option value="Training">Training</option>
                    <option value="Discipline">Discipline</option>
                    <option value="Work">Work</option>
                    <option value="Mind">Mind</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Tactical details, equipment, objectives..."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#382d2a]">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3.5 py-1.5 text-xs text-[#9A9DA1] hover:text-[#EDEFF1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#E0262B] hover:bg-[#c01d22] text-white px-4 py-1.5 text-xs font-bold font-warrior clip-angular-sm glow-red"
                >
                  SAVE EVENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
