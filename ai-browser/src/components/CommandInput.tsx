import { useState, KeyboardEvent } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Companion } from '../types';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isRunning: boolean;
  companion: Companion | null;
  currentThought?: string;
}

export default function CommandInput({
  onSubmit,
  isRunning,
  companion,
  currentThought,
}: CommandInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isRunning || !companion) return;
    onSubmit(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = companion
    ? `Ask ${companion.name} to do something...`
    : 'Select a companion to get started';

  return (
    <div className="border-t border-browser-surface bg-browser-bg p-4 no-drag">
      {/* Thinking indicator */}
      {isRunning && currentThought && (
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-browser-accent thinking-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-browser-accent thinking-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-browser-accent thinking-dot" />
          </div>
          <span className="text-sm text-browser-subtext truncate">{currentThought}</span>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-3">
        {companion && (
          <div className="flex items-center gap-2 px-3 py-2 bg-browser-surface rounded-lg">
            <span className="text-lg">{companion.avatar}</span>
            <span className="text-sm text-browser-text">{companion.name}</span>
          </div>
        )}

        <div className="flex-1 flex items-center bg-browser-surface rounded-lg px-4 py-2">
          <Sparkles className="w-4 h-4 text-browser-accent mr-3 flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isRunning || !companion}
            className="flex-1 bg-transparent text-browser-text placeholder-browser-subtext outline-none disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isRunning || !companion || !input.trim()}
          className={`
            p-3 rounded-lg transition-colors flex items-center justify-center
            ${
              isRunning || !companion || !input.trim()
                ? 'bg-browser-surface text-browser-subtext cursor-not-allowed'
                : 'bg-browser-accent text-browser-bg hover:bg-browser-accent/90'
            }
          `}
        >
          {isRunning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Quick suggestions when no companion selected */}
      {!companion && (
        <p className="text-xs text-browser-subtext mt-3 text-center">
          Click "Agents" in the top right to select an AI companion
        </p>
      )}
    </div>
  );
}
