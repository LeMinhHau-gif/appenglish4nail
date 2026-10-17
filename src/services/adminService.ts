import {
  AdminUser,
  AuditLog,
  CourseItem,
  DashboardStats,
  LearnerHistoryRecord,
  RoleDefinition,
  SubscriptionPlanId,
  SubscriptionRequest,
  SupportTicket,
  SystemSettings,
  UserRole,
} from '../types/rbac';

const TOKEN_KEY = 'nailspeak_auth_token';
const ACTIVE_USER_KEY = 'nailspeak_active_user';

export class AdminService {
  public static getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  public static setToken(token: string) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public static getSavedUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static setSavedUser(user: AdminUser | null) {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  }

  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    };
  }

  public static async login(email?: string, password?: string, role?: UserRole) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
    this.setToken(data.token);
    this.setSavedUser(data.user);
    return data;
  }

  public static async loginWithGoogle(googleData: {
    email: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
  }) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập Google thất bại');
    this.setToken(data.token);
    this.setSavedUser(data.user);
    return data;
  }

  public static async switchDemoRole(targetRole: UserRole) {
    const res = await fetch('/api/auth/switch-demo-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể chuyển đổi vai trò');
    this.setToken(data.token);
    this.setSavedUser(data.user);
    return data;
  }

  public static async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi xác thực người dùng');
    this.setSavedUser(data.user);
    return data;
  }

  public static async getRoles(): Promise<RoleDefinition[]> {
    const res = await fetch('/api/admin/roles', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách vai trò');
    return data;
  }

  public static async getDashboard(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/dashboard', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải bảng điều khiển');
    return data;
  }

  public static async getUsers(search?: string, role?: string, status?: string): Promise<AdminUser[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách người dùng');
    return data;
  }

  public static async createUser(userData: {
    name: string;
    email: string;
    role: UserRole;
    salonName?: string;
    salonLocation?: string;
    phone?: string;
    note?: string;
  }): Promise<AdminUser> {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tạo người dùng');
    return data;
  }

  public static async updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật người dùng');
    return data;
  }

  public static async lockUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}/lock`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể khóa người dùng');
    return data;
  }

  public static async unlockUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}/unlock`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể mở khóa người dùng');
    return data;
  }

  public static async assignRole(id: string, newRole: UserRole, note?: string) {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newRole, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể thay đổi vai trò');
    return data;
  }

  public static async getPendingUsers(): Promise<AdminUser[]> {
    const res = await fetch('/api/admin/users/pending', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách chờ cấp quyền');
    return data;
  }

  public static async getLearnerDetailHistory(learnerId: string): Promise<LearnerHistoryRecord[]> {
    const res = await fetch(`/api/admin/learners/${learnerId}/history`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải lịch sử học viên');
    return data;
  }

  // Learner study history & persistence
  public static async recordLearnerHistory(record: Partial<LearnerHistoryRecord>): Promise<any> {
    try {
      const res = await fetch('/api/learners/history', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(record),
      });
      return await res.json();
    } catch (e) {
      console.warn('Could not sync learner history to server database:', e);
      return null;
    }
  }

  public static async getLearnerHistory(userId?: string): Promise<LearnerHistoryRecord[]> {
    try {
      const res = await fetch(userId ? `/api/learners/history?userId=${userId}` : '/api/learners/history', {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  public static async syncLearnerStats(stats: any): Promise<any> {
    try {
      const res = await fetch('/api/learners/stats/sync', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(stats),
      });
      return await res.json();
    } catch (e) {
      console.warn('Failed to sync learner stats to database:', e);
      return null;
    }
  }

  public static async getCourses(): Promise<CourseItem[]> {
    const res = await fetch('/api/admin/courses', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách khóa học');
    return data;
  }

  public static async createCourse(courseData: any): Promise<CourseItem> {
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(courseData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tạo bài học');
    return data;
  }

  public static async updateCourse(id: string, updates: any): Promise<CourseItem> {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật bài học');
    return data;
  }

  public static async togglePublishCourse(id: string): Promise<CourseItem> {
    const res = await fetch(`/api/admin/courses/${id}/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể thay đổi trạng thái xuất bản');
    return data;
  }

  public static async deleteCourse(id: string) {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể xóa bài học');
    return data;
  }

  public static async getSupportTickets(): Promise<SupportTicket[]> {
    const res = await fetch('/api/admin/support/tickets', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách yêu cầu hỗ trợ');
    return data;
  }

  public static async createSupportTicket(ticketData: {
    subject: string;
    category: string;
    priority: string;
    salonLocation?: string;
  }): Promise<SupportTicket> {
    const res = await fetch('/api/admin/support/tickets', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ticketData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể gửi yêu cầu hỗ trợ');
    return data;
  }

  public static async updateSupportTicket(
    id: string,
    updates: { status?: string; priority?: string; assignedTo?: string; note?: string }
  ): Promise<SupportTicket> {
    const res = await fetch(`/api/admin/support/tickets/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật yêu cầu hỗ trợ');
    return data;
  }

  public static async getReports() {
    const res = await fetch('/api/admin/reports', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải báo cáo số liệu');
    return data;
  }

  public static async downloadReportsCsv() {
    const res = await fetch('/api/admin/reports/export', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Không thể xuất báo cáo');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NailSpeak_BaoCao_HocVien_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  public static async getAuditLogs(action?: string, status?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (status) params.append('status', status);

    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải nhật ký hoạt động');
    return data;
  }

  public static async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/admin/settings', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải cấu hình hệ thống');
    return data;
  }

  public static async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể lưu cấu hình hệ thống');
    return data;
  }

  // ==========================================
  // SUBSCRIPTIONS & PACKAGE REGISTRATION
  // ==========================================
  public static async registerSubscription(
    planId: SubscriptionPlanId,
    note?: string
  ): Promise<{ success: boolean; request: SubscriptionRequest; user: AdminUser }> {
    const currentUser = this.getSavedUser();
    const res = await fetch('/api/subscriptions/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        userName: currentUser?.name,
        planId,
        note,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể gửi đăng ký gói học');
    if (data.user) {
      this.setSavedUser(data.user);
    }
    return data;
  }

  public static async getSubscriptions(status?: string): Promise<SubscriptionRequest[]> {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`/api/admin/subscriptions${params}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách đăng ký gói');
    return data;
  }

  public static async approveSubscription(
    requestId: string
  ): Promise<{ success: boolean; request: SubscriptionRequest; user: AdminUser }> {
    const res = await fetch(`/api/admin/subscriptions/${requestId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể duyệt gói');
    return data;
  }

  public static async rejectSubscription(
    requestId: string,
    reason?: string
  ): Promise<{ success: boolean; request: SubscriptionRequest }> {
    const res = await fetch(`/api/admin/subscriptions/${requestId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể từ chối đăng ký gói');
    return data;
  }

  public static async assignUserSubscription(
    userId: string,
    planId: SubscriptionPlanId,
    status: 'none' | 'pending' | 'active'
  ): Promise<AdminUser> {
    const res = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ planId, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật gói học viên');
    return data.user;
  }
}
