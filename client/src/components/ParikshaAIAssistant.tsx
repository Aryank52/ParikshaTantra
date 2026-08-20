import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: { title: string; type: string }[];
  suggestedActions?: { label: string; actionCode: string }[];
  toolExecuted?: string;
  isError?: boolean;
}

interface ParikshaAIAssistantProps {
  portalContext: 'STUDENT' | 'GOVERNMENT';
  onExecuteAction?: (actionCode: string) => void;
  isOpenDefault?: boolean;
}

export const ParikshaAIAssistant: React.FC<ParikshaAIAssistantProps> = ({
  portalContext,
  onExecuteAction,
  isOpenDefault = false,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialWelcomeText =
    portalContext === 'STUDENT'
      ? `Namaste! I am **Pariksha AI**, your national examination candidate assistant. Ask me about your application status, admit card, exam eligibility, centre guidelines, or hardware diagnostic checks.`
      : `Greetings ${user?.role || 'Authority'}! I am **Pariksha AI Operations Copilot**. Ask me about centre readiness, active exam status, SOC threat telemetry, or audit ledger Merkle roots.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [{ title: 'ParikshaTantra AI Policy', type: 'SYSTEM' }],
      suggestedActions:
        portalContext === 'STUDENT'
          ? [
              { label: 'Application Status', actionCode: 'NAVIGATE_APPLICATIONS' },
              { label: 'Device Check', actionCode: 'RUN_DEVICE_CHECK' },
              { label: 'Exams Catalog', actionCode: 'NAVIGATE_CATALOG' },
            ]
          : [
              { label: 'Centre Readiness', actionCode: 'NAVIGATE_CENTRES' },
              { label: 'SOC Security', actionCode: 'NAVIGATE_SOC' },
              { label: 'Audit Ledger', actionCode: 'NAVIGATE_AUDIT' },
            ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          portalContext,
          userRole: user?.role || 'CANDIDATE',
          userId: user?.id,
          userEmail: user?.email,
          candidateCode: user?.candidateCode,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.data.sources,
          suggestedActions: data.data.suggestedActions,
          toolExecuted: data.data.toolExecuted,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Failed to fetch AI response');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `I encountered an issue processing your query: ${err.message || 'Network connectivity drop'}. Operating in verified rule fallback mode.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        sources: [{ title: 'System Diagnostics', type: 'SYSTEM' }],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'Conversation history reset. How can I assist your examination operations today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
            portalContext === 'STUDENT'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider uppercase">
            {portalContext === 'STUDENT' ? 'Ask Pariksha AI' : 'AI Copilot'}
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all flex flex-col bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden ${
            isExpanded
              ? 'top-6 bottom-6 left-6 right-6 md:left-24 md:right-24'
              : 'bottom-6 right-6 w-full max-w-md h-[560px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b border-slate-800 ${
              portalContext === 'STUDENT'
                ? 'bg-slate-900/90 text-blue-300'
                : 'bg-slate-900/90 text-emerald-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded ${
                  portalContext === 'STUDENT' ? 'bg-blue-950 border border-blue-500/30 text-blue-400' : 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-sm font-bold text-slate-100">PARIKSHA AI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 border border-slate-700 text-amber-400">
                    {portalContext === 'STUDENT' ? 'STUDENT HELP' : 'ADMIN COPILOT'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Role-Aware Examination Operations Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={clearChat}
                title="Clear Conversation"
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Compress Drawer' : 'Expand Fullscreen'}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close AI Assistant"
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-slate-950/95">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 space-y-2 border ${
                    msg.sender === 'user'
                      ? 'bg-blue-950/70 border-blue-600/40 text-slate-100 rounded-br-none'
                      : msg.isError
                      ? 'bg-red-950/40 border-red-500/40 text-red-200 rounded-bl-none'
                      : 'bg-slate-900 border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between space-x-2 text-[10px] text-slate-400 pb-1 border-b border-slate-800/60 font-mono">
                    <span className="font-semibold text-slate-300">
                      {msg.sender === 'user' ? 'You' : 'Pariksha AI'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                    {msg.text}
                  </div>

                  {/* Tool execution badge if applicable */}
                  {msg.toolExecuted && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Tool: {msg.toolExecuted}</span>
                    </div>
                  )}

                  {/* Sources / Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Sources & References:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 text-[10px] bg-slate-950 border border-slate-700/80 px-2 py-0.5 rounded text-blue-300 font-mono"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                            <span>{src.title}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => onExecuteAction && onExecuteAction(act.actionCode)}
                          className="text-[10px] font-mono bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/40 text-blue-200 px-2.5 py-1 rounded transition-colors"
                        >
                          {act.label} →
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Copy Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-mono"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Evaluating Pariksha AI verified knowledge base...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            {/* Quick Prompt Suggestions */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-slate-400 scrollbar-none">
              <span className="text-slate-500 flex-shrink-0">Prompts:</span>
              {portalContext === 'STUDENT' ? (
                <>
                  <button
                    onClick={() => handleSendMessage('What is my application status?')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    Check Application
                  </button>
                  <button
                    onClick={() => handleSendMessage('Is my admit card ready?')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    Admit Card
                  </button>
                  <button
                    onClick={() => handleSendMessage('How to test camera and mic?')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    Device Diagnostic
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendMessage('Show centre readiness overview')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    Centre Readiness
                  </button>
                  <button
                    onClick={() => handleSendMessage('Show active security threats')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    SOC Threats
                  </button>
                  <button
                    onClick={() => handleSendMessage('Explain activation token derivation')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded flex-shrink-0 border border-slate-700"
                  >
                    Activation Token
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  portalContext === 'STUDENT'
                    ? 'Ask about exams, admit card, rules...'
                    : 'Query system telemetry, audit, readiness...'
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className={`p-2 rounded font-semibold transition-colors ${
                  portalContext === 'STUDENT'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
