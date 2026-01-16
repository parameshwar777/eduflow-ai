import React from 'react';
import { motion } from 'framer-motion';
import { Bell, LogOut, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  sidebarCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <StatusBadge status="info" label="Admin" />;
      case 'TEACHER':
        return <StatusBadge status="safe" label="Teacher" />;
      case 'STUDENT':
        return <StatusBadge status="warning" label="Student" />;
      default:
        return null;
    }
  };

  return (
    <motion.header
      initial={false}
      animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-6"
      style={{ left: 0 }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">
          Welcome back, <span className="gradient-text">{user?.name || user?.email}</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {getRoleBadge()}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
          onClick={() => navigate('/alerts')}
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.header>
  );
};
