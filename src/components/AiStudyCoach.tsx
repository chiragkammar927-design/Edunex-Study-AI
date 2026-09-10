import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SubjectType } from '../types';
import { askAiTutor } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface AiStudyCoachProps {
  initialSubject?: SubjectType;
  initialTopic?: string;
  onNavigateToPractice?: () => void;
}

export const AiStudyCoach: React.FC<AiStudyCoachProps> = ({
  initialSubject = 'Mathematics',
  initialTopic = 'Quadratic Equations',
  onNavigateToPractice,
}) => {
  const [subject, setSubject] = useState<SubjectType>(initialSubject);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! 👋 I'm your EduNex AI Study Coach. I'm here to break down tricky concepts, guide you step-by-step through tough problems, and make sure you retain what you learn for exams.\n\nWe're currently focusing on **${initialSubject}: ${initialTopic}**. How can I help you right now?`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'Explain Simply (ELI13)',
        'Give an Example',
        'Quiz Me',
        'Explain My Mistake',
        'Go Deeper',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, mode?: any) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectContext: subject,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const replyText = await askAiTutor(updatedMessages, subject, topic, mode);
      const assistantMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'Give an Example',
          'Quiz Me on this',
          'Explain Simply',
          'Go Deeper',
        ],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (mode: 'explain_simply' | 'give_example' | 'quiz_me' | 'explain_mistake' | 'go_deeper') => {
    let prompt = '';
    switch (mode) {
      case 'explain_simply':
        prompt = `Explain ${topic} in ${subject} simply, like I am 13 years old. Use a fun everyday analogy and zero complex jargon!`;
        break;
      case 'give_example':
        prompt = `Give me a clear, step-by-step worked practical example of ${topic} in ${subject} with full reasoning.`;
        break;
      case 'quiz_me':
        prompt = `Quiz me on ${topic} with a conceptual test question with 4 options to test my understanding!`;
        break;
      case 'explain_mistake':
        prompt = `What is the #1 mistake students make in ${topic} (${subject}), and how do I prevent it?`;
        break;
      case 'go_deeper':
        prompt = `Go deeper into ${topic}: What are the first principles, derivations, and advanced exam subtleties?`;
        break;
    }
    handleSendMessage(prompt, mode);
  };

  const toggleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`$]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please type your message.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-[#0c1222] rounded-2xl border border-blue-100/80 dark:border-blue-950/70 shadow-xs overflow-hidden">
      {/* Top Coach Header & Topic Selector */}
      <div className="p-4 border-b border-blue-100/80 dark:border-blue-950/70 bg-blue-50/40 dark:bg-[#10172a]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>EduNex AI Study Coach</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personalized explanations, mistake diagnosis & exam prep
            </p>
          </div>
        </div>

        {/* Context Subject / Topic Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectType)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131d33] border border-blue-200/80 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="Mathematics">📐 Mathematics</option>
            <option value="Physics">⚡ Physics</option>
            <option value="Chemistry">🧪 Chemistry</option>
            <option value="Biology">🧬 Biology</option>
            <option value="Computer Science">💻 Computer Science</option>
            <option value="History">🏛️ History</option>
            <option value="English">📖 English</option>
          </select>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Active Chapter/Topic..."
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131d33] border border-blue-200/80 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 w-36 sm:w-44 focus:outline-hidden"
          />

          <button
            onClick={() => {
              setMessages([
                {
                  id: `reset-${Date.now()}`,
                  sender: 'assistant',
                  text: `Fresh study session started for **${subject}: ${topic}**! What concept or question would you like to explore?`,
                  timestamp: 'Just now',
                },
              ]);
            }}
            title="Reset Conversation"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Prompt Shortcuts */}
      <div className="p-2.5 px-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100/60 dark:border-blue-900/30 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold text-blue-700 dark:text-cyan-300 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" /> Actions:
        </span>
        <button
          id="coach-action-eli13"
          onClick={() => handleQuickAction('explain_simply')}
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#131d33] border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition shrink-0 whitespace-nowrap"
        >
          💡 Explain Simply (ELI13)
        </button>
        <button
          id="coach-action-example"
          onClick={() => handleQuickAction('give_example')}
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition shrink-0 whitespace-nowrap"
        >
          🔍 Give an Example
        </button>
        <button
          id="coach-action-quiz"
          onClick={() => handleQuickAction('quiz_me')}
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition shrink-0 whitespace-nowrap"
        >
          📝 Quiz Me
        </button>
        <button
          id="coach-action-mistake"
          onClick={() => handleQuickAction('explain_mistake')}
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#131d33] border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 whitespace-nowrap"
        >
          ⚠️ Explain My Mistake
        </button>
        <button
          id="coach-action-deeper"
          onClick={() => handleQuickAction('go_deeper')}
          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[#131d33] border border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition shrink-0 whitespace-nowrap"
        >
          🚀 Go Deeper
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-blue-50/60 dark:bg-[#131d33] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-blue-100/80 dark:border-blue-900/40'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {msg.sender === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-blue-100/80 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => toggleSpeech(msg.text)}
                      className="hover:text-blue-600 dark:hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                      title="Read aloud"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'Mute' : 'Listen'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick follow-up suggestions */}
              {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSendMessage(p)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-[#131d33] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-[#131d33] rounded-tl-xs border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1">AI Coach is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-blue-100/80 dark:border-blue-950/70 bg-white dark:bg-[#0c1222]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={startVoiceInput}
            title={isListening ? 'Listening...' : 'Voice Dictation'}
            className={`p-2.5 rounded-xl border transition ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'text-slate-500 hover:text-blue-600 bg-slate-50 dark:bg-[#131d33] border-slate-200 dark:border-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${topic} or paste a problem...`}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#131d33] border border-blue-100 dark:border-blue-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
