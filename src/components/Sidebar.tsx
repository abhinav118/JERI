import { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronDown, Loader2 } from 'lucide-react';
import { companions } from '../agents/companions';
import { Companion, ChatMessage, AgentStatus } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompanion: Companion | null;
  onSelectCompanion: (companion: Companion) => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  agentStatus: AgentStatus;
}

export default function Sidebar({
  isOpen,
  onClose,
  selectedCompanion,
  onSelectCompanion,
  messages,
  onSendMessage,
  agentStatus,
}: SidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !agentStatus.isRunning) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 sidebar flex flex-col animate-slide-in-right z-50">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between p-3 border-b border-browser-surface">
        {/* Agent Dropdown */}
        <div className="relative flex-1 mr-2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-browser-surface rounded-lg hover:bg-browser-surface/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCompanion?.avatar || '🤖'}</span>
              <span className="font-medium text-browser-text text-sm">
                {selectedCompanion?.name || 'Select Agent'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-browser-subtext transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-browser-surface rounded-lg shadow-lg border border-browser-surface/50 overflow-hidden z-50">
              {companions.map((companion) => (
                <button
                  key={companion.id}
                  onClick={() => {
                    onSelectCompanion(companion);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-browser-accent/20 transition-colors text-left ${
                    selectedCompanion?.id === companion.id ? 'bg-browser-accent/10' : ''
                  }`}
                >
                  <span className="text-lg">{companion.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-browser-text">{companion.name}</div>
                    <div className="text-xs text-browser-subtext truncate">{companion.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-browser-surface transition-colors"
        >
          <X className="w-5 h-5 text-browser-subtext" />
        </button>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">{selectedCompanion?.avatar || '🤖'}</span>
            <p className="text-sm text-browser-subtext">
              Hi! I'm {selectedCompanion?.name || 'JERI'}. I can see the current page and help you with browsing tasks.
            </p>
            <p className="text-xs text-browser-subtext mt-2">
              Ask me anything about this page or tell me what you'd like to do.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-browser-accent text-white'
                    : 'bg-browser-surface text-browser-text'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Agent status indicator */}
      {agentStatus.isRunning && agentStatus.thought && (
        <div className="px-3 py-2 bg-browser-surface/50 border-t border-browser-surface">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-browser-accent" />
            <span className="text-xs text-browser-subtext truncate">{agentStatus.thought}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-browser-surface">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${selectedCompanion?.name || 'JERI'}...`}
            disabled={agentStatus.isRunning}
            className="flex-1 bg-browser-surface text-browser-text placeholder-browser-subtext px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-browser-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || agentStatus.isRunning}
            className="p-2 bg-browser-accent text-white rounded-lg hover:bg-browser-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
