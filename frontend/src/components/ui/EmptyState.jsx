import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
  >
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-accent-foreground opacity-60" />
      </div>
    )}
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>}
    {action}
  </motion.div>
);
