import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { DashboardCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Department {
  id: number;
  name: string;
  students: number;
  teachers: number;
  avgAttendance: number;
}

interface AtRiskStudent {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  attendance: number;
  classesNeeded: number;
}

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_departments: 0,
    average_attendance: 0,
    at_risk_count: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedDept, setExpandedDept] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));

      setStats({
        total_students: 4250,
        total_teachers: 180,
        total_departments: 12,
        average_attendance: 82.4,
        at_risk_count: 312,
      });

      setDepartments([
        { id: 1, name: 'Computer Science', students: 680, teachers: 32, avgAttendance: 85.2 },
        { id: 2, name: 'Electronics', students: 520, teachers: 28, avgAttendance: 79.8 },
        { id: 3, name: 'Mechanical', students: 610, teachers: 30, avgAttendance: 81.5 },
        { id: 4, name: 'Civil', students: 480, teachers: 25, avgAttendance: 83.1 },
        { id: 5, name: 'Electrical', students: 390, teachers: 22, avgAttendance: 77.9 },
        { id: 6, name: 'Information Technology', students: 550, teachers: 26, avgAttendance: 86.3 },
      ]);

      setAtRiskStudents([
        { id: 1, name: 'Rahul Kumar', rollNo: '21CS045', department: 'CSE', attendance: 62, classesNeeded: 8 },
        { id: 2, name: 'Priya Singh', rollNo: '21EC032', department: 'ECE', attendance: 58, classesNeeded: 12 },
        { id: 3, name: 'Amit Sharma', rollNo: '21ME018', department: 'Mech', attendance: 65, classesNeeded: 6 },
        { id: 4, name: 'Neha Gupta', rollNo: '21CS089', department: 'CSE', attendance: 71, classesNeeded: 4 },
        { id: 5, name: 'Vikram Patel', rollNo: '21IT056', department: 'IT', attendance: 68, classesNeeded: 5 },
      ]);

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.total_students, icon: Users, color: 'primary' },
    { title: 'Total Teachers', value: stats.total_teachers, icon: BookOpen, color: 'success' },
    { title: 'Departments', value: stats.total_departments, icon: Building2, color: 'accent' },
    { title: 'Avg Attendance', value: stats.average_attendance, suffix: '%', icon: TrendingUp, color: 'success' },
    { title: 'At-Risk Students', value: stats.at_risk_count, icon: AlertTriangle, color: 'warning' },
  ];

  const filteredStudents = atRiskStudents
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => 
      sortOrder === 'asc' ? a.attendance - b.attendance : b.attendance - a.attendance
    );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">University-wide attendance overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="bg-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <DashboardCardSkeleton key={i} />)
          : cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${card.color}/10 flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 text-${card.color}`} />
                  </div>
                  <AnimatedNumber value={card.value} suffix={card.suffix} className="text-2xl font-bold" />
                  <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                </GlassCard>
              </motion.div>
            ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Department Overview</h2>
              <StatusBadge status="info" label={`${departments.length} Active`} />
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {departments.map((dept, index) => (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="rounded-lg bg-secondary/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <CircularProgress value={dept.avgAttendance} size={40} strokeWidth={4} showValue={false} />
                        <motion.div
                          animate={{ rotate: expandedDept === dept.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedDept === dept.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 border-t border-border"
                        >
                          <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-primary">{dept.students}</p>
                              <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-success">{dept.teachers}</p>
                              <p className="text-xs text-muted-foreground">Teachers</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{dept.avgAttendance}%</p>
                              <p className="text-xs text-muted-foreground">Attendance</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* At-Risk Students */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                At-Risk Students
              </h2>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sort
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary"
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-secondary/50 border border-transparent hover:border-warning/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.rollNo} • {student.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          student.attendance < 60 ? 'text-destructive' : 'text-warning'
                        }`}>
                          {student.attendance}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Need {student.classesNeeded} classes
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
