'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="label mb-2"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'select',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : '',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
