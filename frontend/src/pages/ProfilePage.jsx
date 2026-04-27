import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { formatDate } from '../lib/utils';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '', preferences: user?.preferences || { theme: 'system', notifications: true } }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const r = await authAPI.updateProfile(data);
      updateUser(r.data.user);
      toast({ type: 'success', title: 'Profile updated!' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to update' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </motion.div>

      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-5">
          <Avatar user={user} size="xl" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" /> {user?.role}
              </span>
              <span className="text-xs text-muted-foreground">Member since {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card>
        <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Display name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
                className="cwos-input pl-9" />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={user?.email} disabled className="cwos-input pl-9 opacity-60 cursor-not-allowed" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </form>
      </Card>

      {/* Theme */}
      <Card>
        <h3 className="font-semibold text-foreground mb-4">Appearance</h3>
        <div className="flex gap-3">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
          ].map(({ value, icon: Icon, label }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
              <Icon className={`w-5 h-5 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
