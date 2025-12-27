/**
 * FieldError Component
 * Displays validation error message below form field
 * Includes accessibility attributes for screen readers
 */

import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  id: string;
  message: string;
}

export const FieldError = ({ id, message }: FieldErrorProps) => {
  return (
    <div
      id={id}
      className="flex items-center gap-2 mt-2 text-red-600 text-sm font-medium animate-in slide-in-from-top-1 duration-200"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
