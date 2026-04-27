import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical, Play, Clock, Star, AlertTriangle, SkipForward, BarChart3 } from 'lucide-react';
import { projectsAPI, tasksAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PriorityBadge, Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export const SimulationPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { availableHours: 8 } });

  useEffect(() => {
    Promise.all([projectsAPI.getOne(id), tasksAPI.getByProject(id)]).then(([pRes, tRes]) => {
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    }).catch(console.error);
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const failedIds = data.failedTaskIds ? data.failedTaskIds.split(',').map(s => s.trim()).filter(Boolean) : [];
      const r = await projectsAPI.simulate(id, { availableHours: parseFloat(data.availableHours), failedTaskIds: failedIds });
      setResult(r.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link to={`/projects/${id}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" /> Daily Simulation
          </h1>
          <p className="text-muted-foreground mt-1">Simulate what gets done in a day for <strong>{project?.name}</strong></p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <Card className="lg:col-span-1 h-fit">
          <h3 className="font-semibold text-foreground mb-4">Simulation Parameters</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Available hours today</label>
              <input {...register('availableHours', { required: 'Required', min: { value: 0.5, message: 'Min 0.5h' }, max: { value: 24, message: 'Max 24h' } })}
                type="number" step="0.5" min="0.5" max="24" className="cwos-input" />
              {errors.availableHours && <p className="text-xs text-destructive">{errors.availableHours.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mark tasks as failed (IDs, comma-separated)</label>
              <textarea {...register('failedTaskIds')} rows={2} className="cwos-input resize-none text-xs" placeholder="Optional: paste task IDs to simulate failures" />
              <p className="text-xs text-muted-foreground">Leave empty to use current task statuses</p>
            </div>

            {tasks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Available tasks ({tasks.filter(t => t.status !== 'Completed').length})</p>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {tasks.filter(t => t.status !== 'Completed').map(t => (
                    <div key={t._id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-accent">
                      <span className="truncate text-foreground">{t.title}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{t.estimatedHours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Play className="w-4 h-4" /> Run Simulation
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {!result ? (
            <Card className="py-16">
              <EmptyState icon={FlaskConical} title="Ready to simulate" description="Configure your available hours and click 'Run Simulation' to see which tasks can be completed today." />
            </Card>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Hours Available', value: `${result.summary.availableHours}h`, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Hours Used', value: `${result.summary.hoursUsed}h`, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Tasks Selected', value: result.summary.tasksSelected, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Priority Score', value: result.totalPriorityScore, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Card className="py-3">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="text-xl font-bold text-foreground">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Hour usage bar */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Hour utilization</span>
                  <span className="text-sm text-muted-foreground">{result.summary.hoursUsed}h / {result.summary.availableHours}h</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (result.summary.hoursUsed / result.summary.availableHours) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round((result.summary.hoursUsed / result.summary.availableHours) * 100)}% utilized</span>
                  <span>{result.summary.hoursRemaining}h remaining</span>
                </div>
              </Card>

              {/* Selected tasks */}
              <Card>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-500" /> Will Execute Today
                  <Badge variant="success">{result.selectedTasks.length}</Badge>
                </h3>
                <div className="space-y-2.5">
                  {result.executionOrder.map((task, i) => (
                    <motion.div key={task._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/10">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {task.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.estimatedHours}h · {task.resourceTag || 'No resource tag'}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </motion.div>
                  ))}
                  {result.selectedTasks.length === 0 && (
                    <p className="text-center py-6 text-muted-foreground text-sm">No tasks fit within available hours</p>
                  )}
                </div>
              </Card>

              {/* Skipped + Blocked */}
              {(result.blockedTasks.length > 0 || result.skippedTasks.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.blockedTasks.length > 0 && (
                    <Card>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Blocked <Badge variant="danger">{result.blockedTasks.length}</Badge>
                      </h3>
                      {result.blockedTasks.map(t => <p key={t._id} className="text-xs text-muted-foreground py-1 border-b border-border last:border-0 truncate">{t.title}</p>)}
                    </Card>
                  )}
                  {result.skippedTasks.length > 0 && (
                    <Card>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                        <SkipForward className="w-4 h-4 text-gray-400" /> Skipped <Badge variant="outline">{result.skippedTasks.length}</Badge>
                      </h3>
                      {result.skippedTasks.map(t => <p key={t._id} className="text-xs text-muted-foreground py-1 border-b border-border last:border-0 truncate">{t.title}</p>)}
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
