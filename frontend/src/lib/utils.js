import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const priorityLabels = { 1: 'Trivial', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical' };
export const priorityColors = {
  1: 'text-gray-400',
  2: 'text-sky-500',
  3: 'text-amber-500',
  4: 'text-orange-500',
  5: 'text-rose-600'
};
export const priorityBg = {
  1: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400',
  2: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400',
  3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  4: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  5: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'
};

export const statusConfig = {
  Pending: { label: 'Pending', className: 'status-pending', dot: 'bg-amber-400' },
  Running: { label: 'Running', className: 'status-running', dot: 'bg-blue-400 animate-pulse' },
  Completed: { label: 'Completed', className: 'status-completed', dot: 'bg-emerald-400' },
  Failed: { label: 'Failed', className: 'status-failed', dot: 'bg-red-400' },
  Blocked: { label: 'Blocked', className: 'status-blocked', dot: 'bg-gray-400' }
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(date);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (str) => {
  const colors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
