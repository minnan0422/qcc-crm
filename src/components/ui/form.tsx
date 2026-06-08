import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-text-faint">{hint}</span>
      ) : null}
    </div>
  );
}

const baseInput =
  'h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-text-faint focus:border-primary disabled:bg-bg';

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} className={cn(baseInput, invalid && 'border-danger', className)} {...props} />
  ),
);
TextInput.displayName = 'TextInput';

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      className={cn(baseInput, 'h-auto py-2', invalid && 'border-danger', className)}
      {...props}
    />
  ),
);
TextArea.displayName = 'TextArea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseInput, 'cursor-pointer pr-8', invalid && 'border-danger', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
