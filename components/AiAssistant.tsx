
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Minimize2, MessageCircle } from 'lucide-react';
import { getTaxAdvice } from '../services/gemini';
import { useTds } from '../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistant: React.FC = () => {
  const { settings } = useTds();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Hello! I am your TDS Tax Assistant. Ask me anything about sections, rates, or filing rules.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await getTaxAdvice(userMsg.content, settings?.gemini_api_key);
      const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: "Sorry, I encountered an error connecting to the AI service." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-all z-50 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4"
          aria-label="Open Tax Assistant"
        >
          <Bot size={28} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium pl-0 group-hover:pl-2">Tax Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex justify-between items-center shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Tax Consultant</h3>
                <p className="text-[10px] text-brand-100 opacity-90">Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-brand-700 p-1.5 rounded-lg transition text-brand-100 hover:text-white"
              aria-label="Minimize Chat"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                    }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-brand-600" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about TDS rates, sections..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="bg-brand-600 text-white p-2.5 rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              AI advice can be inaccurate. Please verify with official sources.
            </div>
          </form>
        </div>
      )}
    </>
  );
};
