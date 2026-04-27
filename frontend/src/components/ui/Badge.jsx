import React from 'react';
import { cn, statusConfig, priorityLabels, priorityBg } from '../../lib/utils';

export const StatusBadge = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig.Pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', config.className, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority, className }) => {
  const label = priorityLabels[priority] || 'Medium';
  const bg = priorityBg[priority] || priorityBg[3];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', bg, className)}>
      P{priority} · {label}
    </span>
  );
};

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    outline: 'border border-border text-foreground'
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
};
