import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
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
  const { lang, dict } = useLanguage();

  const getInitialGreeting = () => {
    if (lang === 'ms') {
      return `Salam sejahtera ${user.name}! Saya Pembimbing Akademik Pintar AI untuk UKM ASASIpintar. Saya boleh membantu dengan soalan Kimia I, Fizik I, Biologi I, Statistik, Penaakulan Logik, atau unjuran GPA Semester 1 (dasar 2 sains terbaik + statistik). Ada apa yang boleh saya bantu hari ini?`;
    }
    if (lang === 'zh') {
      return `您好 ${user.name}！我是 UKM ASASIpintar 的 PINTAR AI 学习导师。我可以协助解答化学 I、物理 I、生物 I、统计学、逻辑推理或第一学期 GPA 预测（2门最佳理科 + 统计学）。请问今天有什么可以帮您的？`;
    }
    return `Hello ${user.name}! I am your PINTAR AI Study Mentor for UKM ASASIpintar. I can assist you with step-by-step solutions in Chemistry I (kinetics, thermodynamics, equilibrium), Physics I (vectors, torque, SHM), Biology I, Statistics (probability, distributions), Logical Reasoning, or guide your Semester 1 GPA projections (2 best sciences + statistics). How can I help you today?`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: getInitialGreeting(),
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
          language: lang,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
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
        text: data.reply || (lang === 'zh' ? '这是根据您的提问逐步解答的学术方案。' : lang === 'ms' ? 'Berikut ialah penyelesaian akademik langkah demi langkah untuk pertanyaan anda.' : 'Here is the step-by-step academic explanation for your query.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.warn('AI Chat API fallback:', err);
      // Helpful contextual academic fallback in requested language
      let fallbackText = '';
      if (lang === 'zh') {
        fallbackText = `### 学术解答总结：
以下是官方要点解析：
1. **核心概念**：对于 ASASIpintar 预科课程，在应用公式之前务必先明确基本定义。
2. **公式应用**：
   - 化学 (PNAP0133)：记住 $K_c = \\frac{[\\text{生成物}]^p}{[\\text{反应物}]^r}$。
   - 物理 (PNAP0123)：简谐运动周期 $T = 2\\pi \\sqrt{\\frac{m}{k}}$。
   - 统计学 (PNAP0154)：使用 $Z = \\frac{X - \\mu}{\\sigma}$ 计算标准分。
3. **第一学期 GPA 准则**：仅 **成绩最高的2门理科 + 统计学** 计算入官方 GPA，请重点把握优势科目！`;
      } else if (lang === 'ms') {
        fallbackText = `### Ringkasan Penyelesaian Akademik:
Berikut merupakan panduan rasmi:
1. **Konsep Teras**: Untuk kursus asas ASASIpintar, sentiasa nyatakan takrifan asas sebelum menggunakan formula.
2. **Penggunaan Formula**:
   - Kimia (PNAP0133): Ingat $K_c = \\frac{[\\text{Hasil}]^p}{[\\text{Bahan Tindak Balas}]^r}$.
   - Fizik (PNAP0123): Tempoh getaran harmonik mudah $T = 2\\pi \\sqrt{\\frac{m}{k}}$.
   - Statistik (PNAP0154): Sentiasa kira skor-z melalui $Z = \\frac{X - \\mu}{\\sigma}$.
3. **Dasar GPA Semester 1**: Hanya **2 subjek sains terbaik + Statistik** dikira dalam GPA rasmi anda, optimumkan markah tertinggi anda!`;
      } else {
        fallbackText = `### Academic Solution Summary:
Here is the official breakdown:
1. **Core Concept**: For ASASIpintar foundation courses, always state fundamental definitions before applying formulas.
2. **Formula Application**:
   - In Chemistry (PNAP0133): Remember $K_c = \\frac{[\\text{Products}]^p}{[\\text{Reactants}]^r}$.
   - In Physics (PNAP0123): Period of simple harmonic motion is $T = 2\\pi \\sqrt{\\frac{m}{k}}$.
   - In Statistics (PNAP0154): Always calculate the z-score via $Z = \\frac{X - \\mu}{\\sigma}$.
3. **Semester 1 GPA Rule**: Remember that only your **2 best sciences + Statistics** contribute to your official GPA, so optimize your highest marks!`;
      }

      const fallbackReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = lang === 'zh'
    ? [
        '第一学期 2门最佳理科 GPA 规则是如何计算的？',
        '解释化学 I 中如何使用 ICE 表计算平衡常数 Kc',
        '推导物理 I 中弹簧振子的周期公式',
        '提供一道标准正态分布 Z 值的练习题',
      ]
    : lang === 'ms'
    ? [
        'Bagaimanakah GPA Sem 1 dikira menggunakan peraturan 2 sains terbaik?',
        'Terangkan cara mengira pemalar keseimbangan Kc dengan jadual ICE dalam Kimia I',
        'Terbitkan formula tempoh bagi sistem jisim-spring dalam Fizik I',
        'Sediakan soalan latihan mengenai skor Z taburan normal piawai',
      ]
    : [
        'How is the Sem 1 GPA calculated using the 2 best sciences rule?',
        'Explain how to calculate equilibrium constant Kc with an ICE table in Chemistry I',
        'Derive the period formula for a mass-spring system in Physics I',
        'Provide a practice problem on standard normal distribution Z-scores',
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              {dict.aiAssistantBadge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              UKM ASASIpintar
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {dict.aiAssistantTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.aiAssistantDesc}
          </p>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'msg-init',
                sender: 'assistant',
                text: getInitialGreeting(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[550px] overflow-hidden">
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
                      : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{m.text}</div>
                  <div
                    className={`mt-1.5 text-[10px] font-mono ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400 dark:text-slate-500'
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
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 italic">
                {dict.aiThinkingText}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={dict.askAiPlaceholder}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{dict.sendAiPrompt}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
