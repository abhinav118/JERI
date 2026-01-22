import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronDown, Loader2, Bot, User } from 'lucide-react';
import { companions } from '../agents/companions';
import { Companion, ChatMessage, AgentStatus } from '../types';
import { PureMultimodalInput, type Attachment } from './ui/multimodal-ai-chat-input';

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = useCallback(({ input }: { input: string; attachments: Attachment[] }) => {
    if (input.trim()) {
      onSendMessage(input.trim());
    }
    setAttachments([]);
  }, [onSendMessage]);

  const handleStopGenerating = useCallback(() => {
    // Could implement stop functionality here
    console.log('Stop generating');
  }, []);

  if (!isOpen) return null;

  // Convert ChatMessages to UIMessage format for the input component
  const uiMessages = messages.map(m => ({
    id: m.id,
    content: m.content,
    role: m.role,
  }));

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-browser-bg border-l border-browser-surface flex flex-col z-50">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between p-3 border-b border-browser-surface">
        {/* Agent Dropdown */}
        <div className="relative flex-1 mr-2" ref={dropdownRef}>
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-browser-surface rounded-lg shadow-lg border border-browser-surface/50 overflow-hidden z-50 max-h-64 overflow-y-auto">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-browser-surface flex items-center justify-center mb-4">
              <span className="text-3xl">{selectedCompanion?.avatar || '🤖'}</span>
            </div>
            <h3 className="text-lg font-semibold text-browser-text mb-2">
              {selectedCompanion?.name || 'JERI'}
            </h3>
            <p className="text-sm text-browser-subtext mb-4">
              I can see the current page and help you with browsing tasks. Ask me anything!
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[
                'What is this page about?',
                'Find the main content',
                'Summarize this page',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(suggestion)}
                  className="text-left px-3 py-2 bg-browser-surface hover:bg-browser-surface/80 rounded-lg text-sm text-browser-text transition-colors"
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
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-browser-accent' : 'bg-browser-surface'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-browser-bg" />
                  ) : (
                    <span className="text-sm">{selectedCompanion?.avatar || '🤖'}</span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-browser-accent text-browser-bg rounded-tr-sm'
                      : 'bg-browser-surface text-browser-text rounded-tl-sm'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
        <div className="px-3 py-2 bg-browser-surface/30 border-t border-browser-surface">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-browser-accent" />
            <span className="text-xs text-browser-subtext truncate">{agentStatus.thought}</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-browser-surface">
        <PureMultimodalInput
          chatId="sidebar-chat"
          messages={uiMessages}
          attachments={attachments}
          setAttachments={setAttachments}
          onSendMessage={handleSendMessage}
          onStopGenerating={handleStopGenerating}
          isGenerating={agentStatus.isRunning}
          canSend={!agentStatus.isRunning}
          placeholder={`Ask ${selectedCompanion?.name || 'JERI'}...`}
        />
      </div>
    </div>
  );
}
