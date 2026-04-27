import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Card = ({ children, className, hover = false, onClick, ...props }) => {
  const Component = hover || onClick ? motion.div : 'div';
  const motionProps = hover || onClick ? { whileHover: { y: -2 }, transition: { duration: 0.15 } } : {};
  return (
    <Component
      className={cn('cwos-card p-5', hover && 'cursor-pointer', className)}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn('font-semibold text-base text-foreground', className)}>{children}</h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);
