import React from 'react';
import { ActiveTab } from '../types';
import { SkullLogo } from './SkullLogo';
import { 
  Flame, 
  Calendar, 
  CheckSquare, 
  Activity, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Award
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingTasksCount: number;
  totalStreak: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  totalStreak,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Command', icon: Flame },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'habits', label: 'Discipline', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare },
    { id: 'notes', label: 'Codex', icon: BookOpen },
    { id: 'settings', label: 'Armory', icon: Settings },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    sounds.playClick();
    onSelectTab(tab);
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#231b19] border-r border-[#382d2a] min-h-screen p-4 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#382d2a]/70">
          <SkullLogo size={46} glow={true} animatedEye={true} />
          <div>
            <div className="font-warrior text-base font-extrabold tracking-wider text-[#EDEFF1] flex items-center gap-1.5">
              <span>BONE</span>
              <span className="text-[#E0262B] text-glow-red">BREAKER</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#9A9DA1] font-mono">
              WARRIOR TRAINING LOG
            </div>
          </div>
        </div>

        {/* Warrior Streak Stat Badge */}
        <div className="mb-6 p-3 bg-[#181211] border border-[#382d2a] clip-angular">
          <div className="flex items-center justify-between text-xs text-[#9A9DA1] mb-1">
            <span className="uppercase tracking-wider font-semibold">Active Streak</span>
            <Award className="w-3.5 h-3.5 text-[#E0262B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-warrior text-2xl font-bold text-[#EDEFF1]">{totalStreak}</span>
            <span className="text-xs text-[#E0262B] uppercase font-bold tracking-wide">
              {totalStreak === 1 ? 'DAY' : 'DAYS CONQUERED'}
            </span>
          </div>
          <div className="w-full bg-[#231b19] h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#9e181c] to-[#E0262B] h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(10, totalStreak * 7))}%` }}
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold transition-all clip-angular-sm ${
                  isActive
                    ? 'bg-[#E0262B] text-white font-bold glow-red'
                    : 'text-[#9A9DA1] hover:text-[#EDEFF1] hover:bg-[#2c2220]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9A9DA1]'}`} />
                  <span className="font-warrior tracking-wide">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-black text-[#EDEFF1]' : 'bg-[#E0262B] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Motto */}
        <div className="pt-4 border-t border-[#382d2a]/70 px-2 text-center">
          <p className="text-[11px] font-crest text-[#9A9DA1]/80 italic">
            "Steel sharpens steel."
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#231b19]/95 backdrop-blur-md border-t border-[#382d2a] pb-safe px-1">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive ? 'text-[#E0262B]' : 'text-[#9A9DA1] active:text-[#EDEFF1]'
                }`}
                style={{ minWidth: 44, minHeight: 48 }}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(224,38,43,0.7)]' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E0262B] px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-warrior font-semibold tracking-wider ${isActive ? 'text-[#EDEFF1] font-bold' : 'text-[#9A9DA1]'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#E0262B] rounded-full glow-red" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
