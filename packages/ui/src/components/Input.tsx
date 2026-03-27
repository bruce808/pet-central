import { type ChangeEvent } from 'react';
import clsx from 'clsx';

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Input({
  label,
  error,
  helperText,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required,
  disabled,
  className,
}: InputProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
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
      {!error && helperText && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
