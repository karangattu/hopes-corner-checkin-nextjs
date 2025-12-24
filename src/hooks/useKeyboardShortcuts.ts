'use client';

import { useEffect } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
}

interface RegisteredShortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const registered: RegisteredShortcuts = {};

    // Register shortcuts
    shortcuts.forEach((shortcut) => {
      const key = [
        shortcut.ctrl ? 'ctrl' : '',
        shortcut.shift ? 'shift' : '',
        shortcut.alt ? 'alt' : '',
        shortcut.key,
      ]
        .filter(Boolean)
        .join('-')
        .toLowerCase();

      registered[key] = shortcut.action;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Treat Cmd (meta) as Ctrl so shortcuts work on macOS and Windows
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const key = [
        ctrlOrMeta ? 'ctrl' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('-');

      if (registered[key]) {
        e.preventDefault();
        registered[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export const GLOBAL_SHORTCUTS = [
  { keys: 'Shift+S', description: 'Quick shower booking', id: 'shower' },
  { keys: 'Shift+L', description: 'Quick laundry load', id: 'laundry' },
  { keys: 'Shift+D', description: 'Quick donation entry', id: 'donation' },
  { keys: 'Ctrl+K', description: 'Search or command menu', id: 'search' },
  { keys: '?', description: 'Show this help menu', id: 'help' },
];
