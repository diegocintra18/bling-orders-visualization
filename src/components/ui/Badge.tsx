import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'pending' | 'verified' | 'completed' | 'delayed' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delayed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };