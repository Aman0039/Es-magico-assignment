import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Filter, Search, X } from 'lucide-react';
import { auditAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatRelativeTime } from '../lib/utils';

const ACTION_COLORS = {
  task_create: 'success', task_update: 'primary', task_delete: 'danger', task_status_change: 'primary',
  project_create: 'success', project_update: 'primary', project_delete: 'danger',
  member_join: 'success', invite_generate: 'warning', login: 'default', signup: 'success',
  task_retry: 'warning', webhook_fired: 'primary', version_conflict: 'warning'
};

const ACTION_LABELS = {
  task_create: 'Created task', task_update: 'Updated task', task_delete: 'Deleted task',
  task_status_change: 'Changed task status', task_duplicate: 'Duplicated task',
  project_create: 'Created project', project_update: 'Updated project', project_delete: 'Deleted project',
  member_join: 'Joined project', invite_generate: 'Generated invite link',
  login: 'Signed in', signup: 'Created account', task_retry: 'Retried task',
  task_fail: 'Task failed', webhook_fired: 'Webhook fired', webhook_failed: 'Webhook failed',
  version_conflict: 'Version conflict detected', version_restore: 'Restored version',
  dependency_cycle_detected: 'Circular dependency detected', dependency_rejected: 'Dependency rejected'
};

export const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    auditAPI.getMe().then(r => setLogs(r.data.logs)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (search) {
      const label = ACTION_LABELS[log.action] || log.action;
      if (!label.toLowerCase().includes(search.toLowerCase()) && !log.actor?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Activity Log
          </h1>
          <p className="text-muted-foreground mt-1">Track all actions across your workspace</p>
        </div>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">{filtered.length} events</span>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..." className="cwos-input pl-9 h-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="cwos-input h-9 w-48">
          <option value="">All actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
        </select>
        {(search || actionFilter) && (
          <button onClick={() => { setSearch(''); setActionFilter(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <Card className="space-y-3 divide-y divide-border p-0 overflow-hidden">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
            </div>
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Activity} title="No activity yet" description="Actions you and your team take will appear here." />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-border">
          {filtered.map((log, i) => (
            <motion.div key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors">
              <Avatar user={log.actor} size="sm" className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{log.actor?.name || 'Unknown User'}</span>
                  <Badge variant={ACTION_COLORS[log.action] || 'default'} className="text-xs">
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  {log.metadata?.name && <span className="text-sm text-muted-foreground truncate">· {log.metadata.name}</span>}
                  {log.metadata?.title && <span className="text-sm text-muted-foreground truncate">· {log.metadata.title}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(log.createdAt)}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 capitalize">{log.entity}</span>
            </motion.div>
          ))}
        </Card>
      )}
    </div>
  );
};
