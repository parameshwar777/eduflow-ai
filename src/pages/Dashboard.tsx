import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DashboardCardSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { api, Subject, StudentStats, Prediction } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardCard {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'destructive';
  change?: string;
}

const TeacherDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const data = await api.getTeacherSubjects(user.id);
        setSubjects(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch subjects');
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const cards: DashboardCard[] = [
    { title: 'Total Subjects', value: subjects.length, icon: BookOpen, color: 'primary' },
    { title: 'Total Classes', value: subjects.reduce((acc, s) => acc + (s.total_classes || 0), 0), icon: TrendingUp, color: 'success' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <DashboardCardSkeleton key={i} />)
          : cards.map((card) => (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard className="relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-${card.color}/10`}>
                      <card.icon className={`w-6 h-6 text-${card.color}`} />
                    </div>
                    {card.change && <span className="text-xs text-muted-foreground">{card.change}</span>}
                  </div>
                  <AnimatedNumber value={card.value} suffix={card.suffix} className="text-3xl font-bold" />
                  <p className="text-muted-foreground text-sm mt-1">{card.title}</p>
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-${card.color}/5 rounded-full blur-2xl`} />
                </GlassCard>
              </motion.div>
            ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Your Subjects</h2>
            <StatusBadge status="info" label={`${subjects.length} Active`} />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No subjects found for this teacher</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.subject_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">{subject.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{subject.total_classes} classes</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const [statsData, predData] = await Promise.all([
          api.getStudentStats(user.id),
          api.getStudentPrediction(user.id),
        ]);
        setStats(statsData);
        setPrediction(predData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch student data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const getRiskStatus = (level: string): 'safe' | 'warning' | 'critical' => {
    switch (level) {
      case 'SAFE':
        return 'safe';
      case 'WARNING':
        return 'warning';
      case 'CRITICAL':
        return 'critical';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <GlassCard className="p-8" hover={false}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <CircularProgress value={stats?.percentage || 0} size={180} strokeWidth={12} />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">Your Attendance Overview</h1>
              <p className="text-muted-foreground mb-4">
                You've attended <span className="text-primary font-semibold">{stats?.attended || 0}</span> out of{' '}
                <span className="font-semibold">{stats?.total || 0}</span> classes this semester
              </p>
              {prediction && (
                <div className="flex items-center gap-3">
                  <StatusBadge status={getRiskStatus(prediction.risk_level)} pulse={prediction.risk_level === 'CRITICAL'} />
                  {prediction.classes_needed > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Need <span className="text-warning font-semibold">{prediction.classes_needed}</span> more classes to reach 80%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </GlassCard>
      </motion.div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  return (
    <GlassCard hover={false}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <p className="text-sm text-muted-foreground">Admin dashboard uses /api/admin/university-stats (wired in Admin Panel).</p>
      </div>
    </GlassCard>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'STUDENT':
        return <StudentDashboard />;
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your attendance system</p>
      </motion.div>
      {renderDashboard()}
    </div>
  );
};
