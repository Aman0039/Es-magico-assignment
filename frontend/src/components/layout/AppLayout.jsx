import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useApp } from '../../context/AppContext';

export const AppLayout = () => {
  const { sidebarOpen } = useApp();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <motion.main
        animate={{ marginLeft: sidebarOpen ? 240 : 68 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto min-w-0"
      >
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};
