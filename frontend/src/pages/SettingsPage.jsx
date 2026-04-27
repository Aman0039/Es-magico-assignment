import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Database, Webhook, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your workspace preferences</p>
      </motion.div>

      <Card>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notifications</h3>
        <div className="space-y-3">
          {[
            { label: 'Task updates', desc: 'Get notified when tasks are updated', key: 'tasks' },
            { label: 'Member activity', desc: 'When someone joins your project', key: 'members' },
            { label: 'Webhook failures', desc: 'Alert when webhooks fail to deliver', key: 'webhooks' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => !n)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Security</h3>
        <div className="space-y-2">
          {[
            { label: 'Change password', desc: 'Update your account password' },
            { label: 'Active sessions', desc: 'Manage devices signed into your account' },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Data & Privacy</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-foreground">Export your data</p>
              <p className="text-xs text-muted-foreground">Download all your projects and tasks</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </div>
  );
};
