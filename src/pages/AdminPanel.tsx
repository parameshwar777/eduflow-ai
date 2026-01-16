import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { DashboardCardSkeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, UniversityStats } from '@/lib/api';
import { toast } from 'sonner';

interface Department {
  id: number;
  name: string;
  students: number;
  teachers: number;
  avgAttendance: number;
}

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<UniversityStats & { total_departments?: number }>({
    total_students: 0,
    total_teachers: 0,
    average_attendance: 0,
    at_risk_students: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedDept, setExpandedDept] = useState<number | null>(null);

  // Modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getUniversityStats();
        setStats(data);
        setDepartments([]);
      } catch (err) {
        console.error('Failed to fetch university stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.total_students, icon: Users, color: 'primary' },
    { title: 'Total Teachers', value: stats.total_teachers, icon: BookOpen, color: 'success' },
    { title: 'Departments', value: stats.total_departments || departments.length, icon: Building2, color: 'accent' },
    { title: 'Avg Attendance', value: stats.average_attendance, suffix: '%', icon: TrendingUp, color: 'success' },
    { title: 'At-Risk Students', value: stats.at_risk_students, icon: AlertTriangle, color: 'warning' },
  ];

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    setIsCreatingDept(true);
    try {
      await api.createDepartment(newDeptName);
      toast.success(`Department "${newDeptName}" created successfully`);
      setShowDeptModal(false);
      setNewDeptName('');
      // Refresh stats
      const data = await api.getUniversityStats();
      setStats(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
  };

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
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="bg-primary flex items-center gap-2" onClick={() => setShowDeptModal(true)}>
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

            {departments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No departments yet</p>
                <p className="text-sm text-muted-foreground">Create your first department to get started</p>
                <Button className="mt-4" onClick={() => setShowDeptModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Department
                </Button>
              </div>
            ) : (
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
            )}
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

            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No at-risk students</p>
              <p className="text-sm text-muted-foreground">Data will appear once attendance is tracked</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Create Department Modal */}
      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new department to your university
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name</Label>
              <Input
                id="deptName"
                placeholder="e.g., Computer Science"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeptModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDepartment} disabled={isCreatingDept}>
                {isCreatingDept ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Department'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
