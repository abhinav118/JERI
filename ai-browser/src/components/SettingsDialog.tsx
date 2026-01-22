import { useState, useEffect } from 'react';
import { X, Key, Save, Check } from 'lucide-react';
import { getApiKey, setApiKey, hasApiKey } from '../lib/llm';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const key = getApiKey();
      if (key) {
        // Show masked key
        setApiKeyInput('AIza••••••••••••••••');
      } else {
        setApiKeyInput('');
      }
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKeyInput && !apiKeyInput.includes('••••')) {
      setApiKey(apiKeyInput);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 no-drag">
      <div className="bg-browser-bg border border-browser-surface rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-browser-surface">
          <h3 className="font-semibold text-browser-text">Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-browser-surface transition-colors"
          >
            <X className="w-5 h-5 text-browser-subtext" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-browser-text mb-2">
              Google Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-browser-surface rounded-lg px-3 py-2">
                <Key className="w-4 h-4 text-browser-subtext mr-2" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIza..."
                  className="flex-1 bg-transparent text-browser-text placeholder-browser-subtext outline-none text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-browser-subtext mt-2">
              Your API key is stored locally and only sent to Google's Gemini API.
            </p>
          </div>

          {/* Status indicator */}
          {hasApiKey() && (
            <div className="flex items-center gap-2 text-browser-green text-sm">
              <Check className="w-4 h-4" />
              <span>API key configured</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-browser-surface">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-browser-surface hover:bg-browser-surface transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKeyInput || apiKeyInput.includes('••••')}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors
              ${
                saved
                  ? 'bg-browser-green text-browser-bg'
                  : 'bg-browser-accent text-browser-bg hover:bg-browser-accent/90'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
