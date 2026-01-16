import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  Check,
  Clock,
  Shield,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Alert, api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ExtendedAlert extends Alert {
  read: boolean;
  timestamp: string;
}

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ExtendedAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await api.getAlerts(user.id);
        const extended: ExtendedAlert[] = data.map((a, i) => ({
          ...a,
          id: a.id ?? i,
          read: false,
          timestamp: a.created_at || 'Just now',
        }));
        setAlerts(extended);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, [user]);

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'LOW_ATTENDANCE':
        return <AlertTriangle className={`w-5 h-5 ${severity === 'HIGH' ? 'text-destructive' : 'text-warning'}`} />;
      case 'PROXY_DETECTED':
        return <Shield className="w-5 h-5 text-destructive" />;
      case 'LOW_CONFIDENCE':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getSeverityStatus = (severity: string): 'safe' | 'warning' | 'critical' | 'info' => {
    switch (severity) {
      case 'HIGH': return 'critical';
      case 'MEDIUM': return 'warning';
      default: return 'info';
    }
  };

  const markAsRead = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const dismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'high') return alert.severity === 'HIGH';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium"
            >
              {unreadCount} new
            </motion.span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'high', label: 'Critical' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value as typeof filter)}
              className={filter === f.value ? 'bg-primary' : ''}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard 
                hover={false}
                className={`relative overflow-hidden ${
                  !alert.read ? 'border-l-4 border-l-primary' : ''
                } ${
                  alert.severity === 'HIGH' && !alert.read ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    alert.severity === 'HIGH' ? 'bg-destructive/10' :
                    alert.severity === 'MEDIUM' ? 'bg-warning/10' : 'bg-primary/10'
                  }`}>
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge 
                        status={getSeverityStatus(alert.severity)} 
                        label={alert.severity}
                        pulse={alert.severity === 'HIGH' && !alert.read}
                      />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm ${!alert.read ? 'font-medium' : 'text-muted-foreground'}`}>
                      {alert.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.read && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsRead(alert.id!)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-success" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => dismissAlert(alert.id!)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>
                </div>

                {/* Severity indicator */}
                {alert.severity === 'HIGH' && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full blur-2xl" />
                )}
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">No alerts to show</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'unread' ? 'All caught up!' : 'You have no alerts at the moment'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
