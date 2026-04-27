import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, CheckCircle, LayoutGrid, GitBranch, Activity, Webhook, Play, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';

const features = [
  { icon: LayoutGrid, title: 'Kanban & Table Views', desc: 'Switch between beautiful Kanban boards and powerful table views with one click.' },
  { icon: GitBranch, title: 'Smart Dependency Engine', desc: 'Define task dependencies with automatic cycle detection and visual blocking.' },
  { icon: Play, title: 'Execution Planner', desc: 'AI-powered task scheduling respecting priorities, resources and dependencies.' },
  { icon: Activity, title: 'Real-Time Collaboration', desc: 'Live updates via Socket.IO — no refresh needed. See changes the moment they happen.' },
  { icon: Webhook, title: 'Webhook Integrations', desc: 'Trigger external services when tasks complete, with retry logic and delivery logs.' },
  { icon: Users, title: 'Team Management', desc: 'Invite members via secure token links with expiration. Manage roles and permissions.' },
];

export const LandingPage = () => (
  <div className="min-h-screen bg-background">
    {/* Nav */}
    <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg">CWOS</span>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
        <Link to="/signup"><Button>Get started free</Button></Link>
      </div>
    </nav>

    {/* Hero */}
    <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" /> Collaborative Workflow Orchestration
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-foreground leading-tight mb-6">
          Orchestrate your team's<br />
          <span className="text-primary">workflow with precision</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Real-time task management with smart dependency tracking, execution planning, daily simulation engine, and webhook integrations — all in one beautiful platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="text-base px-8">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="text-base px-8">Sign in</Button>
          </Link>
        </div>
      </motion.div>

      {/* Hero visual */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-16 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="bg-[hsl(var(--sidebar-bg))] px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">{['bg-red-400','bg-amber-400','bg-emerald-400'].map(c => <div key={c} className={`w-3 h-3 rounded-full ${c}`} />)}</div>
          <div className="flex-1 bg-white/10 rounded-md h-5 mx-4" />
        </div>
        <div className="p-6 grid grid-cols-5 gap-3 bg-gradient-to-b from-background to-muted/30">
          {['Pending','Running','Completed','Failed','Blocked'].map((s, i) => (
            <div key={s} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground px-1">{s} <span className="ml-1 bg-muted px-1.5 rounded-full">{[3,2,5,1,1][i]}</span></div>
              {Array.from({ length: [3,2,5,1,1][i] }).map((_, j) => (
                <div key={j} className="cwos-card p-3 space-y-2">
                  <div className="h-2.5 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-3/4" />
                  <div className="flex gap-1"><div className="h-4 bg-muted rounded-full w-12" /><div className="h-4 bg-muted rounded-full w-10" /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* Features */}
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold text-foreground mb-3">Everything your team needs</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built for modern engineering teams that move fast and ship quality work.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
            <div className="cwos-card p-6 h-full hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="border-t border-border">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to orchestrate your workflow?</h2>
        <p className="text-muted-foreground mb-8">Join teams shipping faster with CWOS. Free to get started.</p>
        <Link to="/signup">
          <Button size="lg" className="text-base px-10">Create free account <ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </div>
    </section>

    <footer className="border-t border-border text-center py-6 text-sm text-muted-foreground">
      © {new Date().getFullYear()} CWOS — Collaborative Workflow Orchestration System
    </footer>
  </div>
);
