import { type ChangeEvent } from 'react';
import clsx from 'clsx';

export interface TextareaProps {
  label?: string;
  error?: string;
  rows?: number;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Textarea({
  label,
  error,
  rows = 4,
  placeholder,
  value,
  onChange,
  name,
  required,
  disabled,
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-brand-500',
        )}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
