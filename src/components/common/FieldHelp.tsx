/**
 * FieldHelp Component
 * Displays help text below form field
 * Provides guidance on field requirements
 */

import { HelpCircle } from 'lucide-react';

interface FieldHelpProps {
  id: string;
  text: string;
  showIcon?: boolean;
}

export const FieldHelp = ({ id, text, showIcon = true }: FieldHelpProps) => {
  return (
    <div
      id={id}
      className="flex items-center gap-2 mt-2 text-slate-500 text-sm"
    >
      {showIcon && <HelpCircle size={14} strokeWidth={2} aria-hidden="true" />}
      <span>{text}</span>
    </div>
  );
};
