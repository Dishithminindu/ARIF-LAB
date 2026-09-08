import type { SafeUser, Equipment, Reservation, AuditLog, SiteContent } from '../types/api';

// API Client Helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('arif_auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'same-origin'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    login: (body: { identifier: string; password: string; remember?: boolean }) =>
      request<{ success: boolean; message: string; user: SafeUser; token: string; redirect: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    register: (body: {
      full_name: string;
      student_id: string;
      email: string;
      password: string;
      confirm_password: string;
      department: string;
      course: string;
      contact_number?: string;
    }) =>
      request<{ success: boolean; message: string; user: SafeUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    logout: () =>
      request<{ success: boolean; message: string }>('/api/auth/logout', {
        method: 'POST'
      }),

    getMe: () =>
      request<{ success: boolean; user: SafeUser }>('/api/auth/me'),

    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string; demoResetToken?: string; resetUrl?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    resetPassword: (body: { token: string; new_password: string; confirm_password: string }) =>
      request<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    updateProfile: (body: { full_name?: string; contact_number?: string; department?: string; course?: string }) =>
      request<{ success: boolean; message: string; user: SafeUser }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body)
      })
  },

  // Equipment & Inventory
  equipment: {
    list: (params?: { query?: string; category?: string; block?: string; status?: string; isReservableOnly?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.query) qs.set('query', params.query);
      if (params?.category) qs.set('category', params.category);
      if (params?.block) qs.set('block', params.block);
      if (params?.status) qs.set('status', params.status);
      if (params?.isReservableOnly) qs.set('isReservableOnly', 'true');
      return request<{ success: boolean; count: number; equipment: Equipment[] }>(`/api/equipment?${qs.toString()}`);
    },

    getById: (id: string) =>
      request<{ success: boolean; equipment: Equipment }>(`/api/equipment/${id}`),

    getAvailability: (id: string, date: string) =>
      request<{
        success: boolean;
        equipmentId: string;
        equipmentName: string;
        equipmentCode: string;
        status: string;
        date: string;
        timeSlots: Array<{
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          display_label: string;
          is_own: boolean;
        }>;
      }>(`/api/equipment/${id}/availability?date=${date}`),

    create: (body: Partial<Equipment>) =>
      request<{ success: boolean; message: string; equipment: Equipment }>('/api/equipment', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    update: (id: string, body: Partial<Equipment>) =>
      request<{ success: boolean; message: string; equipment: Equipment }>(`/api/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      }),

    deactivate: (id: string, reason?: string) =>
      request<{ success: boolean; message: string; equipment: Equipment }>(`/api/equipment/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      })
  },

  // Reservations
  reservations: {
    create: (body: {
      equipment_id: string;
      reservation_date: string;
      start_time: string;
      end_time: string;
      purpose: string;
      project_name: string;
      supervisor_name?: string;
      notes?: string;
    }) =>
      request<{ success: boolean; message: string; reservation: Reservation }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    getMy: () =>
      request<{ success: boolean; count: number; reservations: Reservation[] }>('/api/reservations/my'),

    listAll: (params?: { status?: string; date?: string; equipmentId?: string; query?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.date) qs.set('date', params.date);
      if (params?.equipmentId) qs.set('equipmentId', params.equipmentId);
      if (params?.query) qs.set('query', params.query);
      return request<{ success: boolean; count: number; reservations: Reservation[] }>(`/api/reservations?${qs.toString()}`);
    },

    getById: (id: string) =>
      request<{ success: boolean; reservation: Reservation }>(`/api/reservations/${id}`),

    approve: (id: string) =>
      request<{ success: boolean; message: string; reservation: Reservation }>(`/api/reservations/${id}/approve`, {
        method: 'PUT'
      }),

    reject: (id: string, reason: string) =>
      request<{ success: boolean; message: string; reservation: Reservation }>(`/api/reservations/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      }),

    cancel: (id: string, reason?: string) =>
      request<{ success: boolean; message: string; reservation: Reservation }>(`/api/reservations/${id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      }),

    complete: (id: string) =>
      request<{ success: boolean; message: string; reservation: Reservation }>(`/api/reservations/${id}/complete`, {
        method: 'PUT'
      })
  },

  // Admin Users
  users: {
    list: (params?: { query?: string; role?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.query) qs.set('query', params.query);
      if (params?.role) qs.set('role', params.role);
      if (params?.status) qs.set('status', params.status);
      return request<{ success: boolean; count: number; users: SafeUser[] }>(`/api/users?${qs.toString()}`);
    },

    getById: (id: string) =>
      request<{ success: boolean; user: SafeUser; reservations: Reservation[] }>(`/api/users/${id}`),

    updateStatus: (id: string, status: string, reason?: string) =>
      request<{ success: boolean; message: string; user: SafeUser }>(`/api/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      }),

    updateRole: (id: string, role: string) =>
      request<{ success: boolean; message: string; user: SafeUser }>(`/api/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),

    resetPassword: (id: string, new_password: string) =>
      request<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password })
      })
  },

  // Audit Logs & Stats
  stats: {
    getDashboard: () =>
      request<{
        success: boolean;
        stats: {
          totalUsers: number;
          activeUsers: number;
          totalEquipment: number;
          availableEquipment: number;
          maintenanceEquipment: number;
          pendingReservations: number;
          approvedReservations: number;
          todayReservationsCount: number;
          todayReservations: Reservation[];
        };
      }>('/api/stats/dashboard'),

    getAuditLogs: (params?: { action?: string; entityType?: string; query?: string }) => {
      const qs = new URLSearchParams();
      if (params?.action) qs.set('action', params.action);
      if (params?.entityType) qs.set('entityType', params.entityType);
      if (params?.query) qs.set('query', params.query);
      return request<{ success: boolean; count: number; logs: AuditLog[] }>(`/api/audit-logs?${qs.toString()}`);
    }
  },

  // Site Content & Notices
  content: {
    list: () =>
      request<{ success: boolean; contents: SiteContent[] }>('/api/content'),

    update: (key: string, body: { title: string; content: string; is_active?: boolean }) =>
      request<{ success: boolean; message: string; content: SiteContent }>(`/api/content/${key}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
  }
};
