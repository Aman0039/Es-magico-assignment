import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Tag, RefreshCw, ChevronUp, ChevronDown, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';

export const TaskTable = ({ tasks, onTaskClick, onRetry, onDuplicate, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Task', 'Status', 'Priority', 'Est. Hours', 'Resource', 'Retries', 'Created', ''].map((h, i) => (
              <th key={i} className="text-left text-xs font-semibold text-muted-foreground px-3 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <AnimatePresence>
            {tasks.map((task, i) => (
              <motion.tr
                key={task._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onTaskClick(task)}
                className="hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <td className="px-3 py-3 max-w-xs">
                  <div>
                    <p className="font-medium text-foreground line-clamp-1">{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />{task.estimatedHours}h
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {task.resourceTag ? (
                    <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                      <Tag className="w-3 h-3" />{task.resourceTag}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5" />{task.retryCount}/{task.maxRetries}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelativeTime(task.createdAt)}
                </td>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'Failed' && task.retryCount < task.maxRetries && (
                      <button onClick={() => onRetry(task._id)} className="p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/30 text-amber-500 transition-colors" title="Retry">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => onDuplicate(task._id)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(task)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">No tasks found</div>
      )}
    </div>
  );
};
