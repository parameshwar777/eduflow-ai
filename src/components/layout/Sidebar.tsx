import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  BookOpen, 
  BarChart3, 
  Bell, 
  ChevronLeft,
  Users,
  Building2,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['TEACHER', 'STUDENT', 'ADMIN'] },
  { icon: Camera, label: 'Mark Attendance', path: '/attendance/mark', roles: ['TEACHER'] },
  { icon: UserPlus, label: 'Student Training', path: '/training', roles: ['TEACHER', 'ADMIN'] },
  { icon: BookOpen, label: 'Subjects', path: '/subjects', roles: ['TEACHER'] },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['TEACHER', 'STUDENT', 'ADMIN'] },
  { icon: Bell, label: 'Alerts', path: '/alerts', roles: ['TEACHER', 'STUDENT', 'ADMIN'] },
  { icon: Users, label: 'Students', path: '/admin/students', roles: ['ADMIN'] },
  { icon: Building2, label: 'Departments', path: '/admin/departments', roles: ['ADMIN'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="font-bold text-lg gradient-text">AttendAI</span>
            </motion.div>
          )}
        </AnimatePresence>
        {isCollapsed && <GraduationCap className="w-8 h-8 text-primary mx-auto" />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-hidden">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-sidebar-accent group',
                    isActive && 'bg-sidebar-accent text-primary'
                  )}
                >
                  <item.icon 
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )} 
                  />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className={cn(
                          'text-sm font-medium whitespace-nowrap overflow-hidden',
                          isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
};
