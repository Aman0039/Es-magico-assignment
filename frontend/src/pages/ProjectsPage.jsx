import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Search, FolderKanban, Users, Calendar, MoreHorizontal, Trash2, Edit, ExternalLink, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectsAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ProjectCardSkeleton } from '../components/ui/Skeleton';
import { formatDate } from '../lib/utils';

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316'];

const ProjectForm = ({ onSubmit, defaultValues, loading, onClose }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({ defaultValues });
  const selectedColor = watch('color', defaultValues?.color || '#6366f1');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Project name *</label>
        <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
          className="cwos-input" placeholder="e.g. Product Redesign Q1" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea {...register('description')} rows={3} className="cwos-input resize-none" placeholder="What is this project about?" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Webhook URL (optional)</label>
        <input {...register('webhookUrl')} className="cwos-input" placeholder="https://your-endpoint.com/webhook" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Project color</label>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_COLORS.map(c => (
            <button type="button" key={c} onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-lg transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
              style={{ background: c }} />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues?._id ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export const ProjectsPage = () => {
  const { projects, setProjects, addProject, updateProject, deleteProject } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    projectsAPI.getAll().then(r => { setProjects(r.data.projects); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      const r = await projectsAPI.create(data);
      addProject(r.data.project);
      setShowCreate(false);
      toast({ type: 'success', title: 'Project created!', message: r.data.project.name });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to create project' });
    } finally { setFormLoading(false); }
  };

  const handleEdit = async (data) => {
    setFormLoading(true);
    try {
      const r = await projectsAPI.update(editProject._id, data);
      updateProject(r.data.project);
      setEditProject(null);
      toast({ type: 'success', title: 'Project updated!' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to update' });
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await projectsAPI.delete(id);
      deleteProject(id);
      setDeleteConfirm(null);
      toast({ type: 'success', title: 'Project deleted' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete project' });
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Project</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
          className="cwos-input pl-9" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title={search ? 'No projects match your search' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={!search && <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Project</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((project, i) => {
              const isOwner = project.owner?._id === user?._id || project.owner === user?._id;
              return (
                <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-all duration-200 group relative">
                    {/* Color accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: project.color || '#6366f1' }} />

                    <div className="flex items-start gap-3 mt-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0" style={{ background: project.color || '#6366f1' }}>
                        {project.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/projects/${project._id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description || 'No description'}</p>
                      </div>
                      {isOwner && (
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === project._id ? null : project._id)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {openMenu === project._id && (
                              <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl z-20 w-44 py-1 overflow-hidden">
                                <button onClick={() => { setEditProject(project); setOpenMenu(null); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                                  <Edit className="w-4 h-4 text-muted-foreground" /> Edit project
                                </button>
                                <Link to={`/projects/${project._id}`} onClick={() => setOpenMenu(null)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors">
                                  <ExternalLink className="w-4 h-4 text-muted-foreground" /> Open project
                                </Link>
                                <hr className="my-1 border-border" />
                                <button onClick={() => { setDeleteConfirm(project); setOpenMenu(null); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-destructive transition-colors text-left">
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{(project.members?.length || 0) + 1} member{(project.members?.length || 0) !== 0 ? 's' : ''}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(project.createdAt)}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {project.status}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" size="md">
        <ProjectForm onSubmit={handleCreate} loading={formLoading} onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project" size="md">
        {editProject && <ProjectForm onSubmit={handleEdit} defaultValues={editProject} loading={formLoading} onClose={() => setEditProject(null)} />}
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Project" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground">Are you sure you want to delete <strong className="text-foreground">"{deleteConfirm?.name}"</strong>? This will also delete all tasks inside it. This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm._id)} className="flex-1">Delete Project</Button>
          </div>
        </div>
      </Modal>

      {/* Click outside for menu */}
      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  );
};
