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
import { Calendar, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface TrendData {
  date: string;
  attendance: number;
}

interface HeatmapData {
  [date: string]: 'PRESENT' | 'ABSENT';
}

export const Analytics: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const demoTrend = dates.map(date => ({
        date: date.split('-').slice(1).join('/'),
        attendance: 70 + Math.random() * 25,
      }));

      setTrendData(demoTrend);
      setIsLoading(false);
    };
    fetchData();
  }, [selectedSubject, dateRange]);

  const pieData = [
    { name: 'Present', value: 78, color: 'hsl(142, 71%, 45%)' },
    { name: 'Absent', value: 22, color: 'hsl(0, 72%, 51%)' },
  ];

  const subjectStats = [
    { name: 'Machine Learning', percentage: 85.7, trend: '+2.3%' },
    { name: 'Data Structures', percentage: 73.7, trend: '-1.5%' },
    { name: 'Database Systems', percentage: 80.0, trend: '+0.8%' },
    { name: 'Computer Networks', percentage: 92.1, trend: '+4.2%' },
  ];

  const heatmapData: { date: string; status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' }[] = [];
  for (let i = 0; i < 35; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = date.getDay();
    if (day === 0 || day === 6) {
      heatmapData.push({ date: date.toISOString(), status: 'HOLIDAY' });
    } else {
      heatmapData.push({ 
        date: date.toISOString(), 
        status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT' 
      });
    }
  }

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
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="appearance-none bg-secondary px-4 py-2 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Subjects</option>
              <option value="ml">Machine Learning</option>
              <option value="ds">Data Structures</option>
              <option value="db">Database Systems</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
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
              <StatusBadge status="safe" label="Improving" />
            </div>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <GlassCard hover={false}>
          <h2 className="text-lg font-semibold mb-6">Subject-wise Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectStats.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-4 rounded-lg bg-secondary/50 text-center"
              >
                <CircularProgress value={subject.percentage} size={80} strokeWidth={6} />
                <h3 className="font-medium mt-3">{subject.name}</h3>
                <p className={`text-sm ${subject.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {subject.trend}
                </p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Attendance Calendar Heatmap */}
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-xs text-muted-foreground">Holiday</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
            {heatmapData.reverse().map((day, index) => (
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
    </div>
  );
};
