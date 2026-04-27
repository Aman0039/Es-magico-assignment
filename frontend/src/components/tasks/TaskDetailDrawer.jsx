import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Tag, RefreshCw, GitBranch, History, AlertTriangle, Copy, Trash2, Edit, ChevronRight } from 'lucide-react';
import { tasksAPI } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { formatDate, formatRelativeTime } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

export const TaskDetailDrawer = ({ taskId, isOpen, onClose, onEdit, onDelete, onRetry }) => {
  const { toast } = useToast();
  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!isOpen || !taskId) return;
    setLoading(true);
    setTab('details');
    Promise.all([tasksAPI.getOne(taskId), tasksAPI.getHistory(taskId)])
      .then(([tRes, hRes]) => { setTask(tRes.data.task); setHistory(hRes.data.history); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId, isOpen]);

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  const handleRestore = async (version) => {
    try {
      const r = await tasksAPI.restoreVersion(taskId, version);
      setTask(r.data.task);
      toast({ type: 'success', title: 'Version restored!', message: `Restored to v${version}` });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to restore version' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {task && <StatusBadge status={task.status} />}
                <span className="text-sm text-muted-foreground">v{task?.versionNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                {task && <Button variant="ghost" size="icon" onClick={() => onEdit(task)}><Edit className="w-4 h-4" /></Button>}
                {task && <Button variant="ghost" size="icon" onClick={() => { onClose(); onDelete(task); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-5 gap-1 shrink-0">
              {['details', 'history'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : !task ? null : tab === 'details' ? (
                <div className="p-5 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground leading-snug">{task.title}</h2>
                    {task.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{task.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Priority', value: <PriorityBadge priority={task.priority} /> },
                      { label: 'Est. Hours', value: <span className="flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4 text-muted-foreground" />{task.estimatedHours}h</span> },
                      { label: 'Resource Tag', value: task.resourceTag ? <span className="flex items-center gap-1.5 text-sm"><Tag className="w-4 h-4 text-muted-foreground" />{task.resourceTag}</span> : <span className="text-muted-foreground text-sm">None</span> },
                      { label: 'Retries', value: <span className="flex items-center gap-1.5 text-sm"><RefreshCw className="w-4 h-4 text-muted-foreground" />{task.retryCount} / {task.maxRetries}</span> },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        {value}
                      </div>
                    ))}
                  </div>

                  {task.dependencies?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Dependencies</p>
                      <div className="space-y-1.5">
                        {task.dependencies.map(dep => (
                          <div key={dep._id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                            <span className="text-foreground truncate">{dep.title}</span>
                            <StatusBadge status={dep.status} className="shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.status === 'Blocked' && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">This task is blocked because one or more dependencies have failed.</p>
                    </div>
                  )}

                  {task.status === 'Failed' && task.retryCount < task.maxRetries && (
                    <Button variant="outline" className="w-full" onClick={() => { onRetry(task._id); onClose(); }}>
                      <RefreshCw className="w-4 h-4" /> Retry Task ({task.maxRetries - task.retryCount} left)
                    </Button>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                    <p>Created {formatRelativeTime(task.createdAt)} · by {task.createdBy?.name || 'Unknown'}</p>
                    <p>Last updated {formatRelativeTime(task.updatedAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  <p className="text-sm text-muted-foreground">{history.length} version{history.length !== 1 ? 's' : ''} recorded</p>
                  {history.map((ver, i) => (
                    <div key={ver._id} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        v{ver.versionNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{ver.changeDescription}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {ver.changedBy?.name} · {formatRelativeTime(ver.createdAt)}
                        </p>
                      </div>
                      {i !== 0 && (
                        <button onClick={() => handleRestore(ver.versionNumber)}
                          className="shrink-0 text-xs text-primary hover:underline">
                          Restore
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
