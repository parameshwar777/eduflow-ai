import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/contexts/AuthContext';
import { api, AttendanceTrend, Subject } from '@/lib/api';

export const Analytics: React.FC = () => {
  const [trendData, setTrendData] = useState<{ date: string; attendance: number }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [calendarData, setCalendarData] = useState<{ date: string; status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subjects for teacher
        if (user?.role === 'TEACHER' && user?.id) {
          const subjectsData = await api.getTeacherSubjects(user.id);
          setSubjects(subjectsData);
          
          // Fetch trend for first subject if available
          if (subjectsData.length > 0 && selectedSubject !== 'all') {
            const subjectId = Number(selectedSubject);
            const trend = await api.getAttendanceTrend(subjectId);
            const formatted = trend.dates.map((date, i) => ({
              date: date.split('-').slice(1).join('/'),
              attendance: trend.attendance[i],
            }));
            setTrendData(formatted);
          }
        }
        
        // Fetch calendar for student
        if (user?.role === 'STUDENT' && user?.id) {
          const calendar = await api.getAttendanceCalendar(user.id);
          const entries = Object.entries(calendar).map(([date, status]) => ({
            date,
            status: status as 'PRESENT' | 'ABSENT',
          }));
          setCalendarData(entries);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, selectedSubject, dateRange]);

  // Calculate pie data from trend or calendar
  const presentCount = calendarData.filter(d => d.status === 'PRESENT').length;
  const absentCount = calendarData.filter(d => d.status === 'ABSENT').length;
  const total = presentCount + absentCount;
  
  const pieData = total > 0 ? [
    { name: 'Present', value: Math.round((presentCount / total) * 100), color: 'hsl(142, 71%, 45%)' },
    { name: 'Absent', value: Math.round((absentCount / total) * 100), color: 'hsl(0, 72%, 51%)' },
  ] : [
    { name: 'No Data', value: 100, color: 'hsl(var(--muted))' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-primary font-bold">{payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Attendance Analytics</h1>
          <p className="text-muted-foreground">Detailed insights and trends</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {subjects.length > 0 && (
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="appearance-none bg-secondary px-4 py-2 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-secondary px-4 py-2 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Attendance Trend
              </h2>
              {trendData.length > 0 && <StatusBadge status="safe" label="Live Data" />}
            </div>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No trend data available</p>
                  <p className="text-sm text-muted-foreground">Select a subject to view attendance trends</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      domain={[60, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-6">Overall Distribution</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="w-32 h-32 rounded-full" variant="circular" />
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Subject-wise Stats */}
      {subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold mb-6">Subject-wise Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.subject_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 rounded-lg bg-secondary/50 text-center"
                >
                  <CircularProgress value={75} size={80} strokeWidth={6} />
                  <h3 className="font-medium mt-3">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground">{subject.class}</p>
                  <p className="text-xs text-muted-foreground">{subject.total_classes} classes</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Attendance Calendar */}
      {calendarData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Attendance Calendar
              </h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-destructive" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                  {day}
                </div>
              ))}
              {calendarData.slice(0, 35).map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.02 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                    day.status === 'PRESENT' ? 'bg-success/20 text-success' :
                    day.status === 'ABSENT' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {new Date(day.date).getDate()}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && trendData.length === 0 && calendarData.length === 0 && subjects.length === 0 && (
        <GlassCard hover={false}>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No analytics data available</p>
            <p className="text-sm text-muted-foreground">Data will appear once attendance is tracked</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
