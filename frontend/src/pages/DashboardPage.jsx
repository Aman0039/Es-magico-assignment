import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderKanban, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight, TrendingUp, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { projectsAPI, auditAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/Badge';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { formatRelativeTime } from '../lib/utils';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#6b7280'];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { projects, setProjects } = useApp();
  const [stats, setStats] = useState({ total: 0, pending: 0, running: 0, completed: 0, failed: 0, blocked: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, auditRes] = await Promise.all([
          projectsAPI.getAll(),
          auditAPI.getMe()
        ]);
        const projs = projRes.data.projects;
        setProjects(projs);
        setRecentActivity(auditRes.data.logs.slice(0, 8));

        // Aggregate task stats from projects
        let total = 0, pending = 0, running = 0, completed = 0, failed = 0, blocked = 0;
        // Generate mock chart data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setChartData(days.map(day => ({
          day,
          completed: 0,
          created: 0,
        })));

        setStats({ total: projs.length, pending: 0, running: 0, completed: 0, failed: 0, blocked: 0});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const pieData = [
    { name: 'Pending', value: stats.pending || 0 },
    { name: 'Running', value: stats.running || 0 },
    { name: 'Completed', value: stats.completed || 0 },
    { name: 'Failed', value: stats.failed || 0 },
    { name: 'Blocked', value: stats.blocked || 0 },
  ];

  const statCards = [
    { icon: FolderKanban, label: 'Total Projects', value: projects.length, color: 'text-primary', bg: 'bg-primary/10', change: '+2 this week' },
    { icon: Clock, label: 'Pending Tasks', value: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/10', change: '5 due today' },
    { icon: Zap, label: 'Running Tasks', value: stats.running, color: 'text-blue-500', bg: 'bg-blue-500/10', change: 'Active now' },
    { icon: CheckCircle, label: 'Completed', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: '+12 this week' },
  ];

  const actionVerbs = {
    task_create: 'created task',
    task_update: 'updated task',
    task_delete: 'deleted task',
    task_status_change: 'changed status',
    project_create: 'created project',
    member_join: 'joined project',
    login: 'signed in',
    signup: 'created account',
    invite_generate: 'generated invite',
    task_retry: 'retried task',
    webhook_fired: 'webhook fired',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>
        <Link to="/projects">
          <Button>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />{s.change}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Task Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tasks created vs completed this week</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: 12 }} />
                <Area type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#grad2)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <h3 className="font-semibold text-foreground mb-1">Task Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">By status across all projects</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Projects</h3>
              <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 4).map(p => (
                <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: p.color || '#6366f1' }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.members?.length || 0} members</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8">
                  <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                  <Link to="/projects"><Button variant="ghost" size="sm" className="mt-2">Create one</Button></Link>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
              <Link to="/activity" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.map((log, i) => (
                <div key={log._id || i} className="flex items-start gap-3">
                  <Avatar user={log.actor} size="sm" className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.actor?.name || 'Unknown'}</span>{' '}
                      <span className="text-muted-foreground">{actionVerbs[log.action] || log.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
