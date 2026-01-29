import { useState, useRef, KeyboardEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  X,
  Bot,
  Shield,
  Loader2,
  Settings,
} from 'lucide-react';
import { Tab } from '../types';

interface BrowserChromeProps {
  tabs: Tab[];
  activeTabId: string | null;
  currentUrl: string;
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onCreateTab: (url?: string) => void;
  onCloseTab: (id: string) => void;
  onSwitchTab: (id: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenSettings?: () => void;
}

export default function BrowserChrome({
  tabs,
  activeTabId,
  currentUrl,
  isLoading,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onCreateTab,
  onCloseTab,
  onSwitchTab,
  onToggleSidebar,
  isSidebarOpen,
  onOpenSettings,
}: BrowserChromeProps) {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync URL input with current URL when it changes externally
  const handleUrlFocus = () => {
    setUrlInput(currentUrl);
    inputRef.current?.select();
  };

  const handleUrlBlur = () => {
    setUrlInput(currentUrl);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNavigate(urlInput);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setUrlInput(currentUrl);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col bg-browser-bg border-b border-browser-surface no-drag">
      {/* Tab bar */}
      <div className="flex items-center h-10 px-2 pt-2">
        {/* macOS traffic light spacing - this area is draggable for window movement */}
        <div className="w-16 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => onSwitchTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer
                min-w-[120px] max-w-[200px] group tab-transition
                ${
                  activeTabId === tab.id
                    ? 'bg-browser-surface text-browser-text'
                    : 'bg-transparent text-browser-subtext hover:bg-browser-surface/50'
                }
              `}
            >
              {tab.isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded bg-browser-accent/20 flex-shrink-0" />
              )}
              <span className="truncate text-xs flex-1">{tab.title || 'New Tab'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-browser-surface p-0.5 rounded transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* New tab button */}
          <button
            onClick={() => onCreateTab()}
            className="p-1.5 rounded hover:bg-browser-surface/50 transition-colors"
          >
            <Plus className="w-4 h-4 text-browser-subtext" />
          </button>
        </div>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onGoBack}
            className="p-1.5 rounded hover:bg-browser-surface transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-browser-subtext" />
          </button>
          <button
            onClick={onGoForward}
            className="p-1.5 rounded hover:bg-browser-surface transition-colors"
            title="Go forward"
          >
            <ArrowRight className="w-4 h-4 text-browser-subtext" />
          </button>
          <button
            onClick={onReload}
            className="p-1.5 rounded hover:bg-browser-surface transition-colors"
            title="Reload"
          >
            <RotateCw className={`w-4 h-4 text-browser-subtext ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* URL input */}
        <div className="flex-1 flex items-center address-bar rounded-full px-3 py-1.5">
          <Shield className="w-4 h-4 text-browser-subtext mr-2 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onFocus={handleUrlFocus}
            onBlur={handleUrlBlur}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL"
            className="flex-1 bg-transparent text-sm text-browser-text placeholder-browser-subtext outline-none"
          />
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className={`
            p-2 rounded-lg transition-colors flex items-center gap-2
            ${isSidebarOpen ? 'bg-browser-accent text-browser-bg' : 'hover:bg-browser-surface text-browser-subtext'}
          `}
          title="AI Companions"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm font-medium">Agents</span>
        </button>

        {/* Settings button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-browser-surface text-browser-subtext transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
