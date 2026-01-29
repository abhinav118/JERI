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
      console.log('SettingsDialog opened');
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
    console.log('Save clicked, apiKeyInput:', apiKeyInput ? 'SET' : 'EMPTY');
    if (apiKeyInput && !apiKeyInput.includes('••••')) {
      setApiKey(apiKeyInput);
      console.log('API key saved to localStorage');
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] no-drag"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-xl shadow-2xl max-w-md w-full mx-4"
        style={{ backgroundColor: '#1e1e2e', border: '1px solid #313244' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid #313244' }}
        >
          <h3 className="font-semibold" style={{ color: '#cdd6f4' }}>Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:opacity-80 transition-colors"
            style={{ color: '#a6adc8' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#cdd6f4' }}>
              Google Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center rounded-lg px-3 py-2"
                style={{ backgroundColor: '#313244' }}
              >
                <Key className="w-4 h-4 mr-2" style={{ color: '#a6adc8' }} />
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: '#cdd6f4' }}
                />
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: '#a6adc8' }}>
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#89b4fa', textDecoration: 'underline' }}
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Status indicator */}
          {hasApiKey() && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#a6e3a1' }}>
              <Check className="w-4 h-4" />
              <span>API key configured</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 p-4"
          style={{ borderTop: '1px solid #313244' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ border: '1px solid #313244', color: '#cdd6f4' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKeyInput || apiKeyInput.includes('••••')}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: saved ? '#a6e3a1' : '#89b4fa',
              color: '#1e1e2e'
            }}
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
