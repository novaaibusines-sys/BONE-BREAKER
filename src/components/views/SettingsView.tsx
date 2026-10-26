import React, { useState, useRef } from 'react';
import { AppSettings } from '../../types';
import { exportAllData, importAllData, resetAllData } from '../../utils/storage';
import { notifications } from '../../utils/notifications';
import { sounds } from '../../utils/sound';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { SkullLogo } from '../SkullLogo';
import { 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Eye, 
  EyeOff, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // API Key state
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Notification state
  const [notifPermission, setNotifPermission] = useState(notifications.getPermission());
  const [notifTestSuccess, setNotifTestSuccess] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    onUpdateSettings({
      ...settings,
      geminiApiKey: apiKeyInput.trim(),
    });
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2500);
  };

  const handleClearApiKey = () => {
    if (window.confirm('Erase stored Gemini API key from this browser?')) {
      sounds.playClick();
      setApiKeyInput('');
      onUpdateSettings({
        ...settings,
        geminiApiKey: '',
      });
    }
  };

  const handleRequestNotification = async () => {
    sounds.playClick();
    const granted = await notifications.requestPermission();
    setNotifPermission(notifications.getPermission());
    if (granted) {
      notifications.sendNotification('⚔️ BONE BREAKER NOTIFICATIONS ENGAGED', {
        body: 'You will receive reminders when battle missions and habit check-ins are due.',
      });
      setNotifTestSuccess(true);
      setTimeout(() => setNotifTestSuccess(false), 3000);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    sounds.enabled = nextVal;
    if (nextVal) sounds.playAlert();
    onUpdateSettings({
      ...settings,
      soundEnabled: nextVal,
    });
  };

  const handleExportJSON = () => {
    sounds.playClick();
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bone-breaker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importAllData(content);
      if (res.success) {
        sounds.playAlert();
        setImportStatus('Backup data restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus(`Restore failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteReset = () => {
    sounds.playClick();
    resetAllData();
    setShowResetModal(false);
    onDataReset();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 sm:p-5 clip-angular flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#181211] text-[#E0262B] border border-[#382d2a]">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-warrior text-xl sm:text-2xl font-bold text-[#EDEFF1]">
              ARMORY & SETTINGS
            </h1>
            <p className="text-xs text-[#9A9DA1]">
              Configure tactical keys, notifications, sound effects, and data security.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Gemini API Key */}
      <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#382d2a]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#E0262B]" />
            <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
              GEMINI AI INTELLIGENCE KEY
            </h2>
          </div>
          {settings.geminiApiKey ? (
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#E0262B]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>KEY CONFIGURED</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#9A9DA1]">NOT SET</span>
          )}
        </div>

        <p className="text-xs text-[#9A9DA1] leading-relaxed">
          Your key is stored <strong>exclusively inside your browser (localStorage)</strong>. It is never exposed or sent to third-party trackers. This enables the AI Coach to formulate live tactical responses.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-[#181211] border border-[#382d2a] px-3.5 py-2.5 pr-20 text-xs sm:text-sm text-[#EDEFF1] placeholder-[#9A9DA1]/60 focus:border-[#E0262B] outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-[#9A9DA1] hover:text-[#EDEFF1] p-0.5"
              title={showKey ? 'Hide Key' : 'Reveal Key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#E0262B] hover:bg-[#c01d22] text-white px-4 py-2 text-xs font-bold font-warrior clip-angular-sm glow-red flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>SAVE API KEY</span>
              </button>

              {settings.geminiApiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="bg-[#181211] hover:bg-[#2c2220] text-[#9A9DA1] hover:text-[#E0262B] border border-[#382d2a] px-3 py-2 text-xs font-bold font-warrior clip-angular-sm"
                >
                  CLEAR KEY
                </button>
              )}
            </div>

            {keySavedToast && (
              <span className="text-xs font-bold text-[#E0262B] font-mono animate-pulse">
                ✓ KEY SECURED IN LOCAL STORAGE
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Section 2: Notifications & Reminders */}
      <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#382d2a]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#E0262B]" />
            <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
              PHONE NOTIFICATIONS & REMINDERS
            </h2>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              notifPermission === 'granted'
                ? 'bg-[#E0262B] text-white'
                : 'bg-[#181211] text-[#9A9DA1] border border-[#382d2a]'
            }`}
          >
            STATUS: {notifPermission.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-[#9A9DA1] leading-relaxed">
          Receive real-time phone alerts when a new mission is logged, and when scheduled mission deadlines or habit check-ins arrive.
        </p>

        {/* iPhone Notice */}
        <div className="rounded bg-[#181211] border border-[#382d2a] p-3 text-xs text-[#9A9DA1]">
          <strong className="text-[#E0262B]">iPhone / iOS Instruction:</strong> On iOS, Apple requires that you first tap <em>Share &gt; Add to Home Screen</em>. Once launched from the Home Screen, tap the button below to grant notification clearance.
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestNotification}
            className="bg-[#2c2220] hover:bg-[#382d2a] border border-[#382d2a] hover:border-[#E0262B] text-[#EDEFF1] px-4 py-2 text-xs font-bold font-warrior clip-angular-sm flex items-center gap-2 transition"
          >
            <Bell className="w-3.5 h-3.5 text-[#E0262B]" />
            <span>
              {notifPermission === 'granted'
                ? 'RE-TEST NOTIFICATION'
                : 'REQUEST NOTIFICATION PERMISSION'}
            </span>
          </button>

          {notifTestSuccess && (
            <span className="text-xs font-bold text-[#E0262B] font-mono">
              ✓ TEST SIGNAL SENT
            </span>
          )}
        </div>
      </div>

      {/* Section 3: Audio & Tactile Feedback */}
      <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#382d2a]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#E0262B]" />
            <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
              WARRIOR SOUND EFFECTS
            </h2>
          </div>
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1 text-xs font-bold font-warrior clip-angular-sm transition ${
              settings.soundEnabled
                ? 'bg-[#E0262B] text-white glow-red'
                : 'bg-[#181211] text-[#9A9DA1] border border-[#382d2a]'
            }`}
          >
            {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        <p className="text-xs text-[#9A9DA1] leading-relaxed">
          Tactile synthesized audio effects: steel blade slash on task completion, bone snap on habit strikes, and tactical alert chimes. Pure web audio with zero external dependencies.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sounds.playTaskComplete()}
            className="bg-[#181211] hover:bg-[#2c2220] border border-[#382d2a] text-[#EDEFF1] px-3 py-1.5 text-xs font-mono"
          >
            Test Blade Slash
          </button>
          <button
            onClick={() => sounds.playHabitCheck()}
            className="bg-[#181211] hover:bg-[#2c2220] border border-[#382d2a] text-[#EDEFF1] px-3 py-1.5 text-xs font-mono"
          >
            Test Bone Snap
          </button>
          <button
            onClick={() => sounds.playAlert()}
            className="bg-[#181211] hover:bg-[#2c2220] border border-[#382d2a] text-[#EDEFF1] px-3 py-1.5 text-xs font-mono"
          >
            Test Alert Chime
          </button>
        </div>
      </div>

      {/* Section 4: Data Backup & Restore */}
      <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#382d2a]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#E0262B]" />
            <h2 className="font-warrior text-sm font-bold text-[#EDEFF1] tracking-wider">
              DATA ARCHIVE & RESTORATION
            </h2>
          </div>
        </div>

        <p className="text-xs text-[#9A9DA1] leading-relaxed">
          Download your complete battle history, habits, mission logs, codex notes, and chat conversations into a portable JSON backup file, or restore an existing backup on any device.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a] hover:border-[#E0262B] px-4 py-2 text-xs font-bold font-warrior clip-angular-sm flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#E0262B]" />
            <span>EXPORT ARCHIVE (.JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#2c2220] hover:bg-[#382d2a] text-[#EDEFF1] border border-[#382d2a] hover:border-[#E0262B] px-4 py-2 text-xs font-bold font-warrior clip-angular-sm flex items-center gap-2 transition"
          >
            <Upload className="w-3.5 h-3.5 text-[#E0262B]" />
            <span>IMPORT ARCHIVE (.JSON)</span>
          </button>

          {importStatus && (
            <span className="text-xs font-mono text-[#E0262B] font-bold">
              {importStatus}
            </span>
          )}
        </div>
      </div>

      {/* Section 5: Danger Zone (Reset Data) */}
      <div className="bg-[#231b19] border border-[#E0262B]/50 p-5 clip-angular space-y-3">
        <div className="flex items-center gap-2 text-[#E0262B]">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="font-warrior text-sm font-bold tracking-wider">
            BATTLE RESET (DANGER ZONE)
          </h2>
        </div>
        <p className="text-xs text-[#9A9DA1]">
          Erase all mission tasks, habit streaks, codex notes, and conversation archives. This action cannot be reversed.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          className="bg-red-950/40 hover:bg-[#E0262B] text-white border border-[#E0262B] px-4 py-2 text-xs font-bold font-warrior clip-angular-sm transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>WIPE ALL BATTLE DATA</span>
        </button>
      </div>

      {/* Section 6: App Branding Info */}
      <div className="p-4 bg-[#181211] border border-[#382d2a] clip-angular text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <SkullLogo size={28} glow={false} />
          <span className="font-warrior text-sm font-bold text-[#EDEFF1]">
            BONE BREAKER PWA v1.0.0
          </span>
        </div>
        <p className="text-[11px] text-[#9A9DA1] font-mono">
          OFFLINE-FIRST WARRIOR PROTOCOL • ZERO TELEMETRY • BUILT FOR CONQUEST
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#231b19] border-2 border-[#E0262B] p-6 clip-angular shadow-2xl">
            <div className="flex items-center gap-2 text-[#E0262B] mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-warrior text-base font-bold text-[#EDEFF1]">
                CONFIRM TOTAL DATA PURGE
              </h3>
            </div>
            <p className="text-xs text-[#9A9DA1] mb-5 leading-relaxed">
              Are you certain you wish to wipe all tasks, habits, and notes? Your streak flame will be extinguished.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#9A9DA1] hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleExecuteReset}
                className="bg-[#E0262B] hover:bg-[#c01d22] text-white px-4 py-1.5 text-xs font-bold font-warrior clip-angular-sm glow-red"
              >
                CONFIRM WIPE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
