import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
        <Zap className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h1 className="text-8xl font-black text-foreground/10">404</h1>
        <h2 className="text-2xl font-bold text-foreground mt-2">Page not found</h2>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/dashboard">
        <Button size="lg"><Home className="w-4 h-4" /> Back to Dashboard</Button>
      </Link>
    </motion.div>
  </div>
);
