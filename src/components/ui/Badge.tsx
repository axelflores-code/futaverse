import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variant === 'default' && 'bg-red-500/10 text-red-400',
      variant === 'secondary' && 'bg-white/10 text-zinc-300',
      variant === 'outline' && 'border border-white/10 text-zinc-400',
      className
    )}>
      {children}
    </span>
  )
}