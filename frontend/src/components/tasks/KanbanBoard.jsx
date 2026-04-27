import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, RefreshCw, Tag } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime, priorityColors } from '../../lib/utils';

const COLUMNS = [
  { status: 'Pending', color: 'border-amber-400', headerBg: 'bg-amber-50 dark:bg-amber-950/30', headerText: 'text-amber-700 dark:text-amber-400' },
  { status: 'Running', color: 'border-blue-400', headerBg: 'bg-blue-50 dark:bg-blue-950/30', headerText: 'text-blue-700 dark:text-blue-400' },
  { status: 'Completed', color: 'border-emerald-400', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30', headerText: 'text-emerald-700 dark:text-emerald-400' },
  { status: 'Failed', color: 'border-red-400', headerBg: 'bg-red-50 dark:bg-red-950/30', headerText: 'text-red-700 dark:text-red-400' },
  { status: 'Blocked', color: 'border-gray-400', headerBg: 'bg-gray-50 dark:bg-gray-900/30', headerText: 'text-gray-600 dark:text-gray-400' },
];

const TaskCard = ({ task, onClick, onRetry }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    onClick={() => onClick(task)}
    className="cwos-card p-3.5 cursor-pointer hover:shadow-md transition-shadow space-y-3 group"
  >
    <div className="flex items-start justify-between gap-2">
      <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug flex-1">{task.title}</h4>
      <PriorityBadge priority={task.priority} className="shrink-0" />
    </div>

    {task.description && (
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
    )}

    <div className="flex items-center gap-2 flex-wrap">
      {task.resourceTag && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          <Tag className="w-3 h-3" />{task.resourceTag}
        </span>
      )}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />{task.estimatedHours}h
      </span>
      {task.retryCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-amber-500">
          <RefreshCw className="w-3 h-3" />{task.retryCount}/{task.maxRetries}
        </span>
      )}
    </div>

    <div className="flex items-center justify-between pt-1">
      {task.assignee ? (
        <Avatar user={task.assignee} size="xs" />
      ) : <span />}
      <span className="text-xs text-muted-foreground">{formatRelativeTime(task.createdAt)}</span>
    </div>

    {task.status === 'Failed' && task.retryCount < task.maxRetries && (
      <button
        onClick={e => { e.stopPropagation(); onRetry(task._id); }}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 rounded-lg py-1.5 transition-colors mt-1"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry Task
      </button>
    )}
  </motion.div>
);

export const KanbanBoard = ({ tasks, onTaskClick, onRetry, onAddTask }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="flex-shrink-0 w-72">
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color.replace('border-', 'bg-')}`} />
                <span className={`text-sm font-semibold ${col.headerText}`}>{col.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${col.headerText}`}>
                  {colTasks.length}
                </span>
                {col.status === 'Pending' && (
                  <button onClick={onAddTask} className={`${col.headerText} hover:opacity-70 transition-opacity`}>
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2.5 min-h-[200px]">
              <AnimatePresence>
                {colTasks.map(task => (
                  <TaskCard key={task._id} task={task} onClick={onTaskClick} onRetry={onRetry} />
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">No {col.status.toLowerCase()} tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
