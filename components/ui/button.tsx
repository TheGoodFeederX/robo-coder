import * as React from 'react'

import { cn } from '@/lib/utils'

// Only the variants this app needs; colours are dark enough for 4.5:1 with white text.
const SIZES = {
  default: 'h-11 px-4 py-2 has-[>svg]:px-3',
  sm: 'h-11 min-w-11 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
  lg: 'h-14 rounded-md px-6 has-[>svg]:px-4',
  icon: 'h-11 w-11',
} as const

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:
    'border-2 border-white/60 bg-transparent text-white hover:bg-white/10',
  success: 'bg-green-700 text-white hover:bg-green-800',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  info: 'bg-sky-700 text-white hover:bg-sky-800',
  warning: 'bg-purple-700 text-white hover:bg-purple-800',
  light: 'border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
} as const

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}

export { Button }
