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
  id?: number;
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
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

const buildFetchErrorHint = (url: string) => {
  const base = `Network error calling ${url}.`;
  const hint =
    ' Check VITE_API_URL, backend is running, CORS allows this origin, and avoid HTTPS→HTTP mixed content (use https backend or a tunnel like ngrok).';
  return base + hint;
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.detail) {
          message = typeof body.detail === 'string' ? body.detail : body.detail?.[0]?.msg ?? message;
        } else if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof TypeError) throw new Error(buildFetchErrorHint(url));
    throw e;
  }
};

const requestFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.detail) {
          message = typeof body.detail === 'string' ? body.detail : body.detail?.[0]?.msg ?? message;
        } else if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof TypeError) throw new Error(buildFetchErrorHint(url));
    throw e;
  }
};

// Decode JWT token payload (no signature verification; backend must enforce auth/roles)
export const decodeJWT = (
  token: string
): { sub?: string; role?: string; user_id?: number; exp?: number } | null => {
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

// API Functions
export const api = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return requestJson<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string, role: string): Promise<{ message: string }> => {
    return requestJson<{ message: string }>(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
  },

  // Admin
  createDepartment: async (name: string): Promise<{ message: string } | string> => {
    return requestJson(`${API_BASE_URL}/api/admin/departments/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
  },

  createClass: async (
    year: string,
    branch: string,
    section: string,
    department_id: number
  ): Promise<{ message: string } | string> => {
    return requestJson(`${API_BASE_URL}/api/admin/classes/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ year, branch, section, department_id }),
    });
  },

  getUniversityStats: async (): Promise<UniversityStats> => {
    return requestJson<UniversityStats>(`${API_BASE_URL}/api/admin/university-stats`, {
      headers: getAuthHeaders(),
    });
  },

  // Teacher
  createTeacher: async (name: string, department_id: number, user_id: number): Promise<{ message: string } | string> => {
    return requestJson(`${API_BASE_URL}/api/teachers/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, department_id, user_id }),
    });
  },

  getTeacherSubjects: async (teacherId: number): Promise<Subject[]> => {
    return requestJson<Subject[]>(`${API_BASE_URL}/api/subjects/teacher/${teacherId}`, {
      headers: getAuthHeaders(),
    });
  },

  // Student - API expects query params for text fields and FormData only for image
  registerStudent: async (
    roll_no: string,
    name: string,
    year: string,
    branch: string,
    section: string,
    image: File
  ): Promise<any> => {
    const params = new URLSearchParams({
      name,
      roll_no,
      year,
      branch,
      section,
    });
    
    const formData = new FormData();
    formData.append('image', image);

    return requestFormData(`${API_BASE_URL}/api/students/register?${params.toString()}`, formData);
  },

  getStudentStats: async (studentId: number): Promise<StudentStats> => {
    return requestJson<StudentStats>(`${API_BASE_URL}/api/students/${studentId}/stats`, {
      headers: getAuthHeaders(),
    });
  },

  getStudentPrediction: async (studentId: number): Promise<Prediction> => {
    return requestJson<Prediction>(`${API_BASE_URL}/api/students/${studentId}/prediction`, {
      headers: getAuthHeaders(),
    });
  },

  // Attendance
  markAttendance: async (subject_id: number, image: File): Promise<AttendanceResult> => {
    const formData = new FormData();
    formData.append('subject_id', String(subject_id));
    formData.append('image', image);

    return requestFormData<AttendanceResult>(`${API_BASE_URL}/api/attendance/mark`, formData);
  },

  getAttendanceTrend: async (subjectId: number): Promise<AttendanceTrend> => {
    return requestJson<AttendanceTrend>(`${API_BASE_URL}/api/attendance/subject/${subjectId}/trend`, {
      headers: getAuthHeaders(),
    });
  },

  getAttendanceCalendar: async (studentId: number): Promise<CalendarData> => {
    return requestJson<CalendarData>(`${API_BASE_URL}/api/attendance/student/${studentId}/calendar`, {
      headers: getAuthHeaders(),
    });
  },

  // Alerts
  getAlerts: async (userId: number): Promise<Alert[]> => {
    return requestJson<Alert[]>(`${API_BASE_URL}/api/alerts/${userId}`, {
      headers: getAuthHeaders(),
    });
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
