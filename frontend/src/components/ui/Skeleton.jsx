import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton h-4 w-full', className)} {...props} />
);

export const TaskCardSkeleton = () => (
  <div className="cwos-card p-4 space-y-3">
    <div className="flex items-start justify-between">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="cwos-card p-5 space-y-4">
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="cwos-card p-5 space-y-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="cwos-card p-5 space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="cwos-card p-5 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    </div>
  </div>
);
