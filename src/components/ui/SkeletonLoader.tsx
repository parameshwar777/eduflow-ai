import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rectangular' }) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-32 rounded-xl',
  };

  return (
    <div className={cn('skeleton-loader', variants[variant], className)} />
  );
};

export const DashboardCardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-8 w-24" />
    <Skeleton className="h-4 w-32" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);
