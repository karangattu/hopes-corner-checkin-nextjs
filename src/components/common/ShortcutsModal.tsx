'use client';

import { X } from 'lucide-react';
import { GLOBAL_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3">
          {GLOBAL_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.split('+').map((part, idx, arr) => (
                  <span key={part} className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                      {part}
                    </kbd>
                    {idx < arr.length - 1 && <span className="text-gray-400">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-200 rounded-b-xl">
          <p className="text-sm text-emerald-900">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-white border border-emerald-200 rounded">?</kbd> anytime to see this menu
          </p>
        </div>
      </div>
    </div>
  );
}
