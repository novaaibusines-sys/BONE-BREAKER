import React, { useState, useMemo } from 'react';
import { Habit } from '../../types';
import { formatDateStr, getTodayDateStr } from '../../utils/storage';
import { sounds } from '../../utils/sound';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  Award, 
  Calendar, 
  Activity, 
  Clock, 
  X, 
  TrendingUp, 
  ShieldAlert
} from 'lucide-react';

interface HabitsViewProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'history'>) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleHabit,
}) => {
  const todayStr = getTodayDateStr();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Training');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderTime, setReminderTime] = useState('08:00');

  // Heatmap View range: past 12 weeks (84 days)
  const heatmapDays = useMemo(() => {
    const days: { dateStr: string; dayOfWeek: number; label: string }[] = [];
    const today = new Date();
    // 84 days back
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = formatDateStr(d);
      days.push({
        dateStr: str,
        dayOfWeek: d.getDay(),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return days;
  }, []);

  // Aggregated completion map for heatmap (number of habits completed per day)
  const heatmapStats = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach((h) => {
      Object.keys(h.history || {}).forEach((dateStr) => {
        if (h.history[dateStr]) {
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      });
    });
    return counts;
  }, [habits]);

  // Overall weekly consistency calculation
  const weeklyConsistency = useMemo(() => {
    if (habits.length === 0) return 0;
    const today = new Date();
    let totalPossible = habits.length * 7;
    let completedCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = formatDateStr(d);
      habits.forEach((h) => {
        if (h.history && h.history[str]) completedCount++;
      });
    }

    return Math.round((completedCount / totalPossible) * 100);
  }, [habits]);

  // Overall monthly consistency calculation
  const monthlyConsistency = useMemo(() => {
    if (habits.length === 0) return 0;
    const today = new Date();
    let totalPossible = habits.length * 30;
    let completedCount = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = formatDateStr(d);
      habits.forEach((h) => {
        if (h.history && h.history[str]) completedCount++;
      });
    }

    return Math.round((completedCount / totalPossible) * 100);
  }, [habits]);

  const openCreateModal = () => {
    sounds.playClick();
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setCategory('Training');
    setFrequency('daily');
    setSelectedDays([1, 2, 3, 4, 5]);
    setReminderTime('08:00');
    setIsModalOpen(true);
  };

  const openEditModal = (h: Habit) => {
    sounds.playClick();
    setEditingHabit(h);
    setTitle(h.title);
    setDescription(h.description);
    setCategory(h.category);
    setFrequency(h.frequency);
    setSelectedDays(h.selectedDays || [1, 2, 3, 4, 5]);
    setReminderTime(h.reminderTime || '08:00');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingHabit) {
      onUpdateHabit({
        ...editingHabit,
        title: title.trim(),
        description: description.trim(),
        category,
        frequency,
        selectedDays: frequency === 'weekdays' ? selectedDays : undefined,
        reminderTime,
      });
    } else {
      onAddHabit({
        title: title.trim(),
        description: description.trim(),
        category,
        frequency,
        selectedDays: frequency === 'weekdays' ? selectedDays : undefined,
        reminderTime,
      });
    }

    sounds.playAlert();
    closeModal();
  };

  const handleCheckToday = (habitId: string) => {
    sounds.playHabitCheck();
    onToggleHabit(habitId, todayStr);
  };

  // Color intensity for heatmap
  const getHeatmapColor = (count: number) => {
    if (!count) return 'bg-[#181211] border-[#291f1d]';
    if (count === 1) return 'bg-[#5c1316] border-[#7d1a1e]';
    if (count === 2) return 'bg-[#9e181c] border-[#b81d22]';
    return 'bg-[#E0262B] border-[#ff474d] glow-red';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 sm:p-5 clip-angular flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#E0262B]" />
            <h1 className="font-warrior text-xl sm:text-2xl font-bold text-[#EDEFF1]">
              DISCIPLINE PROTOCOLS
            </h1>
          </div>
          <p className="text-xs text-[#9A9DA1] mt-1">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-[#E0262B] hover:bg-[#c01d22] active:scale-95 text-white px-4 py-2.5 text-xs sm:text-sm font-bold font-warrior transition glow-red clip-angular-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          FORGE NEW HABIT
        </button>
      </div>

      {/* Consistency Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>7-DAY CONSISTENCY</span>
            <TrendingUp className="w-4 h-4 text-[#E0262B]" />
          </div>
          <div className="font-warrior text-2xl font-bold text-[#EDEFF1] mt-2">
            {weeklyConsistency}%
          </div>
          <div className="w-full bg-[#181211] h-1.5 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-[#E0262B] h-full transition-all"
              style={{ width: `${weeklyConsistency}%` }}
            />
          </div>
        </div>

        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>30-DAY ENDURANCE</span>
            <Award className="w-4 h-4 text-[#E0262B]" />
          </div>
          <div className="font-warrior text-2xl font-bold text-[#EDEFF1] mt-2">
            {monthlyConsistency}%
          </div>
          <div className="w-full bg-[#181211] h-1.5 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-[#E0262B] h-full transition-all"
              style={{ width: `${monthlyConsistency}%` }}
            />
          </div>
        </div>

        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>ACTIVE PROTOCOLS</span>
            <Activity className="w-4 h-4 text-[#E0262B]" />
          </div>
          <div className="font-warrior text-2xl font-bold text-[#EDEFF1] mt-2">
            {habits.length}
          </div>
          <p className="text-[11px] text-[#9A9DA1] mt-2">
            Daily rituals forging mental armor
          </p>
        </div>
      </div>

      {/* 12-Week Battle Heatmap Grid */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 sm:p-5 clip-angular">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#382d2a]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E0262B]" />
            <h2 className="font-warrior text-xs sm:text-sm font-bold text-[#EDEFF1] tracking-wider">
              12-WEEK CONSISTENCY HEATMAP
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#9A9DA1]">
            <span>LESS</span>
            <span className="w-2.5 h-2.5 bg-[#181211] border border-[#382d2a]" />
            <span className="w-2.5 h-2.5 bg-[#5c1316]" />
            <span className="w-2.5 h-2.5 bg-[#9e181c]" />
            <span className="w-2.5 h-2.5 bg-[#E0262B]" />
            <span>MORE</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1 min-w-[500px]">
            {heatmapDays.map((d) => {
              const count = heatmapStats[d.dateStr] || 0;
              const isToday = d.dateStr === todayStr;
              return (
                <div
                  key={d.dateStr}
                  title={`${d.label}: ${count} habit(s) conquered`}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(
                    count
                  )} ${isToday ? 'ring-1 ring-white' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Protocol Cards */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="bg-[#231b19] border border-[#382d2a] p-10 text-center clip-angular">
            <ShieldAlert className="w-8 h-8 text-[#E0262B] mx-auto mb-2 opacity-80" />
            <h3 className="font-warrior text-base font-bold text-[#EDEFF1]">
              NO HABITS ESTABLISHED
            </h3>
            <p className="text-xs text-[#9A9DA1] mt-1 max-w-sm mx-auto">
              You are undisciplined without daily rituals. Forge your first habit protocol now.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 bg-[#E0262B] text-white px-4 py-2 text-xs font-bold font-warrior clip-angular-sm glow-red"
            >
              + FORGE FIRST HABIT
            </button>
          </div>
        ) : (
          habits.map((habit) => {
            const isDoneToday = Boolean(habit.history && habit.history[todayStr]);

            // Recent 7 days strip for this specific habit
            const last7Days = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const str = formatDateStr(d);
              last7Days.push({
                dateStr: str,
                dayName: WEEKDAY_NAMES[d.getDay()],
                isDone: Boolean(habit.history && habit.history[str]),
                isToday: str === todayStr,
              });
            }

            return (
              <div
                key={habit.id}
                className={`bg-[#231b19] border p-4 sm:p-5 clip-angular transition-all ${
                  isDoneToday ? 'border-[#E0262B]/50 bg-[#281313]' : 'border-[#382d2a]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-warrior text-base font-bold text-[#EDEFF1]">
                        {habit.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#181211] text-[#9A9DA1] border border-[#382d2a] font-mono rounded">
                        {habit.category}
                      </span>
                      <span className="text-[10px] text-[#9A9DA1] uppercase font-mono">
                        {habit.frequency === 'daily' ? 'DAILY' : 'WEEKDAYS'}
                      </span>
                    </div>

                    {habit.description && (
                      <p className="text-xs text-[#9A9DA1] mt-1">{habit.description}</p>
                    )}

                    {/* Streak & Reminder stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-[#E0262B] font-bold">
                        <Flame className="w-4 h-4 fill-current animate-pulse" />
                        <span>{habit.currentStreak} DAY STREAK</span>
                      </span>
                      <span className="text-[#9A9DA1]">
                        BEST: <strong className="text-[#EDEFF1]">{habit.bestStreak}d</strong>
                      </span>
                      {habit.reminderTime && (
                        <span className="flex items-center gap-1 text-[#9A9DA1]">
                          <Clock className="w-3.5 h-3.5 text-[#E0262B]" />
                          <span>{habit.reminderTime}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Check-in Strike & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleCheckToday(habit.id)}
                      className={`px-4 py-2 text-xs sm:text-sm font-bold font-warrior transition-all clip-angular-sm flex items-center gap-2 ${
                        isDoneToday
                          ? 'bg-[#E0262B] text-white glow-red'
                          : 'bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a]'
                      }`}
                    >
                      {isDoneToday ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>STRUCK TODAY</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-[#9A9DA1]" />
                          <span>STRIKE PROTOCOL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(habit)}
                      className="p-2 text-[#9A9DA1] hover:text-[#EDEFF1] hover:bg-[#2c2220] rounded"
                      title="Edit Protocol"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        onDeleteHabit(habit.id);
                      }}
                      className="p-2 text-[#9A9DA1] hover:text-[#E0262B] hover:bg-[#2c2220] rounded"
                      title="Delete Protocol"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7-Day Mini Tracker Bar */}
                <div className="mt-4 pt-3 border-t border-[#382d2a] flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#9A9DA1]">
                    Past 7 Days History
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {last7Days.map((d) => (
                      <button
                        key={d.dateStr}
                        onClick={() => {
                          sounds.playHabitCheck();
                          onToggleHabit(habit.id, d.dateStr);
                        }}
                        className={`flex flex-col items-center justify-center w-7 h-9 border text-[9px] font-mono transition ${
                          d.isDone
                            ? 'bg-[#E0262B] text-white border-[#E0262B]'
                            : 'bg-[#181211] text-[#9A9DA1] border-[#382d2a] hover:border-[#9A9DA1]'
                        } ${d.isToday ? 'ring-1 ring-white' : ''}`}
                      >
                        <span className="text-[8px] opacity-75">{d.dayName}</span>
                        <span className="font-bold">{d.isDone ? '✓' : '—'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#231b19] border-2 border-[#E0262B] p-5 sm:p-6 clip-angular shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#382d2a] mb-4">
              <h2 className="font-warrior text-base font-bold text-[#EDEFF1] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#E0262B]" />
                <span>{editingHabit ? 'MODIFY PROTOCOL' : 'FORGE NEW HABIT'}</span>
              </h2>
              <button onClick={closeModal} className="text-[#9A9DA1] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Pushups, Read Marcus Aurelius, Cold Shower"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3.5 py-2 text-xs sm:text-sm text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Warrior Purpose / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Why this habit is essential to your armor..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3.5 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  >
                    <option value="Training">Training (Fitness)</option>
                    <option value="Discipline">Discipline</option>
                    <option value="Mind">Mind (Mental)</option>
                    <option value="Warfare">Warfare</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekdays')}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  >
                    <option value="daily">Every Single Day</option>
                    <option value="weekdays">Specific Days</option>
                  </select>
                </div>
              </div>

              {/* Specific Weekdays selection */}
              {frequency === 'weekdays' && (
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1.5">
                    Target Weekdays
                  </label>
                  <div className="flex items-center gap-1.5">
                    {WEEKDAY_NAMES.map((name, idx) => {
                      const isSel = selectedDays.includes(idx);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleToggleDay(idx)}
                          className={`flex-1 py-1.5 text-xs font-bold font-mono transition border ${
                            isSel
                              ? 'bg-[#E0262B] text-white border-[#E0262B]'
                              : 'bg-[#181211] text-[#9A9DA1] border-[#382d2a]'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Daily Check-in Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#382d2a]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-[#9A9DA1] hover:text-[#EDEFF1]"
                >
                  DISCARD
                </button>
                <button
                  type="submit"
                  className="bg-[#E0262B] hover:bg-[#c01d22] text-white px-5 py-2 text-xs sm:text-sm font-bold font-warrior clip-angular-sm glow-red"
                >
                  {editingHabit ? 'SAVE PROTOCOL' : 'IGNITE PROTOCOL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
