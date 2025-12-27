/**
 * useKeyboardNavigation Hook
 * Provides keyboard shortcuts for common actions
 * WCAG 2.1.1 - Keyboard (Level A)
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  return shortcuts;
};
