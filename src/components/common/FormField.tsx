/**
 * FormField Component
 * Reusable form field with validation, help text, and accessibility
 * Supports text, number, and select inputs
 */

import { Check } from 'lucide-react';
import { FieldError } from './FieldError';
import { FieldHelp } from './FieldHelp';
import { clsx } from 'clsx';
import { type ReactNode } from 'react';

export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  className?: string;
  showValidIndicator?: boolean;
  children?: ReactNode;
}

export const FormField = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  options,
  className,
  showValidIndicator = true,
  children,
}: FormFieldProps) => {
  const hasError = !!error;
  const isValid = !hasError && value !== '' && value !== undefined && value !== null;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const inputClassName = clsx(
    'w-full px-4 py-3 rounded-xl border-2 transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed',
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
      : isValid && showValidIndicator
      ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
      : 'border-slate-200 bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100',
    className
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block">
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>

      <div className="relative">
        {type === 'select' ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={inputClassName}
            aria-invalid={hasError}
            aria-describedby={clsx(
              hasError && errorId,
              helpText && helpId
            )}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            rows={4}
            className={inputClassName}
            aria-invalid={hasError}
            aria-describedby={clsx(
              hasError && errorId,
              helpText && helpId
            )}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={inputClassName}
            aria-invalid={hasError}
            aria-describedby={clsx(
              hasError && errorId,
              helpText && helpId
            )}
          />
        )}

        {/* Valid indicator */}
        {isValid && showValidIndicator && !disabled && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
            <Check size={20} strokeWidth={2.5} aria-label="Campo valido" />
          </div>
        )}
      </div>

      {children}

      {/* Error message */}
      {hasError && <FieldError id={errorId} message={error} />}

      {/* Help text */}
      {helpText && !hasError && <FieldHelp id={helpId} text={helpText} />}
    </div>
  );
};
