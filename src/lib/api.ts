// API Configuration and Types
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Subject {
  subject_id: number;
  name: string;
  class: string;
  total_classes: number;
}

export interface StudentStats {
  attended: number;
  missed: number;
  total: number;
  percentage: number;
}

export interface Prediction {
  classes_needed: number;
  risk_level: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface UniversityStats {
  total_students: number;
  total_teachers: number;
  average_attendance: number;
  at_risk_students: number;
}

export interface AttendanceResult {
  status: string;
  count: number;
  students_present: Array<{
    student_id: number;
    name?: string;
    roll_no?: string;
    confidence: number;
  }>;
}

export interface Alert {
  id: number;
  type: 'LOW_ATTENDANCE' | 'PROXY_DETECTED' | 'LOW_CONFIDENCE';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at?: string;
}

export interface AttendanceTrend {
  dates: string[];
  attendance: number[];
}

export interface CalendarData {
  [date: string]: 'PRESENT' | 'ABSENT';
}

// API Helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// API Functions
export const api = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  register: async (email: string, password: string, role: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  // Teacher
  getTeacherSubjects: async (teacherId: number): Promise<Subject[]> => {
    const res = await fetch(`${API_BASE_URL}/api/subjects/teacher/${teacherId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
  },

  // Student
  getStudentStats: async (studentId: number): Promise<StudentStats> => {
    const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getStudentPrediction: async (studentId: number): Promise<Prediction> => {
    const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/prediction`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch prediction');
    return res.json();
  },

  // Attendance
  markAttendance: async (subjectId: number, image: File): Promise<AttendanceResult> => {
    const formData = new FormData();
    formData.append('subject_id', subjectId.toString());
    formData.append('image', image);
    
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to mark attendance');
    return res.json();
  },

  getAttendanceTrend: async (subjectId: number): Promise<AttendanceTrend> => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/subject/${subjectId}/trend`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trend');
    return res.json();
  },

  getAttendanceCalendar: async (studentId: number): Promise<CalendarData> => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/student/${studentId}/calendar`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch calendar');
    return res.json();
  },

  // Admin
  getUniversityStats: async (): Promise<UniversityStats> => {
    const res = await fetch(`${API_BASE_URL}/api/admin/university-stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch university stats');
    return res.json();
  },

  // Alerts
  getAlerts: async (userId: number): Promise<Alert[]> => {
    const res = await fetch(`${API_BASE_URL}/api/alerts/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },
};

// Auth helpers
export const auth = {
  isAuthenticated: () => !!localStorage.getItem('access_token'),
  getToken: () => localStorage.getItem('access_token'),
  getUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setAuth: (token: string, user: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};
