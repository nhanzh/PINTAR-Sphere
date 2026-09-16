import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types.ts';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Code2,
  Atom,
  Flame,
} from 'lucide-react';

interface AiAssistantViewProps {
  user: UserProfile;
  initialPrompt?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  user,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello ${user.name}! I am your PINTAR AI Study Mentor for UKM ASASIpintar. I can assist you with step-by-step solutions in Chemistry I (kinetics, thermodynamics, equilibrium), Physics I (vectors, torque, SHM), Biology I, Statistics (probability, distributions), Logical Reasoning, or guide your Semester 1 GPA projections (2 best sciences + statistics). How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      setInputQuery(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: {
            userName: user.name,
            role: user.role,
            setNumber: user.setNumber,
            taughtSubject: user.taughtSubjectName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Here is the step-by-step academic explanation for your query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.warn('AI Chat API fallback:', err);
      // Helpful contextual academic fallback
      const fallbackReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `### Academic Solution Summary:
Here is the official breakdown:
1. **Core Concept**: For ASASIpintar foundation courses, always state fundamental definitions before applying formulas.
2. **Formula Application**:
   - In Chemistry (PNAP0133): Remember $K_c = \\frac{[\\text{Products}]^p}{[\\text{Reactants}]^r}$.
   - In Physics (PNAP0123): Period of simple harmonic motion is $T = 2\\pi \\sqrt{\\frac{m}{k}}$.
   - In Statistics (PNAP0154): Always calculate the z-score via $Z = \\frac{X - \\mu}{\\sigma}$.
3. **Semester 1 GPA Rule**: Remember that only your **2 best sciences + Statistics** contribute to your official GPA, so optimize your highest marks!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'How is the Sem 1 GPA calculated using the 2 best sciences rule?',
    'Explain how to calculate equilibrium constant Kc with an ICE table in Chemistry I',
    'Derive the period formula for a mass-spring system in Physics I',
    'Provide a practice problem on standard normal distribution Z-scores',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Powered by Gemini & UKM ASASIpintar Syllabus
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Academic Tutor (English)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            PINTAR AI Study Mentor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Specialized academic intelligence tuned for UKM Pre-University foundation coursework, past years, and GPA optimization.
          </p>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'msg-init',
                sender: 'assistant',
                text: 'Chat history cleared. How can I assist your study session today?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          title="Reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-medium text-slate-700 hover:text-indigo-700 whitespace-nowrap transition-colors shadow-2xs"
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[550px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-tr from-indigo-700 to-cyan-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{m.text}</div>
                  <div
                    className={`mt-1.5 text-[10px] font-mono ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 italic">
                PINTAR AI is analyzing UKM syllabus and formulating academic solution...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about Chemistry, Physics, Biology, Statistics, or Sem 1 GPA rules..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
