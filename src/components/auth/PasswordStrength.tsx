import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

function getStrength(password: string): StrengthLevel {
  if (!password) return 'empty';

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score === 1) return 'weak';
  if (score === 2) return 'medium';
  return 'strong';
}

const STRENGTH_CONFIG = {
  empty: { bars: 0, label: '', color: '' },
  weak: { bars: 1, label: 'Débil', color: 'bg-red-500' },
  medium: { bars: 2, label: 'Media', color: 'bg-amber-500' },
  strong: { bars: 3, label: 'Fuerte', color: 'bg-emerald-500' },
} as const;

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = getStrength(password);
  const { bars, label, color } = STRENGTH_CONFIG[level];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-0.5 flex-1 rounded-full transition-colors duration-300',
              i <= bars ? color : 'bg-white/5'
            )}
          />
        ))}
      </div>
      {label && (
        <p className={cn('text-[11px] mt-1 transition-colors', color.replace('bg-', 'text-'))}>
          {label}
        </p>
      )}
    </div>
  );
}