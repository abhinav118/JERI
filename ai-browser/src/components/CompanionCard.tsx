import { Shield } from 'lucide-react';
import { Companion } from '../types';

interface CompanionCardProps {
  companion: Companion;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CompanionCard({
  companion,
  isSelected,
  onSelect,
}: CompanionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        companion-card w-full text-left p-3 rounded-lg
        ${isSelected ? 'active' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{companion.avatar}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-browser-text">{companion.name}</h3>
          <p className="text-xs text-browser-subtext mt-1 line-clamp-2">
            {companion.description}
          </p>

          {/* Approval indicators */}
          {companion.approvalRequired.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Shield className="w-3 h-3 text-browser-yellow" />
              <span className="text-[10px] text-browser-yellow">
                Requires approval for some actions
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
