import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type StatusType = 'safe' | 'warning' | 'critical' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  pulse = false,
  className,
}) => {
  const statusConfig = {
    safe: {
      bg: 'bg-success/20',
      text: 'text-success',
      border: 'border-success/30',
      label: label || 'Safe',
    },
    warning: {
      bg: 'bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/30',
      label: label || 'Warning',
    },
    critical: {
      bg: 'bg-destructive/20',
      text: 'text-destructive',
      border: 'border-destructive/30',
      label: label || 'Critical',
    },
    info: {
      bg: 'bg-primary/20',
      text: 'text-primary',
      border: 'border-primary/30',
      label: label || 'Info',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        pulse && 'animate-pulse',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.text.replace('text-', 'bg-'))} />
      {config.label}
    </motion.span>
  );
};
