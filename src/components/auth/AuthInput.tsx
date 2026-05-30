import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, className, ...props }: AuthInputProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase mb-1.5">
        {label}
      </label>
      <input
        className={cn(
          'w-full bg-[#111318] border border-white/5 rounded-lg',
          'px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700',
          'outline-none transition-colors duration-150',
          'focus:border-red-500/50 hover:border-white/10',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}