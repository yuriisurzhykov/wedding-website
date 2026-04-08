import { cn } from '@/lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full rounded-md border border-border bg-bg-card',
      'px-4 py-3 text-body text-text-primary',
      'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
      'transition-shadow duration-fast',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'
