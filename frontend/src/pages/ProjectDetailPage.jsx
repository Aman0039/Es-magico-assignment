import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, LayoutGrid, List, Table2, Link2, Cpu, FlaskConical, Settings, Users, X, Filter, RefreshCw, Copy, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectsAPI, tasksAPI, invitesAPI } from '../services/api';
import { getSocket, joinProjectRoom, leaveProjectRoom } from '../services/socket';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { TaskCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { AvatarGroup } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

const VERSION_CONFLICT_KEY = 'cwos_conflict';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { tasks, setTasks, addTask, updateTask, deleteTask: deleteTaskCtx } = useApp();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(true);
  const [view, setView] = useState('kanban'); // kanban | table
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // Load project
  useEffect(() => {
    projectsAPI.getOne(id).then(r => setProject(r.data.project)).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id]);

  // Load tasks
  const loadTasks = useCallback(() => {
    setTaskLoading(true);
    tasksAPI.getByProject(id).then(r => setTasks(r.data.tasks)).catch(console.error).finally(() => setTaskLoading(false));
  }, [id]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    joinProjectRoom(id);
    socket.on('task:created', t => addTask(t));
    socket.on('task:updated', t => updateTask(t));
    socket.on('task:deleted', ({ taskId }) => deleteTaskCtx(taskId));
    socket.on('project:updated', p => setProject(p));
    socket.on('project:member_joined', ({ project: p }) => setProject(p));
    return () => {
      leaveProjectRoom(id);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('project:updated');
      socket.off('project:member_joined');
    };
  }, [id]);

  const handleCreateTask = async (data) => {
    setFormLoading(true);
    try {
      await tasksAPI.create(id, data);
      setShowCreateTask(false);
      toast({ type: 'success', title: 'Task created!' });
    } catch (err) {
      if (err.response?.data?.cycle) {
        toast({ type: 'error', title: 'Circular dependency detected', message: 'Select different dependencies.' });
      } else {
        toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to create task' });
      }
    } finally { setFormLoading(false); }
  };

  const handleUpdateTask = async (data) => {
    if (!editTask) return;
    setFormLoading(true);
    try {
      await tasksAPI.update(editTask._id, { ...data, versionNumber: editTask.versionNumber });
      setEditTask(null);
      toast({ type: 'success', title: 'Task updated!' });
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictData({ latest: err.response.data.latestTask, pending: data });
        setEditTask(null);
        toast({ type: 'warning', title: 'Version conflict!', message: err.response.data.error });
      } else if (err.response?.data?.cycle) {
        toast({ type: 'error', title: 'Circular dependency', message: 'Choose different dependencies.' });
      } else {
        toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to update' });
      }
    } finally { setFormLoading(false); }
  };

  const handleDeleteTask = async (task) => {
    try {
      await tasksAPI.delete(task._id);
      setDeleteConfirm(null);
      toast({ type: 'success', title: 'Task deleted' });
    } catch { toast({ type: 'error', title: 'Error', message: 'Failed to delete' }); }
  };

  const handleDuplicate = async (taskId) => {
    try {
      await tasksAPI.duplicate(taskId);
      toast({ type: 'success', title: 'Task duplicated!' });
    } catch { toast({ type: 'error', title: 'Error', message: 'Failed to duplicate' }); }
  };

  const handleRetry = async (taskId) => {
    try {
      await tasksAPI.retry(taskId);
      toast({ type: 'success', title: 'Task retrying…' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Cannot retry' });
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const r = await invitesAPI.generate(id);
      setInviteUrl(r.data.inviteUrl);
    } catch { toast({ type: 'error', title: 'Error', message: 'Failed to generate invite' }); }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({ type: 'success', title: 'Copied!', message: 'Invite link copied to clipboard' });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && String(t.priority) !== priorityFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const isOwner = project?.owner?._id === user?._id || project?.owner === user?._id;
  const allMembers = [project?.owner, ...(project?.members || [])].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
        <Link to="/projects" className="mt-1 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: project?.color || '#6366f1' }}>
              {project?.name[0].toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{project?.name}</h1>
            <Badge variant="outline" className="capitalize">{project?.status}</Badge>
          </div>
          {project?.description && <p className="text-muted-foreground mt-1 ml-11">{project.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <AvatarGroup users={allMembers} max={5} />
          {isOwner && (
            <Button variant="outline" size="sm" onClick={handleGenerateInvite}>
              <Link2 className="w-4 h-4" /> Invite
            </Button>
          )}
          <Link to={`/projects/${id}/execution`}>
            <Button variant="outline" size="sm"><Cpu className="w-4 h-4" /> Planner</Button>
          </Link>
          <Link to={`/projects/${id}/simulate`}>
            <Button variant="outline" size="sm"><FlaskConical className="w-4 h-4" /> Simulate</Button>
          </Link>
          <Button size="sm" onClick={() => setShowCreateTask(true)}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </motion.div>

      {/* Invite URL */}
      <AnimatePresence>
        {inviteUrl && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <input readOnly value={inviteUrl} className="flex-1 bg-transparent text-sm text-primary font-mono outline-none truncate" />
            <Button size="sm" variant="outline" onClick={copyInvite}><Copy className="w-3.5 h-3.5" /> Copy</Button>
            <button onClick={() => setInviteUrl(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version conflict banner */}
      <AnimatePresence>
        {conflictData && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Version conflict detected</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">This task was updated by another user. The page has been refreshed with the latest version.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditTask(conflictData.latest); setConflictData(null); }}>
                Edit latest
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConflictData(null)}><X className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="cwos-input pl-9 h-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cwos-input h-9 w-36">
          <option value="">All statuses</option>
          {['Pending','Running','Completed','Failed','Blocked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="cwos-input h-9 w-36">
          <option value="">All priorities</option>
          {[1,2,3,4,5].map(p => <option key={p} value={p}>P{p}</option>)}
        </select>
        {(search || statusFilter || priorityFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
        <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-1">
          {[{ id: 'kanban', icon: LayoutGrid }, { id: 'table', icon: Table2 }].map(({ id: vid, icon: Icon }) => (
            <button key={vid} onClick={() => setView(vid)}
              className={cn('p-1.5 rounded-md transition-colors', view === vid ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task views */}
      {taskLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <TaskCardSkeleton key={i} />)}
        </div>
      ) : filteredTasks.length === 0 && !search && !statusFilter && !priorityFilter ? (
        <EmptyState icon={Plus} title="No tasks yet" description="Create your first task to start managing work in this project"
          action={<Button onClick={() => setShowCreateTask(true)}><Plus className="w-4 h-4" /> Create Task</Button>} />
      ) : view === 'kanban' ? (
        <KanbanBoard tasks={filteredTasks} onTaskClick={t => setSelectedTaskId(t._id)} onRetry={handleRetry} onAddTask={() => setShowCreateTask(true)} />
      ) : (
        <Card className="overflow-hidden p-0">
          <TaskTable tasks={filteredTasks} onTaskClick={t => setSelectedTaskId(t._id)} onRetry={handleRetry} onDuplicate={handleDuplicate} onDelete={t => setDeleteConfirm(t)} />
        </Card>
      )}

      {/* Create task modal */}
      <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create New Task" size="lg">
        <TaskForm onSubmit={handleCreateTask} loading={formLoading} onClose={() => setShowCreateTask(false)} tasks={tasks} />
      </Modal>

      {/* Edit task modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && <TaskForm onSubmit={handleUpdateTask} defaultValues={editTask} loading={formLoading} onClose={() => setEditTask(null)} tasks={tasks} editingTaskId={editTask._id} />}
      </Modal>

      {/* Delete task modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Task" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground">Delete <strong className="text-foreground">"{deleteConfirm?.title}"</strong>? This cannot be undone. Other tasks depending on this will have it removed from their dependencies.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteTask(deleteConfirm)} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Task detail drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onEdit={t => { setSelectedTaskId(null); setEditTask(t); }}
        onDelete={t => { setSelectedTaskId(null); setDeleteConfirm(t); }}
        onRetry={handleRetry}
      />
    </div>
  );
};
