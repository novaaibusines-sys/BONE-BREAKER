import React, { useMemo } from 'react';
import { Task, Habit, ActiveTab } from '../../types';
import { getTodayDateStr } from '../../utils/storage';
import { sounds } from '../../utils/sound';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Plus, 
  ArrowRight, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  CheckSquare
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  habits: Habit[];
  onToggleTask: (taskId: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewTaskModal: () => void;
}

const MOTIVATIONAL_LINES = [
  "Steel sharpens steel. No excuses on the battlefield today.",
  "Pain is temporary. Quitting is forever. Break the cycle.",
  "The iron does not lie. Discipline equals absolute freedom.",
  "What stands in the way becomes the way. Conquer it.",
  "The weak wait for motivation. The warrior builds relentless habit.",
  "Show no mercy to your inner doubts. Execute with cold precision.",
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  habits,
  onToggleTask,
  onToggleHabit,
  onNavigate,
  onOpenNewTaskModal,
}) => {
  const todayStr = getTodayDateStr();

  // Deterministic daily motivational quote based on date
  const dailyMotto = useMemo(() => {
    const dayNum = new Date().getDate();
    return MOTIVATIONAL_LINES[dayNum % MOTIVATIONAL_LINES.length];
  }, []);

  // Today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr || (!t.completed && t.dueDate < todayStr));
  }, [tasks, todayStr]);

  const completedTasksToday = todayTasks.filter((t) => t.completed).length;

  // Habits status for today
  const habitsToday = useMemo(() => {
    return habits.map((h) => ({
      ...h,
      doneToday: Boolean(h.history && h.history[todayStr]),
    }));
  }, [habits, todayStr]);

  const completedHabitsToday = habitsToday.filter((h) => h.doneToday).length;

  // Total daily completion percentage
  const totalItems = todayTasks.length + habitsToday.length;
  const totalCompleted = completedTasksToday + completedHabitsToday;
  const progressPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  // Active top streak
  const highestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  // Formatted date string
  const formattedDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  }, []);

  const handleTaskCheck = (taskId: string) => {
    sounds.playTaskComplete();
    onToggleTask(taskId);
  };

  const handleHabitCheck = (habitId: string) => {
    sounds.playHabitCheck();
    onToggleHabit(habitId, todayStr);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Tactical Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#231b19] via-[#281e1c] to-[#181211] border border-[#382d2a] p-5 md:p-6 clip-angular shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#E0262B]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E0262B] animate-ping" />
              <span>LOG DATE: {formattedDate}</span>
            </div>
            <h1 className="font-warrior text-2xl md:text-3xl font-extrabold text-[#EDEFF1] mt-1 tracking-wide">
              WARRIOR COMMAND POST
            </h1>
            <p className="mt-2 text-sm text-[#9A9DA1] italic font-serif max-w-xl border-l-2 border-[#E0262B] pl-3 py-0.5">
              "{dailyMotto}"
            </p>
          </div>

          {/* Quick Add Mission CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenNewTaskModal();
              }}
              className="flex items-center gap-2 bg-[#E0262B] hover:bg-[#c01d22] active:scale-95 text-white px-4 py-2.5 text-xs md:text-sm font-bold font-warrior transition glow-red clip-angular-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              LOG MISSION
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onNavigate('coach');
              }}
              className="flex items-center gap-2 bg-[#2c2220] hover:bg-[#382d2a] border border-[#382d2a] hover:border-[#E0262B]/50 text-[#EDEFF1] px-4 py-2.5 text-xs md:text-sm font-bold font-warrior transition clip-angular-sm"
            >
              <MessageSquare className="w-4 h-4 text-[#E0262B]" />
              AI COACH
            </button>
          </div>
        </div>

        {/* Ambient background watermark crosshair */}
        <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-5 text-[#E0262B]">
          <Flame className="w-64 h-64" />
        </div>
      </div>

      {/* Progress & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Daily Battle Completion Gauge */}
        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>DAILY EXECUTION</span>
            <span className="text-[#E0262B] font-bold">{progressPercent}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="font-warrior text-2xl font-bold text-[#EDEFF1]">
                {totalCompleted} / {totalItems}
              </div>
              <div className="text-[11px] text-[#9A9DA1]">Targets neutralized</div>
            </div>
            {/* Circular Mini Gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="#181211" strokeWidth="4" fill="none" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#E0262B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-[#EDEFF1]">
                {progressPercent}%
              </span>
            </div>
          </div>
          {/* Angular bar */}
          <div className="w-full bg-[#181211] h-1.5 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-[#E0262B] h-full transition-all duration-500 glow-red"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Today's Missions */}
        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>TODAY'S MISSIONS</span>
            <CheckSquare className="w-3.5 h-3.5 text-[#E0262B]" />
          </div>
          <div className="mt-3">
            <div className="font-warrior text-2xl font-bold text-[#EDEFF1]">
              {completedTasksToday} / {todayTasks.length}
            </div>
            <div className="text-[11px] text-[#9A9DA1]">
              {todayTasks.length - completedTasksToday} missions remaining
            </div>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#E0262B] hover:underline"
          >
            <span>View All Missions</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 3: Habit Strikes */}
        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>DISCIPLINE STRIKES</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#E0262B]" />
          </div>
          <div className="mt-3">
            <div className="font-warrior text-2xl font-bold text-[#EDEFF1]">
              {completedHabitsToday} / {habitsToday.length}
            </div>
            <div className="text-[11px] text-[#9A9DA1]">
              {habitsToday.length - completedHabitsToday} habits unsealed
            </div>
          </div>
          <button
            onClick={() => onNavigate('habits')}
            className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#E0262B] hover:underline"
          >
            <span>Manage Discipline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4: Peak Streak Flame */}
        <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] font-mono">
            <span>PEAK STREAK</span>
            <Flame className="w-3.5 h-3.5 text-[#E0262B]" />
          </div>
          <div className="mt-3">
            <div className="font-warrior text-2xl font-bold text-[#EDEFF1] flex items-center gap-2">
              <span>{highestStreak}</span>
              <span className="text-xs text-[#E0262B] font-bold tracking-widest uppercase">
                DAYS
              </span>
            </div>
            <div className="text-[11px] text-[#9A9DA1]">Relentless unbroken warrior chain</div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-[#9A9DA1]">
            Status: <span className="text-[#EDEFF1] font-bold">ACTIVE FLAME</span>
          </div>
        </div>
      </div>

      {/* Main Split: Today's Missions & Quick Habit Strike */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Today's Urgent Missions */}
        <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#382d2a]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#E0262B]" />
              <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
                TODAY'S MISSION DIRECTIVES
              </h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-[#9A9DA1] hover:text-[#EDEFF1] font-bold flex items-center gap-1"
            >
              <span>ALL</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="py-8 text-center text-[#9A9DA1]">
              <div className="font-warrior text-base font-bold text-[#EDEFF1]">
                NO MISSIONS LOGGED FOR TODAY
              </div>
              <p className="text-xs mt-1">Time to break some bones. Assign a new target.</p>
              <button
                onClick={onOpenNewTaskModal}
                className="mt-4 bg-[#E0262B] text-white px-3.5 py-1.5 text-xs font-bold font-warrior clip-angular-sm glow-red"
              >
                + ADD MISSION
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.slice(0, 5).map((task) => {
                const isOverdue = !task.completed && task.dueDate < todayStr;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskCheck(task.id)}
                    className={`group cursor-pointer flex items-start gap-3 p-3 bg-[#181211] border transition-all clip-angular-sm ${
                      task.completed
                        ? 'border-[#382d2a] opacity-60'
                        : isOverdue
                        ? 'border-[#E0262B] bg-[#281313]'
                        : 'border-[#382d2a] hover:border-[#E0262B]/60'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-[#9A9DA1] group-hover:text-[#E0262B] transition"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#E0262B]" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            task.completed ? 'line-through text-[#9A9DA1]' : 'text-[#EDEFF1]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.priority === 'high' && !task.completed && (
                          <span className="shrink-0 px-1.5 py-0.2 bg-[#E0262B] text-[9px] font-bold text-white rounded">
                            URGENT
                          </span>
                        )}
                        {isOverdue && (
                          <span className="shrink-0 px-1.5 py-0.2 bg-amber-600 text-[9px] font-bold text-white rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9A9DA1]">
                        <span className="font-mono text-[10px] text-[#EDEFF1]/70">{task.category}</span>
                        {task.dueTime && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#E0262B]" />
                            {task.dueTime}
                          </span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section B: Daily Habit Strikes */}
        <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#382d2a]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E0262B]" />
              <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
                DAILY DISCIPLINE CHECK-IN
              </h2>
            </div>
            <button
              onClick={() => onNavigate('habits')}
              className="text-xs text-[#9A9DA1] hover:text-[#EDEFF1] font-bold flex items-center gap-1"
            >
              <span>STREAKS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {habitsToday.length === 0 ? (
            <div className="py-8 text-center text-[#9A9DA1]">
              <div className="font-warrior text-base font-bold text-[#EDEFF1]">
                NO HABITS CONFIGURED YET
              </div>
              <p className="text-xs mt-1">Discipline is your weapon. Forge your first daily habit.</p>
              <button
                onClick={() => onNavigate('habits')}
                className="mt-4 bg-[#E0262B] text-white px-3.5 py-1.5 text-xs font-bold font-warrior clip-angular-sm glow-red"
              >
                FORGE HABIT
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habitsToday.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center justify-between p-3 bg-[#181211] border transition-all clip-angular-sm ${
                    habit.doneToday ? 'border-[#E0262B]/50 bg-[#281313]' : 'border-[#382d2a]'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#EDEFF1] truncate">{habit.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#2c2220] text-[#9A9DA1] rounded font-mono">
                        {habit.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9A9DA1]">
                      <span className="flex items-center gap-1 text-[#E0262B] font-bold">
                        <Flame className="w-3 h-3 fill-current" />
                        {habit.currentStreak} Day Streak
                      </span>
                      <span>Best: {habit.bestStreak}d</span>
                    </div>
                  </div>

                  {/* Strike Action Button */}
                  <button
                    onClick={() => handleHabitCheck(habit.id)}
                    className={`px-3 py-1.5 text-xs font-bold font-warrior transition-all clip-angular-sm flex items-center gap-1.5 ${
                      habit.doneToday
                        ? 'bg-[#E0262B] text-white glow-red'
                        : 'bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a]'
                    }`}
                  >
                    {habit.doneToday ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>STRUCK</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-[#9A9DA1]" />
                        <span>STRIKE</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
