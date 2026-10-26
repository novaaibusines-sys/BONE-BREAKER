import React, { useState, useRef, useEffect } from 'react';
import { Task, Habit, Note, ChatMessage, ActiveTab } from '../../types';
import { streamCoachResponse } from '../../services/aiCoach';
import { loadSettings } from '../../utils/storage';
import { sounds } from '../../utils/sound';
import { SkullLogo } from '../SkullLogo';
import { 
  Send, 
  Trash2, 
  Flame, 
  Sparkles, 
  Key, 
  AlertCircle, 
  ShieldAlert, 
  Bot, 
  User, 
  RefreshCw 
} from 'lucide-react';

interface AICoachViewProps {
  chatMessages: ChatMessage[];
  onSaveChat: (messages: ChatMessage[]) => void;
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  onNavigate: (tab: ActiveTab) => void;
}

const QUICK_PROMPTS = [
  { label: 'Plan my day', prompt: 'Analyze my pending missions and habits for today, and structure an optimal hour-by-hour tactical execution plan.' },
  { label: 'Analyze my habits', prompt: 'Audit my current habit streaks and consistency. Point out weaknesses and tell me how to reach a 30-day streak.' },
  { label: 'Motivate me', prompt: 'I feel resistance and fatigue creeping in. Hit me with an uncompromising warrior speech to break through.' },
  { label: 'Fix my schedule', prompt: 'Look at my priorities and give me 3 strict rules to eliminate distraction and conquer today’s top tasks.' },
];

export const AICoachView: React.FC<AICoachViewProps> = ({
  chatMessages,
  onSaveChat,
  tasks,
  habits,
  notes,
  onNavigate,
}) => {
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const settings = loadSettings();
  const hasKey = Boolean(settings.geminiApiKey?.trim());

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isStreaming]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    sounds.playClick();
    setInputText('');
    setStreamError(null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatMessages, userMsg];
    onSaveChat(newHistory);

    // Placeholder for assistant streaming message
    const botMsgId = `msg-${Date.now()}-bot`;
    const botMsg: ChatMessage = {
      id: botMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    const historyWithBot = [...newHistory, botMsg];
    onSaveChat(historyWithBot);
    setIsStreaming(true);

    try {
      let accumulatedText = '';
      const generator = streamCoachResponse(
        text,
        newHistory,
        { tasks, habits, notes },
        (chunk) => {
          accumulatedText += chunk;
          const updated = historyWithBot.map((m) =>
            m.id === botMsgId ? { ...m, content: accumulatedText } : m
          );
          onSaveChat(updated);
        }
      );

      for await (const chunk of generator) {
        // Handled via callback
      }

      sounds.playAlert();
    } catch (err: unknown) {
      console.error('Coach stream error:', err);
      const errMsg = (err as Error).message || 'Failed to reach coach.';
      setStreamError(errMsg);
      const updated = historyWithBot.map((m) =>
        m.id === botMsgId
          ? {
              ...m,
              content: `⚠️ [Direct Comms Interrupted]\n\n${errMsg}\n\nPlease verify your Gemini API key in Settings.`,
            }
          : m
      );
      onSaveChat(updated);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation history with your AI Coach?')) {
      sounds.playClick();
      const resetMsg: ChatMessage[] = [
        {
          id: 'welcome-reset',
          sender: 'assistant',
          content: 'Chat cleared. Slate wiped clean. What is your next tactical directive, Warrior?',
          timestamp: new Date().toISOString(),
        },
      ];
      onSaveChat(resetMsg);
      setStreamError(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-5xl mx-auto pb-4 animate-in fade-in">
      {/* Top Bar */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 clip-angular flex items-center justify-between shrink-0 mb-3 shadow-md">
        <div className="flex items-center gap-3">
          <SkullLogo size={38} glow={isStreaming} animatedEye={isStreaming} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-warrior text-base sm:text-lg font-bold text-[#EDEFF1]">
                BONE BREAKER AI COACH
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#181211] text-[#E0262B] border border-[#E0262B]/40">
                WARRIOR MENTOR
              </span>
            </div>
            <p className="text-[11px] text-[#9A9DA1]">
              Personalized counsel grounded in your live habits, tasks & streaks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181211] hover:bg-[#2c2220] text-[#9A9DA1] hover:text-[#EDEFF1] border border-[#382d2a] text-xs font-bold font-warrior transition clip-angular-sm disabled:opacity-50"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLEAR CHAT</span>
          </button>
        </div>
      </div>

      {/* Missing API Key Warning Callout if applicable */}
      {!hasKey && (
        <div className="bg-[#281313] border border-[#E0262B] p-3 clip-angular shrink-0 mb-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#EDEFF1]">
            <Key className="w-4 h-4 text-[#E0262B] shrink-0" />
            <span>
              <strong className="text-[#E0262B]">Gemini API Key Required:</strong> To enable direct AI Coach counsel, save your Gemini API key in Armory (Settings).
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('settings');
            }}
            className="shrink-0 bg-[#E0262B] hover:bg-[#c01d22] text-white px-3 py-1 font-bold font-warrior clip-angular-sm glow-red"
          >
            OPEN SETTINGS
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto bg-[#181211] border border-[#382d2a] p-4 space-y-4 clip-angular">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="shrink-0 w-8 h-8 rounded bg-[#231b19] border border-[#382d2a] flex items-center justify-center text-[#E0262B]">
                  <SkullLogo size={24} glow={false} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-xl p-3.5 text-xs sm:text-sm leading-relaxed clip-angular ${
                  isUser
                    ? 'bg-[#E0262B] text-white font-medium ml-4'
                    : 'bg-[#231b19] text-[#EDEFF1] border border-[#382d2a] mr-4 whitespace-pre-wrap'
                }`}
              >
                {/* Sender badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5 text-[10px] opacity-75 font-mono">
                  <span>{isUser ? 'YOU' : 'AI COACH'}</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="prose prose-invert max-w-none">
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-[#E0262B] animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Analyzing battlefield intel...
                    </span>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="shrink-0 w-8 h-8 rounded bg-[#2c2220] border border-[#382d2a] flex items-center justify-center text-[#EDEFF1]">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Row */}
      <div className="shrink-0 pt-2 pb-1 overflow-x-auto">
        <div className="flex items-center gap-2">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isStreaming}
              className="shrink-0 bg-[#231b19] hover:bg-[#2c2220] text-[#EDEFF1] border border-[#382d2a] hover:border-[#E0262B]/50 px-3 py-1.5 text-xs font-semibold font-warrior transition clip-angular-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#E0262B]" />
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box */}
      <div className="shrink-0 mt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#231b19] border border-[#382d2a] p-2 clip-angular focus-within:border-[#E0262B] transition"
        >
          <input
            type="text"
            placeholder={
              hasKey
                ? 'Seek tactical advice, schedule breakdown, or mental discipline...'
                : 'Configure API key in Settings to activate Coach, or ask question...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isStreaming}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#EDEFF1] placeholder-[#9A9DA1] outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="bg-[#E0262B] hover:bg-[#c01d22] disabled:opacity-40 text-white px-4 py-2 font-bold font-warrior text-xs transition glow-red clip-angular-sm flex items-center gap-1.5"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>TRANSMIT</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
