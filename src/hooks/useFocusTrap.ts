/**
 * useFocusTrap Hook
 * Traps focus within a container element (e.g., modal)
 * Ensures keyboard users stay within modal when navigating with Tab
 * WCAG 2.4.3 - Focus Order (Level A)
 */

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const useFocusTrap = (
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean = true
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab on first element -> focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
      // Tab on last element -> focus first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive]);
};
