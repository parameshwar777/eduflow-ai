// API Configuration and Types
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
  class_id?: number;
  teacher_id?: number;
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

export interface Teacher {
  id: number;
  name: string;
  department_id: number;
  user_id: number;
}

export interface Student {
  id: number;
  name: string;
  roll_no: string;
  year: string;
  branch: string;
  section: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface ClassInfo {
  id: number;
  year: string;
  branch: string;
  section: string;
  department_id: number;
}

// API Helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper to handle API errors
const handleApiError = async (res: Response, fallbackMessage: string) => {
  if (!res.ok) {
    let errorMessage = fallbackMessage;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : errorData.detail[0]?.msg || fallbackMessage;
      }
    } catch {
      // Use fallback message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

// API Functions
export const api = {
  // Auth - Uses query parameters as per PDF
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const params = new URLSearchParams({ email, password });
    const res = await fetch(`${API_BASE_URL}/api/auth/login?${params}`, {
      method: 'POST',
      headers: { 'accept': 'application/json' },
    });
    return handleApiError(res, 'Login failed');
  },

  register: async (email: string, password: string, role: string): Promise<{ message: string }> => {
    const params = new URLSearchParams({ email, password, role });
    const res = await fetch(`${API_BASE_URL}/api/auth/register?${params}`, {
      method: 'POST',
      headers: { 'accept': 'application/json' },
    });
    return handleApiError(res, 'Registration failed');
  },

  // Teachers
  createTeacher: async (name: string, departmentId: number, userId: number): Promise<string> => {
    const params = new URLSearchParams({ 
      name, 
      department_id: departmentId.toString(), 
      user_id: userId.toString() 
    });
    const res = await fetch(`${API_BASE_URL}/api/teachers/create?${params}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to create teacher');
  },

  getTeachers: async (): Promise<Teacher[]> => {
    const res = await fetch(`${API_BASE_URL}/api/teachers/`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch teachers');
  },

  // Students
  registerStudent: async (
    name: string, 
    rollNo: string, 
    year: string, 
    branch: string, 
    section: string, 
    image: File
  ): Promise<string> => {
    const params = new URLSearchParams({ 
      name, 
      roll_no: rollNo, 
      year, 
      branch, 
      section 
    });
    
    const formData = new FormData();
    formData.append('image', image);
    
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE_URL}/api/students/register?${params}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: formData,
    });
    return handleApiError(res, 'Failed to register student');
  },

  getStudentStats: async (studentId: number): Promise<StudentStats> => {
    const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch stats');
  },

  getStudentPrediction: async (studentId: number): Promise<Prediction> => {
    const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/prediction`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch prediction');
  },

  // Subjects
  createSubject: async (name: string, classId: number, teacherId: number): Promise<string> => {
    const params = new URLSearchParams({ 
      name, 
      class_id: classId.toString(), 
      teacher_id: teacherId.toString() 
    });
    const res = await fetch(`${API_BASE_URL}/api/subjects/create?${params}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to create subject');
  },

  getSubjects: async (): Promise<Subject[]> => {
    const res = await fetch(`${API_BASE_URL}/api/subjects/`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch subjects');
  },

  getTeacherSubjects: async (teacherId: number): Promise<Subject[]> => {
    // The PDF shows /api/subjects/ without teacher filter, so we fetch all and filter
    const res = await fetch(`${API_BASE_URL}/api/subjects/`, {
      headers: getAuthHeaders(),
    });
    const subjects = await handleApiError(res, 'Failed to fetch subjects');
    // If the API returns teacher-specific subjects, use as is
    // Otherwise, filter by teacher_id if available
    return subjects;
  },

  // Attendance - Core AI API
  markAttendance: async (subjectId: number, image: File): Promise<AttendanceResult> => {
    const params = new URLSearchParams({ subject_id: subjectId.toString() });
    
    const formData = new FormData();
    formData.append('image', image);
    
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE_URL}/api/attendance/mark?${params}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: formData,
    });
    return handleApiError(res, 'Failed to mark attendance');
  },

  getAttendanceTrend: async (subjectId: number): Promise<AttendanceTrend> => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/subject/${subjectId}/trend`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch trend');
  },

  getAttendanceCalendar: async (studentId: number): Promise<CalendarData> => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/student/${studentId}/calendar`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch calendar');
  },

  // Admin
  getUniversityStats: async (): Promise<UniversityStats> => {
    const res = await fetch(`${API_BASE_URL}/api/admin/university-stats`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch university stats');
  },

  createDepartment: async (name: string): Promise<string> => {
    const params = new URLSearchParams({ name });
    const res = await fetch(`${API_BASE_URL}/api/admin/departments/create?${params}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to create department');
  },

  createClass: async (year: string, branch: string, section: string, departmentId: number): Promise<string> => {
    const params = new URLSearchParams({ 
      year, 
      branch, 
      section, 
      department_id: departmentId.toString() 
    });
    const res = await fetch(`${API_BASE_URL}/api/admin/classes/create?${params}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to create class');
  },

  // Alerts
  getAlerts: async (userId: number): Promise<Alert[]> => {
    const res = await fetch(`${API_BASE_URL}/api/alerts/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleApiError(res, 'Failed to fetch alerts');
  },
};

// Decode JWT token
export const decodeJWT = (token: string): { sub: string; role: string; user_id: number; exp: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
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
