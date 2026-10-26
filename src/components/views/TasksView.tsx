import React, { useState, useMemo } from 'react';
import { Task, Priority, Subtask } from '../../types';
import { getTodayDateStr } from '../../utils/storage';
import { sounds } from '../../utils/sound';
import { notifications } from '../../utils/notifications';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  Bell, 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter, 
  X, 
  ListChecks, 
  AlertTriangle
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  initialModalOpen?: boolean;
  initialDate?: string;
  onCloseInitialModal?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  initialModalOpen = false,
  initialDate,
  onCloseInitialModal,
}) => {
  const todayStr = getTodayDateStr();

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State (Add or Edit)
  const [isModalOpen, setIsModalOpen] = useState(initialModalOpen);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(initialDate || todayStr);
  const [dueTime, setDueTime] = useState('12:00');
  const [reminderTime, setReminderTime] = useState('at_due');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Training');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Open modal in create mode
  const openCreateModal = () => {
    sounds.playClick();
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate(todayStr);
    setDueTime('12:00');
    setReminderTime('at_due');
    setPriority('medium');
    setCategory('Training');
    setSubtasks([]);
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '12:00');
    setReminderTime(task.reminderTime || 'at_due');
    setPriority(task.priority);
    setCategory(task.category);
    setSubtasks(task.subtasks || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    if (onCloseInitialModal) onCloseInitialModal();
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `st-${Date.now()}-${Math.random()}`,
        title: newSubtaskInput.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskInput('');
  };

  const handleToggleSubtaskInCard = (task: Task, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      completed: allDone ? true : task.completed,
    });
  };

  const handleRemoveSubtaskInModal = (stId: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== stId));
  };

  // Submit Task (Create or Update)
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      const updated: Task = {
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        reminderTime,
        priority,
        category,
        subtasks,
      };
      onUpdateTask(updated);
      sounds.playAlert();
    } else {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        reminderTime,
        priority,
        category,
        completed: false,
        subtasks,
      };
      onAddTask(newTask);
      sounds.playAlert();

      // Send local phone notification as requested:
      // "Send a phone notification when a new task is created and when a task or habit reminder is due, with the task title in the notification"
      notifications.notifyTaskCreated({
        id: 'new',
        createdAt: new Date().toISOString(),
        ...newTask,
      });
    }

    closeModal();
  };

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Tab Filter
      if (filterType === 'today') {
        return t.dueDate === todayStr || (!t.completed && t.dueDate < todayStr);
      }
      if (filterType === 'upcoming') {
        return t.dueDate > todayStr && !t.completed;
      }
      if (filterType === 'completed') {
        return t.completed;
      }
      return true;
    });
  }, [tasks, filterType, selectedPriority, searchQuery, todayStr]);

  const priorityColors = {
    high: 'text-[#E0262B] border-[#E0262B] bg-[#281313]',
    medium: 'text-amber-500 border-amber-600/50 bg-amber-950/20',
    low: 'text-[#9A9DA1] border-[#382d2a] bg-[#181211]',
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner & Action */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 sm:p-5 clip-angular flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#E0262B]" />
            <h1 className="font-warrior text-xl sm:text-2xl font-bold text-[#EDEFF1]">
              TACTICAL MISSIONS
            </h1>
          </div>
          <p className="text-xs text-[#9A9DA1] mt-1">
            Execute without hesitation. Clear your radar every single day.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-[#E0262B] hover:bg-[#c01d22] active:scale-95 text-white px-4 py-2.5 text-xs sm:text-sm font-bold font-warrior transition glow-red clip-angular-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          NEW MISSION DIRECTIVE
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#231b19] border border-[#382d2a] p-3 sm:p-4 clip-angular space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Main Filter Tabs */}
          <div className="flex flex-wrap bg-[#181211] p-1 border border-[#382d2a] clip-angular-sm">
            {[
              { id: 'today', label: "TODAY'S BATTLE" },
              { id: 'upcoming', label: 'UPCOMING' },
              { id: 'completed', label: 'CONQUERED' },
              { id: 'all', label: 'ALL TARGETS' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  sounds.playClick();
                  setFilterType(f.id as typeof filterType);
                }}
                className={`px-3 py-1.5 text-xs font-bold font-warrior transition ${
                  filterType === f.id
                    ? 'bg-[#E0262B] text-white glow-red'
                    : 'text-[#9A9DA1] hover:text-[#EDEFF1]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#9A9DA1]" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-[#181211] border border-[#382d2a] text-xs font-bold text-[#EDEFF1] px-3 py-1.5 outline-none focus:border-[#E0262B]"
            >
              <option value="all">ALL PRIORITIES</option>
              <option value="high">HIGH PRIORITY</option>
              <option value="medium">MEDIUM PRIORITY</option>
              <option value="low">LOW PRIORITY</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9A9DA1] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search missions by title, category, or objectives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181211] border border-[#382d2a] pl-9 pr-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#231b19] border border-[#382d2a] p-10 text-center clip-angular">
            <AlertTriangle className="w-8 h-8 text-[#E0262B] mx-auto mb-2 opacity-80" />
            <h3 className="font-warrior text-base font-bold text-[#EDEFF1]">
              NO MISSIONS FOUND
            </h3>
            <p className="text-xs text-[#9A9DA1] mt-1 max-w-sm mx-auto">
              No tasks match this filter. Time to break some bones. Add a new mission directive above.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 bg-[#E0262B] text-white px-4 py-2 text-xs font-bold font-warrior clip-angular-sm glow-red"
            >
              + ADD MISSION NOW
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = !task.completed && task.dueDate < todayStr;
            const subtaskCompleted = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
            const subtaskTotal = task.subtasks ? task.subtasks.length : 0;

            return (
              <div
                key={task.id}
                onClick={() => {
                  sounds.playTaskComplete();
                  onToggleTask(task.id);
                }}
                className={`group cursor-pointer bg-[#231b19] border p-4 transition-all clip-angular ${
                  task.completed
                    ? 'border-[#382d2a] opacity-60'
                    : isOverdue
                    ? 'border-[#E0262B] bg-[#281313]'
                    : 'border-[#382d2a] hover:border-[#E0262B]/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox */}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold ${
                            task.completed ? 'line-through text-[#9A9DA1]' : 'text-[#EDEFF1]'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Category */}
                        <span className="px-2 py-0.5 text-[9px] font-mono text-[#9A9DA1] bg-[#181211] border border-[#382d2a] rounded">
                          {task.category}
                        </span>

                        {isOverdue && (
                          <span className="px-2 py-0.5 text-[9px] font-bold text-white bg-amber-600 rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#9A9DA1] mt-1.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Due date & Reminder tags */}
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-[#9A9DA1] font-mono">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#E0262B]" />
                          <span>
                            {task.dueDate}
                            {task.dueTime ? ` @ ${task.dueTime}` : ''}
                          </span>
                        </span>

                        {task.reminderTime && task.reminderTime !== 'none' && (
                          <span className="flex items-center gap-1 text-[#E0262B]">
                            <Bell className="w-3.5 h-3.5" />
                            <span className="text-[10px]">
                              {task.reminderTime === 'at_due' ? 'At Deadline' : `${task.reminderTime} prior`}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Subtasks checklist if present */}
                      {subtaskTotal > 0 && (
                        <div
                          className="mt-3 pt-3 border-t border-[#382d2a]/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#9A9DA1] mb-1.5 font-mono">
                            <span className="flex items-center gap-1 text-[#EDEFF1] font-semibold">
                              <ListChecks className="w-3.5 h-3.5 text-[#E0262B]" />
                              <span>SUB-TARGETS</span>
                            </span>
                            <span>
                              {subtaskCompleted} / {subtaskTotal}
                            </span>
                          </div>

                          <div className="w-full bg-[#181211] h-1.5 rounded-full overflow-hidden mb-2">
                            <div
                              className="bg-[#E0262B] h-full transition-all"
                              style={{ width: `${(subtaskCompleted / subtaskTotal) * 100}%` }}
                            />
                          </div>

                          <div className="space-y-1.5 pl-1">
                            {task.subtasks.map((st) => (
                              <div
                                key={st.id}
                                onClick={(e) => handleToggleSubtaskInCard(task, st.id, e)}
                                className="flex items-center gap-2 text-xs cursor-pointer text-[#EDEFF1]/80 hover:text-white"
                              >
                                {st.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E0262B] shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-[#9A9DA1] shrink-0" />
                                )}
                                <span className={st.completed ? 'line-through text-[#9A9DA1]' : ''}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditModal(task, e)}
                      className="p-1.5 text-[#9A9DA1] hover:text-[#EDEFF1] hover:bg-[#2c2220] transition rounded"
                      title="Edit Mission"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        onDeleteTask(task.id);
                      }}
                      className="p-1.5 text-[#9A9DA1] hover:text-[#E0262B] hover:bg-[#2c2220] transition rounded"
                      title="Delete Mission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#231b19] border-2 border-[#E0262B] p-5 sm:p-6 clip-angular max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#382d2a] mb-4">
              <h2 className="font-warrior text-base sm:text-lg font-bold text-[#EDEFF1] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#E0262B]" />
                <span>{editingTask ? 'MODIFY DIRECTIVE' : 'LOG NEW MISSION'}</span>
              </h2>
              <button onClick={closeModal} className="text-[#9A9DA1] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Mission Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conquer 10km Ruck, Cold Email 20 High-Value Targets"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3.5 py-2 text-xs sm:text-sm text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Mission Intel & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Tactical objectives, constraints, standards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3.5 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Execution Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Target Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  />
                </div>
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  >
                    <option value="high">High (Blood Red - Urgent)</option>
                    <option value="medium">Medium (Tactical Focus)</option>
                    <option value="low">Low (Standard Routine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  >
                    <option value="Training">Training (Physical / Fitness)</option>
                    <option value="Discipline">Discipline (Habits / Rituals)</option>
                    <option value="Work">Work (Professional / Output)</option>
                    <option value="Mind">Mind (Reading / Strategy)</option>
                    <option value="Warfare">Warfare (Core Battles)</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Reminder Selection */}
              <div>
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Tactical Phone Reminder
                </label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-[#181211] border border-[#382d2a] px-3 py-2 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                >
                  <option value="at_due">At Due Time</option>
                  <option value="15m">15 Minutes Before</option>
                  <option value="30m">30 Minutes Before</option>
                  <option value="1h">1 Hour Before</option>
                  <option value="none">No Reminder</option>
                </select>
              </div>

              {/* Sub-tasks / Checklist builder */}
              <div className="pt-2 border-t border-[#382d2a]">
                <label className="block text-xs font-bold text-[#9A9DA1] uppercase mb-1">
                  Checklist / Sub-Targets (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a step (e.g. Set up gear, Complete phase 1)..."
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 bg-[#181211] border border-[#382d2a] px-3 py-1.5 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a] px-3 py-1.5 text-xs font-bold font-warrior"
                  >
                    + ADD
                  </button>
                </div>

                {/* Subtask list in modal */}
                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between bg-[#181211] p-2 border border-[#382d2a] text-xs clip-angular-sm"
                      >
                        <span className="text-[#EDEFF1] truncate">{st.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskInModal(st.id)}
                          className="text-[#9A9DA1] hover:text-[#E0262B] p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#382d2a]">
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
                  {editingTask ? 'SAVE DIRECTIVE' : 'DEPLOY MISSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
