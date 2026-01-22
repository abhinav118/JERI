import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import CompanionCard from './CompanionCard';
import { companions } from '../agents/companions';
import { Companion, AgentStatus } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompanion: Companion | null;
  onSelectCompanion: (companion: Companion) => void;
  agentStatus: AgentStatus;
  agentResult: string | null;
}

export default function Sidebar({
  isOpen,
  onClose,
  selectedCompanion,
  onSelectCompanion,
  agentStatus,
  agentResult,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 sidebar flex flex-col animate-slide-in-right z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-browser-surface">
        <h2 className="text-lg font-semibold text-browser-text">AI Companions</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-browser-surface transition-colors"
        >
          <X className="w-5 h-5 text-browser-subtext" />
        </button>
      </div>

      {/* Companions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-browser-subtext mb-4">
          Select a companion to help automate tasks on the current page.
        </p>

        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            companion={companion}
            isSelected={selectedCompanion?.id === companion.id}
            onSelect={() => onSelectCompanion(companion)}
          />
        ))}
      </div>

      {/* Status section */}
      {selectedCompanion && (
        <div className="border-t border-browser-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selectedCompanion.avatar}</span>
            <span className="font-medium text-browser-text">{selectedCompanion.name}</span>
          </div>

          {/* Agent running status */}
          {agentStatus.isRunning && (
            <div className="bg-browser-surface rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-browser-accent" />
                <span className="text-sm text-browser-text">
                  Step {agentStatus.currentStep}
                  {agentStatus.totalSteps > 0 ? ` of ${agentStatus.totalSteps}` : ''}
                </span>
              </div>
              {agentStatus.thought && (
                <p className="text-xs text-browser-subtext">{agentStatus.thought}</p>
              )}
              {agentStatus.currentAction && (
                <p className="text-xs text-browser-accent mt-1">
                  Action: {agentStatus.currentAction}
                </p>
              )}
            </div>
          )}

          {/* Agent result */}
          {agentResult && !agentStatus.isRunning && (
            <div
              className={`rounded-lg p-3 ${
                agentResult.startsWith('Error')
                  ? 'bg-browser-red/10 border border-browser-red/30'
                  : 'bg-browser-green/10 border border-browser-green/30'
              }`}
            >
              <div className="flex items-start gap-2">
                {agentResult.startsWith('Error') ? (
                  <AlertCircle className="w-4 h-4 text-browser-red flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-browser-green flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-browser-text whitespace-pre-wrap">{agentResult}</p>
              </div>
            </div>
          )}

          {!agentStatus.isRunning && !agentResult && (
            <p className="text-xs text-browser-subtext">
              Type a command below to start {selectedCompanion.name}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
