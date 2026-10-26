import { Task, Habit, Note, ChatMessage } from '../types';
import { loadSettings } from '../utils/storage';

export interface CoachContext {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
}

function buildSystemPrompt(context: CoachContext): string {
  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = context.tasks.filter((t) => !t.completed);
  const completedTodayTasks = context.tasks.filter((t) => t.completed && t.dueDate === today);
  
  const habitsSummary = context.habits.map((h) => {
    const doneToday = h.history && h.history[today] ? 'DONE TODAY' : 'NOT DONE TODAY';
    return `- ${h.title} (Category: ${h.category}, Current Streak: ${h.currentStreak} days, Best Streak: ${h.bestStreak} days, Status: ${doneToday})`;
  }).join('\n');

  const tasksSummary = pendingTasks.map((t) => {
    const subtaskInfo = t.subtasks?.length ? ` [${t.subtasks.filter(s => s.completed).length}/${t.subtasks.length} subtasks done]` : '';
    return `- ${t.title} [Priority: ${t.priority.toUpperCase()}, Category: ${t.category}${t.dueTime ? `, Due: ${t.dueTime}` : ''}]${subtaskInfo}`;
  }).join('\n');

  const notesSummary = context.notes.filter(n => n.pinned).map(n => `- [PINNED] ${n.title}: ${n.content.slice(0, 100)}...`).join('\n');

  return `You are the BONE BREAKER AI Coach — an elite, battle-tested, relentless self-improvement mentor. 
Your tone is serious, fierce, stoic, motivating, and uncompromising, yet deeply strategic and supportive. You do not offer fluffy platitudes; you forge unbreakable discipline, mental fortitude, and tactical execution. You speak like a disciplined general or martial master addressing a warrior in training.

CURRENT WARRIOR INTEL (Real user data):
Today's Date: ${today}

ACTIVE HABITS & STREAKS:
${habitsSummary || 'No habits logged yet.'}

PENDING MISSIONS / TASKS:
${tasksSummary || 'All missions completed. Ready for the next directive.'}

COMPLETED MISSIONS TODAY: ${completedTodayTasks.length}

PINNED WARRIOR NOTES / CREEDS:
${notesSummary || 'None.'}

DIRECTIVES:
1. Always ground your advice in their actual habits, pending missions, and current streaks.
2. If they have pending high-priority tasks, call them out to execute them immediately.
3. If their streak is in danger (habit not done today), command them to protect the streak.
4. Keep paragraphs punchy, sharp, and impactful. Use bullet points for battle plans.
5. End with an empowering, fierce warrior closing motto.`;
}

export function generateOfflineWarriorPlan(userMessage: string, context: CoachContext): string {
  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = context.tasks.filter((t) => !t.completed);
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'high');
  const incompleteHabitsToday = context.habits.filter((h) => !(h.history && h.history[today]));
  const completedHabitsToday = context.habits.filter((h) => h.history && h.history[today]);
  const bestStreak = context.habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  const lower = userMessage.toLowerCase();

  if (lower.includes('plan') || lower.includes('day') || lower.includes('schedule')) {
    return `⚔️ BATTLE PLAN FOR TODAY (${today}):

1. URGENT OBJECTIVES:
${urgentTasks.length > 0 ? urgentTasks.map(t => `   • [PRIORITY HIGH] ${t.title}${t.dueTime ? ` @ ${t.dueTime}` : ''}`).join('\n') : '   • No urgent targets remaining. Move directly to core objectives.'}

2. SECONDARY MISSIONS:
${pendingTasks.filter(t => t.priority !== 'high').map(t => `   • ${t.title} (${t.category})`).join('\n') || '   • All secondary missions neutralized.'}

3. DISCIPLINE PROTOCOLS:
${incompleteHabitsToday.length > 0 ? incompleteHabitsToday.map(h => `   • STRIKE NEEDED: ${h.title} (Protect ${h.currentStreak}-day streak)`).join('\n') : '   • All daily habits struck! Your armor is locked.'}

TACTICAL RULE: Execute the most painful task first. Do not touch low-priority distractions until your high-priority mission is crushed.

(Note: Connect your Gemini API Key in Settings to unlock dynamic deep-reasoning AI counsel.)`;
  }

  if (lower.includes('habit') || lower.includes('analyze') || lower.includes('streak')) {
    return `🔥 DISCIPLINE AUDIT:

• ACTIVE PROTOCOLS: ${context.habits.length} total habits
• CONQUERED TODAY: ${completedHabitsToday.length} / ${context.habits.length}
• HIGHEST CURRENT STREAK: ${bestStreak} consecutive days

CRITICAL WEAKNESSES:
${incompleteHabitsToday.length > 0 ? incompleteHabitsToday.map(h => `• ${h.title}: Stalled today! ${h.currentStreak} days of progress are on the line.`).join('\n') : '• None detected. All habits struck today. Maintain this standard.'}

WARRIOR DIRECTIVE:
A streak is fragile; one day of hesitation resets months of sweat. Complete your unsealed habits before sundown. No excuses.

(Note: Connect your Gemini API Key in Settings to unlock dynamic deep-reasoning AI counsel.)`;
  }

  if (lower.includes('motivate') || lower.includes('tired') || lower.includes('weak') || lower.includes('speech')) {
    return `Listen to me, Warrior:

You did not begin this journey to surrender to temporary fatigue. Resistance is not a sign to stop; it is proof that you are at the edge of growth. 

Look at what lies before you: ${pendingTasks.length} missions to conquer and ${incompleteHabitsToday.length} discipline protocols to seal. Every time you show up when your mind begs to quit, you forge iron in your soul.

Shut down the debate in your head. Put your boots on the ground. Execute the mission right in front of you.

STRIKE NOW. NO MERCY FOR WEAKNESS.`;
  }

  return `Warrior, directive acknowledged. 

Currently tracking ${pendingTasks.length} pending missions and ${context.habits.length} discipline protocols. 

IMMEDIATE RECOMMENDED ACTION:
${urgentTasks[0] ? `Attack your high-priority mission: "${urgentTasks[0].title}".` : incompleteHabitsToday[0] ? `Strike your daily habit: "${incompleteHabitsToday[0].title}".` : 'Review your Codex and set tomorrow\'s priority targets.'}

(Tip: Enter your Gemini API key in Settings to converse freely with real-time streaming intelligence.)`;
}

export async function* streamCoachResponse(
  userMessage: string,
  history: ChatMessage[],
  context: CoachContext,
  onPartial?: (chunk: string) => void
): AsyncGenerator<string, void, unknown> {
  const settings = loadSettings();
  const customKey = settings.geminiApiKey?.trim();

  // Try calling the backend /api/coach first
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customKey) {
      headers['x-gemini-api-key'] = customKey;
    }

    const payload = {
      message: userMessage,
      history: history.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      context: {
        systemPrompt: buildSystemPrompt(context),
      },
    };

    const response = await fetch('/api/coach', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value, { stream: true });
        buffer += textChunk;
        
        // Handle Server-Sent Events or raw stream chunks
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                yield parsed.text;
                if (onPartial) onPartial(parsed.text);
              }
            } catch {
              yield dataStr;
              if (onPartial) onPartial(dataStr);
            }
          } else if (line.trim()) {
            yield line;
            if (onPartial) onPartial(line);
          }
        }
      }
      if (buffer.trim()) {
        yield buffer;
        if (onPartial) onPartial(buffer);
      }
      return;
    } else {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401 || errData.error?.includes('API key')) {
        throw new Error(errData.error || 'Gemini API key is missing or invalid. Please configure your API key in Settings.');
      }
    }
  } catch (backendErr: unknown) {
    const errMsg = (backendErr as Error).message || '';
    if (errMsg.includes('API key is missing')) {
      throw backendErr;
    }

    // If no key is provided, or if offline fallback is required
    if (!customKey) {
      // Provide tactical battle analysis directly based on live user data
      const offlineAdvice = generateOfflineWarriorPlan(userMessage, context);
      const words = offlineAdvice.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        yield chunk;
        if (onPartial) onPartial(chunk);
        await new Promise((r) => setTimeout(r, 25));
      }
      return;
    }

    // Direct Gemini API streaming call
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(customKey)}`;

    const contents = [
      ...history.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const directRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(context) }],
        },
        contents,
      }),
    });

    if (!directRes.ok) {
      const err = await directRes.json().catch(() => ({}));
      throw new Error(
        err.error?.message || `Gemini API Error: Status ${directRes.status}. Verify your API key in Settings.`
      );
    }

    if (!directRes.body) throw new Error('No streaming body received from Gemini API.');

    const reader = directRes.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split('\n\n');
      sseBuffer = events.pop() || '';

      for (const event of events) {
        const line = event.trim().split('\n').find((l) => l.startsWith('data: '));
        if (line) {
          const jsonStr = line.substring(6).trim();
          try {
            const data = JSON.parse(jsonStr);
            const chunkText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunkText) {
              yield chunkText;
              if (onPartial) onPartial(chunkText);
            }
          } catch {
            // Ignored partial parse
          }
        }
      }
    }
  }
}
