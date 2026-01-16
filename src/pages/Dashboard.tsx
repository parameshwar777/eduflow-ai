import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DashboardCardSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { api, Subject, StudentStats, Prediction } from '@/lib/api';

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
      setIsLoading(true);
      try {
        const data = await api.getTeacherSubjects(user?.id || 1);
        setSubjects(data);
      } catch (error) {
        // Demo data
        setSubjects([
          { subject_id: 1, name: 'Machine Learning', class: '3-CSE-A', total_classes: 42 },
          { subject_id: 2, name: 'Data Structures', class: '2-CSE-B', total_classes: 38 },
          { subject_id: 3, name: 'Database Systems', class: '3-CSE-A', total_classes: 35 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const cards: DashboardCard[] = [
    { title: 'Total Classes Today', value: 4, icon: BookOpen, color: 'primary', change: '+2 from yesterday' },
    { title: 'Students Detected', value: 127, icon: Users, color: 'success', change: '98% accuracy' },
    { title: 'Avg Attendance', value: 84.5, suffix: '%', icon: TrendingUp, color: 'success', change: '+3.2% this week' },
    { title: 'At-Risk Students', value: 12, icon: AlertTriangle, color: 'warning', change: 'Below 75%' },
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
      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <DashboardCardSkeleton key={i} />
            ))
          : cards.map((card, index) => (
              <motion.div key={card.title} variants={itemVariants}>
                <GlassCard className="relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-${card.color}/10`}>
                      <card.icon className={`w-6 h-6 text-${card.color}`} />
                    </div>
                    {card.change && (
                      <span className="text-xs text-muted-foreground">{card.change}</span>
                    )}
                  </div>
                  <AnimatedNumber
                    value={card.value}
                    suffix={card.suffix}
                    className="text-3xl font-bold"
                  />
                  <p className="text-muted-foreground text-sm mt-1">{card.title}</p>
                  
                  {/* Glow effect */}
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-${card.color}/5 rounded-full blur-2xl`} />
                </GlassCard>
              </motion.div>
            ))}
      </motion.div>

      {/* Recent Classes & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Your Subjects</h2>
              <StatusBadge status="info" label={`${subjects.length} Active`} />
            </div>
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.subject_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
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
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Today's Schedule</h2>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[
                { time: '09:00 AM', subject: 'Machine Learning', class: '3-CSE-A', status: 'completed' },
                { time: '11:00 AM', subject: 'Data Structures', class: '2-CSE-B', status: 'completed' },
                { time: '02:00 PM', subject: 'Database Systems', class: '3-CSE-A', status: 'ongoing' },
                { time: '04:00 PM', subject: 'Machine Learning', class: '3-CSE-B', status: 'upcoming' },
              ].map((schedule, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-2 text-muted-foreground min-w-[90px]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{schedule.time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{schedule.subject}</p>
                    <p className="text-sm text-muted-foreground">{schedule.class}</p>
                  </div>
                  <StatusBadge 
                    status={schedule.status === 'completed' ? 'safe' : schedule.status === 'ongoing' ? 'warning' : 'info'} 
                    label={schedule.status}
                  />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
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
      setIsLoading(true);
      try {
        const [statsData, predData] = await Promise.all([
          api.getStudentStats(user?.id || 1),
          api.getStudentPrediction(user?.id || 1),
        ]);
        setStats(statsData);
        setPrediction(predData);
      } catch (error) {
        // Demo data
        setStats({ attended: 32, missed: 8, total: 40, percentage: 80 });
        setPrediction({ classes_needed: 3, risk_level: 'WARNING' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getRiskStatus = (level: string): 'safe' | 'warning' | 'critical' => {
    switch (level) {
      case 'SAFE': return 'safe';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'critical';
      default: return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
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
          
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </GlassCard>
      </motion.div>

      {/* Subject-wise Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Subject-wise Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Machine Learning', attended: 18, total: 21, percentage: 85.7 },
            { name: 'Data Structures', attended: 14, total: 19, percentage: 73.7 },
            { name: 'Database Systems', attended: 12, total: 15, percentage: 80 },
          ].map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{subject.name}</h3>
                  <StatusBadge 
                    status={subject.percentage >= 80 ? 'safe' : subject.percentage >= 60 ? 'warning' : 'critical'} 
                    label={`${subject.percentage.toFixed(1)}%`}
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        subject.percentage >= 80 ? 'bg-success' : subject.percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subject.attended} attended • {subject.total - subject.attended} missed
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    average_attendance: 0,
    at_risk_students: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getUniversityStats();
        setStats(data);
      } catch (error) {
        // Demo data
        setStats({
          total_students: 1200,
          total_teachers: 80,
          average_attendance: 82.4,
          at_risk_students: 134,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.total_students, icon: Users, color: 'primary' },
    { title: 'Total Teachers', value: stats.total_teachers, icon: BookOpen, color: 'success' },
    { title: 'Avg Attendance', value: stats.average_attendance, suffix: '%', icon: TrendingUp, color: 'success' },
    { title: 'At-Risk Students', value: stats.at_risk_students, icon: AlertTriangle, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${card.color}/10`}>
                  <card.icon className={`w-6 h-6 text-${card.color}`} />
                </div>
                <div>
                  <AnimatedNumber value={card.value} suffix={card.suffix} className="text-2xl font-bold" />
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your attendance system</p>
      </motion.div>
      {renderDashboard()}
    </div>
  );
};
