import { ReactNode } from 'react'
import clsx from 'clsx'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  dotClassName?: string
  className?: string
}

const variantStyles = {
  default: 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]',
  success: 'bg-[rgb(22_199_132_/_0.12)] text-[var(--color-success)] border border-[rgb(22_199_132_/_0.2)]',
  error: 'bg-[rgb(239_71_87_/_0.12)] text-[var(--color-error)] border border-[rgb(239_71_87_/_0.2)]',
  warning: 'bg-[rgb(245_165_36_/_0.12)] text-[var(--color-warning)] border border-[rgb(245_165_36_/_0.2)]',
  info: 'bg-[rgb(75_110_255_/_0.12)] text-[var(--color-accent)] border border-[rgb(75_110_255_/_0.2)]',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10.5px]',
  md: 'px-2 py-0.5 text-[11px]',
  lg: 'px-2.5 py-1 text-xs',
}

const dotStyles = {
  default: 'bg-[var(--color-text-muted)]',
  success: 'bg-[var(--color-success)]',
  error: 'bg-[var(--color-error)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--color-accent)]',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotClassName = 'w-1.5 h-1.5',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={clsx('rounded-full', dotClassName, dotStyles[variant])} />
      )}
      {children}
    </span>
  )
}
