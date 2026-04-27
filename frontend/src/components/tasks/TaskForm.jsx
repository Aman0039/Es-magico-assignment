import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const STATUSES = ['Pending', 'Running', 'Completed', 'Failed', 'Blocked'];

export const TaskForm = ({ onSubmit, defaultValues, loading, onClose, tasks = [], editingTaskId }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 3,
      estimatedHours: 1,
      status: 'Pending',
      resourceTag: '',
      maxRetries: 3,
      dependencies: [],
      ...defaultValues
    }
  });

  useEffect(() => { if (defaultValues) reset({ ...defaultValues, dependencies: defaultValues.dependencies?.map(d => d._id || d) || [] }); }, [defaultValues]);

  const availableDeps = tasks.filter(t => t._id !== editingTaskId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Title *</label>
        <input {...register('title', { required: 'Title is required', minLength: { value: 2, message: 'Min 2 chars' } })}
          className="cwos-input" placeholder="e.g. Set up CI/CD pipeline" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea {...register('description')} rows={3} className="cwos-input resize-none" placeholder="Task details..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Priority (1–5)</label>
          <select {...register('priority', { valueAsNumber: true })} className="cwos-input">
            <option value={1}>1 — Trivial</option>
            <option value={2}>2 — Low</option>
            <option value={3}>3 — Medium</option>
            <option value={4}>4 — High</option>
            <option value={5}>5 — Critical</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Status</label>
          <select {...register('status')} className="cwos-input">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Estimated hours</label>
          <input {...register('estimatedHours', { valueAsNumber: true, min: { value: 0.5, message: 'Min 0.5h' } })}
            type="number" step="0.5" min="0.5" className="cwos-input" />
          {errors.estimatedHours && <p className="text-xs text-destructive">{errors.estimatedHours.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Max retries</label>
          <input {...register('maxRetries', { valueAsNumber: true })} type="number" min="0" max="10" className="cwos-input" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Resource tag</label>
        <input {...register('resourceTag')} className="cwos-input" placeholder="e.g. gpu, cpu, db" />
        <p className="text-xs text-muted-foreground">Tasks with the same tag won't run concurrently</p>
      </div>

      {availableDeps.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Dependencies</label>
          <div className="max-h-36 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {availableDeps.map(t => (
              <label key={t._id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer text-sm">
                <input type="checkbox" value={t._id} {...register('dependencies')} className="rounded border-border" />
                <span className="flex-1 truncate text-foreground">{t.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{t.status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues?._id ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};
