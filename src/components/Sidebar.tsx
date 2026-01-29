import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Loader2, User, Send } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !agentStatus.isRunning) {
      console.log('Submitting message:', inputValue);
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  console.log('Sidebar render - messages:', messages.length, messages);

  return (
    <div
      className="absolute right-0 top-0 h-full w-80 flex flex-col z-50"
      style={{ backgroundColor: '#1e1e2e', borderLeft: '1px solid #313244' }}
    >
      {/* Header with dropdown */}
      <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid #313244' }}>
        {/* Agent Dropdown */}
        <div className="relative flex-1 mr-2" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#313244', color: '#cdd6f4' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCompanion?.avatar || '🤖'}</span>
              <span className="font-medium text-sm">
                {selectedCompanion?.name || 'Select Agent'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#a6adc8' }} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto"
              style={{ backgroundColor: '#313244', border: '1px solid #45475a' }}
            >
              {companions.map((companion) => (
                <button
                  key={companion.id}
                  onClick={() => {
                    onSelectCompanion(companion);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-opacity-80 transition-colors text-left"
                  style={{
                    backgroundColor: selectedCompanion?.id === companion.id ? 'rgba(137, 180, 250, 0.1)' : 'transparent',
                    color: '#cdd6f4'
                  }}
                >
                  <span className="text-lg">{companion.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{companion.name}</div>
                    <div className="text-xs truncate" style={{ color: '#a6adc8' }}>{companion.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-opacity-80 transition-colors"
          style={{ color: '#a6adc8' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#313244' }}
            >
              <span className="text-3xl">{selectedCompanion?.avatar || '🤖'}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#cdd6f4' }}>
              {selectedCompanion?.name || 'JERI'}
            </h3>
            <p className="text-sm mb-4" style={{ color: '#a6adc8' }}>
              I can see the current page and help you with browsing tasks.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[
                'What is this page about?',
                'Find the main content',
                'Summarize this page',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    console.log('Quick suggestion clicked:', suggestion);
                    onSendMessage(suggestion);
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#313244', color: '#cdd6f4' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: message.role === 'user' ? '#89b4fa' : '#313244' }}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" style={{ color: '#1e1e2e' }} />
                  ) : (
                    <span className="text-sm">{selectedCompanion?.avatar || '🤖'}</span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2"
                  style={{
                    backgroundColor: message.role === 'user' ? '#89b4fa' : '#313244',
                    color: message.role === 'user' ? '#1e1e2e' : '#cdd6f4',
                    borderTopRightRadius: message.role === 'user' ? '4px' : undefined,
                    borderTopLeftRadius: message.role === 'assistant' ? '4px' : undefined,
                    minWidth: '60px'
                  }}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content || '(empty response)'}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Agent status indicator */}
      {agentStatus.isRunning && agentStatus.thought && (
        <div className="px-3 py-2" style={{ backgroundColor: 'rgba(49, 50, 68, 0.5)', borderTop: '1px solid #313244' }}>
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#89b4fa' }} />
            <span className="text-xs truncate" style={{ color: '#a6adc8' }}>{agentStatus.thought}</span>
          </div>
        </div>
      )}

      {/* Simple input area */}
      <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid #313244' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask ${selectedCompanion?.name || 'JERI'}...`}
            disabled={agentStatus.isRunning}
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              backgroundColor: '#313244',
              color: '#cdd6f4',
              border: '1px solid #45475a'
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || agentStatus.isRunning}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#89b4fa', color: '#1e1e2e' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
