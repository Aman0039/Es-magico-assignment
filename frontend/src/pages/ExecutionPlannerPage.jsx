import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Cpu, Play, Clock, Tag, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { projectsAPI, projectsAPI as api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatusBadge, PriorityBadge, Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export const ExecutionPlannerPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    projectsAPI.getOne(id).then(r => setProject(r.data.project)).catch(console.error);
  }, [id]);

  const compute = async () => {
    setLoading(true);
    try {
      const r = await projectsAPI.computeExecution(id);
      setResult(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link to={`/projects/${id}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> Execution Planner
          </h1>
          <p className="text-muted-foreground mt-1">Compute the optimal task execution order for <strong>{project?.name}</strong></p>
        </div>
        <Button className="ml-auto" onClick={compute} loading={loading}>
          <Play className="w-4 h-4" /> Compute Execution
        </Button>
      </motion.div>

      {!result ? (
        <Card className="py-16">
          <EmptyState icon={Cpu} title="No execution plan yet" description="Click 'Compute Execution' to analyze your project's tasks and generate an optimal execution order based on priorities, dependencies, and resource constraints." />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks', value: result.summary.total, icon: Cpu, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Will Execute', value: result.summary.executionCount, icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Runnable', value: result.summary.runnable, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Blocked', value: result.summary.blocked, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Execution order */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Execution Order
              <Badge variant="primary">{result.executionOrder.length} tasks</Badge>
            </h3>
            <div className="space-y-2.5">
              {result.executionOrder.map((task, i) => (
                <motion.div key={task._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{task.estimatedHours}h</span>
                      {task.resourceTag && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Tag className="w-3 h-3" />{task.resourceTag}</span>}
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </motion.div>
              ))}
              {result.executionOrder.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No executable tasks available</p>
              )}
            </div>
          </Card>

          {/* Blocked tasks */}
          {result.blockedTasks.length > 0 && (
            <Card>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Blocked Tasks
                <Badge variant="danger">{result.blockedTasks.length}</Badge>
              </h3>
              <div className="space-y-2">
                {result.blockedTasks.map(task => (
                  <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm text-red-800 dark:text-red-300">{task.title}</span>
                    <StatusBadge status={task.status} className="ml-auto" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
