'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Bot,
  User as UserIcon,
  ChevronDown,
  Info,
} from 'lucide-react';
import { DisruptionChatMessage } from '@/types';

interface DisruptionAssistantChatProps {
  activeHazardsCount?: number;
}

export default function DisruptionAssistantChat({
  activeHazardsCount = 0,
}: DisruptionAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<DisruptionChatMessage[]>([
    {
      id: 'welcome-01',
      sender: 'assistant',
      text: "Hello! I am the **Northeast Logistics Emergency Assistant**. I am strictly bounded to verified government road disruption reports (BRO, ASDMA, NHAI, State Police). Ask me about real-time road conditions, landslides, or flood blockages across Northeast India.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Listen for quick inquiries from Disruption Cards
  useEffect(() => {
    const handleAskEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail?.query) {
        setIsOpen(true);
        setTimeout(() => {
          handleSendMessage(customEvent.detail.query);
        }, 100);
      }
    };
    window.addEventListener('ask-disruption-assistant', handleAskEvent);
    return () => window.removeEventListener('ask-disruption-assistant', handleAskEvent);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || isLoading) return;

    const userMsg: DisruptionChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat-disruptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botMsg: DisruptionChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No active government-reported disruptions are recorded for this corridor.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
        active_hazards_count: data.active_hazards_count,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: DisruptionChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to reach the Disruption Intelligence Engine. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-01',
        sender: 'assistant',
        text: "Chat cleared. I am ready to evaluate any corridor or highway status against active government reports.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const promptChips = [
    'Is NH-29 safe to travel right now?',
    'Which corridors have active landslides?',
    'List all critical road disruptions',
    'Are there any flash flood alerts in Barak Valley?',
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[9998] flex items-center">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-4 py-3 rounded-full shadow-xl shadow-cyan-900/30 hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-cyan-400/40"
            aria-label="Open Disruption Intelligence Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 animate-pulse text-cyan-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                AI Road Advisor
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-[10px] text-cyan-100 font-medium">
                Live Government Grounded
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[92vw] sm:w-[420px] h-[540px] max-h-[85vh] bg-[#070e1c]/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100">
                    Disruption AI Advisor
                  </h3>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    Strict Grounding
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Zero Hallucination • {activeHazardsCount} Live Radar Alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Banner */}
          <div className="bg-amber-950/40 px-3.5 py-1.5 border-b border-amber-900/40 flex items-center gap-1.5 text-[10px] text-amber-300 font-mono">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Strictly grounded to BRO, ASDMA, NHAI, & Police entries.</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-[#040812]/70 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {/* Basic Markdown rendering for bold text */}
                    {m.text.split('\n').map((line, idx) => {
                      // Format bold tokens
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                          {parts.map((p, pIdx) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                              return (
                                <strong
                                  key={pIdx}
                                  className={
                                    m.sender === 'user'
                                      ? 'font-bold'
                                      : 'font-bold text-cyan-300'
                                  }
                                >
                                  {p.slice(2, -2)}
                                </strong>
                              );
                            }
                            if (p.startsWith('*') && p.endsWith('*')) {
                              return <em key={pIdx}>{p.slice(1, -1)}</em>;
                            }
                            return p;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Citations Badges */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700 flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        Source:
                      </span>
                      {m.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[9px] bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-right opacity-60 font-mono">
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-400 text-xs font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Evaluating verified database records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className="whitespace-nowrap text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-full transition font-medium shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about highway status, landslides..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !query.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md shadow-cyan-600/30 transition"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
