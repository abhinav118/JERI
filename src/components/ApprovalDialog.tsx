import { AlertTriangle, Check, X } from 'lucide-react';
import { BrowserAction } from '../types';

interface ApprovalDialogProps {
  action: BrowserAction;
  description: string;
  onApprove: () => void;
  onDeny: () => void;
}

export default function ApprovalDialog({
  action,
  description,
  onApprove,
  onDeny,
}: ApprovalDialogProps) {
  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 no-drag">
      <div className="bg-browser-bg border border-browser-surface rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-browser-surface">
          <div className="p-2 rounded-lg bg-browser-yellow/20">
            <AlertTriangle className="w-5 h-5 text-browser-yellow" />
          </div>
          <div>
            <h3 className="font-semibold text-browser-text">Approval Required</h3>
            <p className="text-xs text-browser-subtext">
              The AI wants to perform a sensitive action
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="bg-browser-surface rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-browser-accent uppercase">
                {action.type}
              </span>
            </div>
            <p className="text-sm text-browser-text">{description}</p>

            {action.selector && (
              <div className="mt-3 pt-3 border-t border-browser-bg">
                <span className="text-xs text-browser-subtext">Target: </span>
                <code className="text-xs text-browser-accent bg-browser-bg px-1.5 py-0.5 rounded">
                  {action.selector}
                </code>
              </div>
            )}

            {action.value && (
              <div className="mt-2">
                <span className="text-xs text-browser-subtext">Value: </span>
                <code className="text-xs text-browser-accent bg-browser-bg px-1.5 py-0.5 rounded">
                  {action.value.substring(0, 100)}
                  {action.value.length > 100 ? '...' : ''}
                </code>
              </div>
            )}
          </div>

          <p className="text-xs text-browser-subtext text-center mb-4">
            Do you want to allow this action?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDeny}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-browser-surface hover:bg-browser-surface transition-colors"
            >
              <X className="w-4 h-4 text-browser-red" />
              <span className="text-sm font-medium text-browser-text">Deny</span>
            </button>
            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-browser-green text-browser-bg hover:bg-browser-green/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
