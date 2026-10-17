import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AdminUser,
  AuditLog,
  DashboardStats,
  LearnerHistoryRecord,
  Permission,
  ROLE_DEFINITIONS,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanId,
  SubscriptionRequest,
  SupportTicket,
  SystemSettings,
  UserRole,
} from '../src/types/rbac.js';
import { NAIL_LESSONS } from '../src/data/nailCurriculum.js';
import { Lesson } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'rbac_db.json');

export interface CourseItem extends Lesson {
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

export interface StoreData {
  users: AdminUser[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  settings: SystemSettings;
  courses: CourseItem[];
  learnerHistory: LearnerHistoryRecord[];
  subscriptions: SubscriptionRequest[];
}

// Initial seed data
const DEFAULT_USERS: AdminUser[] = [
  {
    id: 'usr-superadmin',
    name: 'Sarah Nguyễn',
    email: 'superadmin@nailspeak.pro',
    role: 'super_admin',
    status: 'active',
    salonName: 'NailSpeak HQ Tech',
    salonLocation: 'Los Angeles, CA',
    phone: '(714) 892-1234',
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: new Date().toISOString(),
    totalXp: 9800,
    streakDays: 45,
    completedLessonsCount: 8,
    avgPronunciationScore: 98,
    note: 'Nhà sáng lập & Quản trị viên cấp cao',
  },
  {
    id: 'usr-admin',
    name: 'David Trần',
    email: 'admin@nailspeak.pro',
    role: 'admin',
    status: 'active',
    salonName: 'Luxury Nails & Spa',
    salonLocation: 'Houston, TX',
    phone: '(832) 555-0199',
    createdAt: '2026-01-15T09:30:00Z',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    totalXp: 6400,
    streakDays: 28,
    completedLessonsCount: 7,
    avgPronunciationScore: 92,
    note: 'Quản trị viên vận hành khu vực Texas',
  },
  {
    id: 'usr-content',
    name: 'Jessica Lê',
    email: 'content@nailspeak.pro',
    role: 'content_manager',
    status: 'active',
    salonName: 'Glossy Lounge Nail Studio',
    salonLocation: 'Orange County, CA',
    phone: '(714) 555-8822',
    createdAt: '2026-01-20T10:15:00Z',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    totalXp: 5100,
    streakDays: 20,
    completedLessonsCount: 8,
    avgPronunciationScore: 95,
    note: 'Biên soạn kịch bản hội thoại & từ vựng salon',
  },
  {
    id: 'usr-support',
    name: 'Alex Vũ',
    email: 'support@nailspeak.pro',
    role: 'support',
    status: 'active',
    salonName: 'Central Care Hub',
    salonLocation: 'Atlanta, GA',
    phone: '(404) 555-7311',
    createdAt: '2026-02-01T11:00:00Z',
    lastLogin: new Date(Date.now() - 1800000).toISOString(),
    totalXp: 3400,
    streakDays: 14,
    completedLessonsCount: 5,
    avgPronunciationScore: 88,
    note: 'Hỗ trợ kỹ thuật và thắc mắc học viên',
  },
  {
    id: 'usr-analyst',
    name: 'Michael Đỗ',
    email: 'analyst@nailspeak.pro',
    role: 'analyst',
    status: 'active',
    salonName: 'Analytics & Insights Team',
    salonLocation: 'San Jose, CA',
    phone: '(408) 555-9012',
    createdAt: '2026-02-05T14:20:00Z',
    lastLogin: new Date(Date.now() - 14400000).toISOString(),
    totalXp: 4200,
    streakDays: 16,
    completedLessonsCount: 6,
    avgPronunciationScore: 90,
    note: 'Chuyên viên phân tích số liệu học tập',
  },
  {
    id: 'usr-learner-1',
    name: 'Lisa Hoàng',
    email: 'learner@nailspeak.pro',
    role: 'learner',
    status: 'active',
    salonName: 'Princess Nails & Spa',
    salonLocation: 'Garden Grove, CA',
    phone: '(714) 555-3490',
    createdAt: '2026-02-10T16:00:00Z',
    lastLogin: new Date().toISOString(),
    totalXp: 2850,
    streakDays: 12,
    completedLessonsCount: 4,
    avgPronunciationScore: 86,
    note: 'Thợ nail chuyên bột & design móng',
  },
  {
    id: 'usr-learner-2',
    name: 'Tina Phạm',
    email: 'tina.pham@houstonnails.com',
    role: 'learner',
    status: 'active',
    salonName: 'Organic Nail Lounge',
    salonLocation: 'Houston, TX',
    phone: '(832) 555-6677',
    createdAt: '2026-02-15T09:00:00Z',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    totalXp: 1950,
    streakDays: 7,
    completedLessonsCount: 3,
    avgPronunciationScore: 82,
    note: 'Thợ làm chân tay nước (Pedicure & Manicure)',
  },
  {
    id: 'usr-learner-3',
    name: 'Kevin Đặng',
    email: 'kevin.d@ocnails.com',
    role: 'learner',
    status: 'active',
    salonName: 'Diamond Nails Bar',
    salonLocation: 'Westminster, CA',
    phone: '(714) 555-4411',
    createdAt: '2026-02-18T10:00:00Z',
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    totalXp: 1400,
    streakDays: 5,
    completedLessonsCount: 2,
    avgPronunciationScore: 79,
    note: 'Học giao tiếp xử lý khách phàn nàn & tip',
  },
  {
    id: 'usr-learner-4',
    name: 'Nancy Huỳnh',
    email: 'nancy.h@dallasnails.com',
    role: 'learner',
    status: 'locked',
    salonName: 'Regal Nails Dallas',
    salonLocation: 'Dallas, TX',
    phone: '(214) 555-9900',
    createdAt: '2026-02-22T12:00:00Z',
    lastLogin: '2026-03-01T15:30:00Z',
    totalXp: 820,
    streakDays: 2,
    completedLessonsCount: 1,
    avgPronunciationScore: 74,
    note: 'Tạm khóa tài khoản do yêu cầu bảo mật',
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'NailSpeak Pro - Quản Trị Hệ Thống',
  salonSupportHotline: '1-800-NAIL-ENG (1-800-624-5364)',
  supportEmail: 'support@nailspeak.pro',
  maintenanceMode: false,
  allowPublicRegistration: true,
  minPronunciationPassScore: 70,
  systemAnnouncement: 'Chào mừng các quản trị viên! Hệ thống RBAC 5 vai trò đã sẵn sàng phục vụ cộng đồng nail tại Mỹ.',
  sessionTimeoutHours: 24,
  enableAiRoleplay: true,
};

const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tick-101',
    userId: 'usr-learner-1',
    userName: 'Lisa Hoàng',
    userEmail: 'learner@nailspeak.pro',
    salonLocation: 'Garden Grove, CA',
    subject: 'Muốn luyện phát âm thêm các từ về viền móng (cuticle) và móng úp (gel-x)',
    category: 'pronunciation_ai',
    priority: 'medium',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedTo: 'Alex Vũ',
    internalNotes: [
      {
        id: 'note-1',
        authorName: 'Alex Vũ',
        content: 'Đã hướng dẫn học viên dùng chế độ Đọc chậm 0.65× trong tab Từ Vựng để luyện âm đuôi /l/ và /ks/.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
  {
    id: 'tick-102',
    userId: 'usr-learner-2',
    userName: 'Tina Phạm',
    userEmail: 'tina.pham@houstonnails.com',
    salonLocation: 'Houston, TX',
    subject: 'Micro bị rè khi dùng tai nghe Bluetooth trong tiệm lúc đông khách',
    category: 'audio_issue',
    priority: 'high',
    status: 'open',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    assignedTo: 'Alex Vũ',
    internalNotes: [],
  },
  {
    id: 'tick-103',
    userId: 'usr-learner-3',
    userName: 'Kevin Đặng',
    userEmail: 'kevin.d@ocnails.com',
    salonLocation: 'Westminster, CA',
    subject: 'Đã hoàn thành bài 1 và 2, cần tài liệu PDF in ra để ở bàn nail',
    category: 'lesson_content',
    priority: 'low',
    status: 'resolved',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    assignedTo: 'David Trần',
    internalNotes: [
      {
        id: 'note-2',
        authorName: 'David Trần',
        content: 'Đã gửi file cheat-sheet câu mẫu qua email cho anh Kevin.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    actorId: 'usr-superadmin',
    actorName: 'Sarah Nguyễn',
    actorRole: 'super_admin',
    action: 'INIT_SYSTEM',
    targetResource: 'system.core',
    details: 'Khởi tạo hệ thống quản trị phân quyền RBAC 5 vai trò thành công',
    ipAddress: '192.168.1.10',
    status: 'success',
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    actorId: 'usr-superadmin',
    actorName: 'Sarah Nguyễn',
    actorRole: 'super_admin',
    action: 'ROLE_ASSIGN',
    targetResource: 'usr-admin',
    details: 'Gán vai trò Admin (Quản trị viên) cho David Trần',
    ipAddress: '192.168.1.10',
    status: 'success',
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    actorId: 'usr-admin',
    actorName: 'David Trần',
    actorRole: 'admin',
    action: 'USER_LOCK',
    targetResource: 'usr-learner-4',
    details: 'Tạm khóa tài khoản Nancy Huỳnh do yêu cầu bảo mật',
    ipAddress: '10.0.0.45',
    status: 'success',
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    actorId: 'usr-content',
    actorName: 'Jessica Lê',
    actorRole: 'content_manager',
    action: 'COURSE_PUBLISH',
    targetResource: 'lesson-1',
    details: 'Xuất bản bài học: Khách Chê Thợ Làm Nhanh, Làm Ẩu',
    ipAddress: '172.16.0.8',
    status: 'success',
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    actorId: 'usr-support',
    actorName: 'Alex Vũ',
    actorRole: 'support',
    action: 'TICKET_UPDATE',
    targetResource: 'tick-101',
    details: 'Cập nhật ghi chú hỗ trợ học viên Lisa Hoàng',
    ipAddress: '192.168.2.14',
    status: 'success',
  },
];

const DEFAULT_LEARNER_HISTORY: LearnerHistoryRecord[] = [
  {
    id: 'hist-001',
    userId: 'usr-learner-1',
    userEmail: 'learner@nailspeak.pro',
    userName: 'Lisa Hoàng',
    lessonId: 'lesson-1',
    lessonTitle: 'Khách Chê Thợ Làm Nhanh, Làm Ẩu',
    action: 'lesson_complete',
    score: 95,
    details: 'Hoàn thành toàn bộ hội thoại xử lý phàn nàn',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'hist-002',
    userId: 'usr-learner-1',
    userEmail: 'learner@nailspeak.pro',
    userName: 'Lisa Hoàng',
    lessonId: 'lesson-1',
    lessonTitle: 'Khách Chê Thợ Làm Nhanh, Làm Ẩu',
    action: 'recording_practice',
    score: 88,
    targetSentence: 'I apologize if I seemed rushed. Let me slow down and make sure you are completely satisfied.',
    spokenSentence: 'I apologize if I seemed rushed. Let me slow down and make sure you are satisfied.',
    details: 'Luyện phát âm AI câu xin lỗi khách hàng',
    timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    id: 'hist-003',
    userId: 'usr-learner-2',
    userEmail: 'tina.pham@houstonnails.com',
    userName: 'Tina Phạm',
    lessonId: 'lesson-2',
    lessonTitle: 'Đổi Màu Sơn Giữa Chừng',
    action: 'lesson_complete',
    score: 90,
    details: 'Hoàn thành bài học đổi màu sơn và tư vấn phí',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'hist-004',
    userId: 'usr-learner-3',
    userEmail: 'kevin.d@ocnails.com',
    userName: 'Kevin Đặng',
    lessonId: 'lesson-3',
    lessonTitle: 'Móng Khách Bị Chảy Máu (Cắt Vào Da Khách)',
    action: 'recording_practice',
    score: 84,
    targetSentence: 'Oh, I am so sorry! Let me clean and sanitize this right away.',
    spokenSentence: 'Oh, I am so sorry! Let me clean and sanitize this.',
    details: 'Luyện câu xử lý sơ cứu an toàn cho khách',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEFAULT_SUBSCRIPTIONS: SubscriptionRequest[] = [
  {
    id: 'sub-001',
    userId: 'usr-learner-1',
    userName: 'Lisa Hoàng',
    userEmail: 'learner@nailspeak.pro',
    salonName: 'Princess Nails & Spa',
    salonLocation: 'Los Angeles, CA',
    planId: '6_months',
    planName: 'Gói 6 Tháng',
    priceUsd: 25,
    status: 'pending',
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    note: 'Đã chuyển Zelle số đuôi 892. Vui lòng duyệt sớm để học tiếp bài 6!',
  },
  {
    id: 'sub-002',
    userId: 'usr-learner-2',
    userName: 'Tina Phạm',
    userEmail: 'tina.pham@houstonnails.com',
    salonName: 'Organic Nail Lounge',
    salonLocation: 'Houston, TX',
    planId: '1_year',
    planName: 'Gói 1 Năm',
    priceUsd: 40,
    status: 'pending',
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    note: 'Đã gửi qua Venmo: @tina-nails-tx. Muốn mở trọn bộ để luyện upsell.',
  },
];

class RbacStore {
  private data: StoreData;

  constructor() {
    this.data = this.loadStore();
  }

  private loadStore(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.learnerHistory || !Array.isArray(parsed.learnerHistory)) {
          parsed.learnerHistory = DEFAULT_LEARNER_HISTORY;
        }
        if (!parsed.subscriptions || !Array.isArray(parsed.subscriptions)) {
          parsed.subscriptions = DEFAULT_SUBSCRIPTIONS;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing rbac store, using default seed:', e);
    }

    const initialCourses: CourseItem[] = NAIL_LESSONS.map((l, index) => ({
      ...l,
      isPublished: index < 7, // 7 first published, rest draft
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const initialData: StoreData = {
      users: DEFAULT_USERS,
      auditLogs: DEFAULT_AUDIT_LOGS,
      supportTickets: DEFAULT_SUPPORT_TICKETS,
      settings: DEFAULT_SETTINGS,
      courses: initialCourses,
      learnerHistory: DEFAULT_LEARNER_HISTORY,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
    };

    this.saveStore(initialData);
    return initialData;
  }

  private saveStore(data: StoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving rbac store:', e);
    }
  }

  public getStore(): StoreData {
    return this.data;
  }

  // User management
  public getUsers(): AdminUser[] {
    return this.data.users;
  }

  public getUserById(id: string): AdminUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): AdminUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>): AdminUser {
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      totalXp: user.totalXp ?? 0,
      streakDays: user.streakDays ?? 0,
      completedLessonsCount: user.completedLessonsCount ?? 0,
      avgPronunciationScore: user.avgPronunciationScore ?? 75,
    };
    this.data.users.push(newUser);
    this.saveStore(this.data);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
    };
    this.saveStore(this.data);
    return this.data.users[index];
  }

  public setUserLock(id: string, locked: boolean): { success: boolean; error?: string; user?: AdminUser } {
    const target = this.getUserById(id);
    if (!target) return { success: false, error: 'Không tìm thấy người dùng.' };

    if (locked && target.role === 'super_admin') {
      const activeSuperAdmins = this.data.users.filter(
        (u) => u.role === 'super_admin' && u.status === 'active' && u.id !== id
      );
      if (activeSuperAdmins.length === 0) {
        return {
          success: false,
          error: 'Bảo mật RBAC: Không thể khóa Super Admin duy nhất còn hoạt động của hệ thống!',
        };
      }
    }

    const updated = this.updateUser(id, { status: locked ? 'locked' : 'active' });
    return { success: true, user: updated! };
  }

  public assignUserRole(
    id: string,
    newRole: UserRole,
    actor: AdminUser,
    note?: string
  ): { success: boolean; error?: string; user?: AdminUser } {
    const target = this.getUserById(id);
    if (!target) return { success: false, error: 'Không tìm thấy người dùng.' };

    // Safety checks
    if (actor.id === id && actor.role !== newRole) {
      return { success: false, error: 'Bảo mật RBAC: Không được phép tự thay đổi vai trò của chính mình!' };
    }

    if (newRole === 'super_admin' && actor.role !== 'super_admin') {
      return { success: false, error: 'Chỉ có Super Admin mới có quyền gán hoặc chỉ định Super Admin mới!' };
    }

    if (target.role === 'super_admin' && actor.role !== 'super_admin') {
      return { success: false, error: 'Bạn không có quyền sửa đổi tài khoản của Super Admin!' };
    }

    // Protection of last super admin
    if (target.role === 'super_admin' && newRole !== 'super_admin') {
      const remainingSuperAdmins = this.data.users.filter(
        (u) => u.role === 'super_admin' && u.status === 'active' && u.id !== id
      );
      if (remainingSuperAdmins.length === 0) {
        return {
          success: false,
          error: 'Bảo mật RBAC: Hệ thống phải luôn có ít nhất một Super Admin đang hoạt động!',
        };
      }
    }

    const updated = this.updateUser(id, {
      role: newRole,
      isNewUser: false,
      roleGrantedBy: `${actor.name} (${actor.role})`,
      roleGrantedAt: new Date().toISOString(),
      note: note ? (target.note ? `${target.note} | ${note}` : note) : target.note,
    });
    return { success: true, user: updated! };
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.saveStore(this.data);
    return newLog;
  }

  // Courses
  public getCourses(): CourseItem[] {
    return this.data.courses;
  }

  public getCourseById(id: string): CourseItem | undefined {
    return this.data.courses.find((c) => c.id === id);
  }

  public createCourse(course: Omit<CourseItem, 'id'>): CourseItem {
    const newCourse: CourseItem = {
      ...course,
      id: `lesson-${Date.now().toString(36)}`,
      publishedAt: course.isPublished ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    this.data.courses.push(newCourse);
    this.saveStore(this.data);
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<CourseItem>): CourseItem | null {
    const index = this.data.courses.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.courses[index] = {
      ...this.data.courses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveStore(this.data);
    return this.data.courses[index];
  }

  public deleteCourse(id: string): boolean {
    const lenBefore = this.data.courses.length;
    this.data.courses = this.data.courses.filter((c) => c.id !== id);
    if (this.data.courses.length < lenBefore) {
      this.saveStore(this.data);
      return true;
    }
    return false;
  }

  // Support tickets
  public getSupportTickets(): SupportTicket[] {
    return [...this.data.supportTickets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'internalNotes'>): SupportTicket {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tick-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      internalNotes: [],
    };
    this.data.supportTickets.unshift(newTicket);
    this.saveStore(this.data);
    return newTicket;
  }

  public updateSupportTicket(
    id: string,
    updates: Partial<SupportTicket>,
    newNote?: { authorName: string; content: string }
  ): SupportTicket | null {
    const index = this.data.supportTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = this.data.supportTickets[index];
    const notes = [...existing.internalNotes];
    if (newNote && newNote.content.trim()) {
      notes.push({
        id: `note-${Date.now().toString(36)}`,
        authorName: newNote.authorName,
        content: newNote.content.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    this.data.supportTickets[index] = {
      ...existing,
      ...updates,
      internalNotes: notes,
      updatedAt: new Date().toISOString(),
    };
    this.saveStore(this.data);
    return this.data.supportTickets[index];
  }

  // System Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
    };
    this.saveStore(this.data);
    return this.data.settings;
  }

  // Dashboard Stats
  public getDashboardStats(): DashboardStats {
    const learners = this.data.users.filter((u) => u.role === 'learner');
    const activeToday = this.data.users.filter(
      (u) =>
        u.status === 'active' &&
        new Date(u.lastLogin).getTime() > Date.now() - 24 * 3600 * 1000
    ).length;

    const roleDistribution: Record<UserRole, number> = {
      super_admin: 0,
      admin: 0,
      content_manager: 0,
      support: 0,
      analyst: 0,
      learner: 0,
    };

    for (const u of this.data.users) {
      if (roleDistribution[u.role] !== undefined) {
        roleDistribution[u.role] += 1;
      }
    }

    const totalLearnersCount = learners.length;
    const avgScore =
      learners.reduce((acc, curr) => acc + (curr.avgPronunciationScore || 75), 0) /
      Math.max(1, totalLearnersCount);

    const pendingTickets = this.data.supportTickets.filter((t) => t.status !== 'resolved').length;

    return {
      totalLearners: totalLearnersCount,
      activeToday: activeToday,
      totalLessons: this.data.courses.length,
      completionRatePercent: 68.4,
      avgPronunciationScore: Math.round(avgScore),
      totalPracticedHours: 428,
      pendingSupportTickets: pendingTickets,
      roleDistribution,
      recentActivities: this.getAuditLogs().slice(0, 10),
    };
  }

  // ==========================================
  // LEARNER HISTORY & DATABASE PERSISTENCE
  // ==========================================
  public getLearnerHistory(userId?: string): LearnerHistoryRecord[] {
    if (!this.data.learnerHistory) {
      this.data.learnerHistory = [];
    }
    const list = userId
      ? this.data.learnerHistory.filter((h) => h.userId === userId || h.userEmail === userId)
      : this.data.learnerHistory;
    return [...list].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addLearnerHistory(
    record: Omit<LearnerHistoryRecord, 'id' | 'timestamp'>
  ): LearnerHistoryRecord {
    if (!this.data.learnerHistory) {
      this.data.learnerHistory = [];
    }
    const newRecord: LearnerHistoryRecord = {
      ...record,
      id: `hist-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.learnerHistory.unshift(newRecord);
    // Keep max 500 history records
    if (this.data.learnerHistory.length > 500) {
      this.data.learnerHistory = this.data.learnerHistory.slice(0, 500);
    }
    this.saveStore(this.data);
    return newRecord;
  }

  public syncLearnerStats(
    userId: string,
    stats: {
      totalXp?: number;
      streakDays?: number;
      completedLessonIds?: string[];
      savedVocabIds?: string[];
      avgPronunciationScore?: number;
    }
  ): AdminUser | null {
    const user = this.getUserById(userId) || this.getUserByEmail(userId);
    if (!user) return null;

    const updates: Partial<AdminUser> = {};
    if (stats.totalXp !== undefined) updates.totalXp = stats.totalXp;
    if (stats.streakDays !== undefined) updates.streakDays = stats.streakDays;
    if (stats.avgPronunciationScore !== undefined) updates.avgPronunciationScore = stats.avgPronunciationScore;
    if (stats.completedLessonIds) {
      updates.completedLessonIds = stats.completedLessonIds;
      updates.completedLessonsCount = stats.completedLessonIds.length;
    }
    if (stats.savedVocabIds) updates.savedVocabIds = stats.savedVocabIds;

    return this.updateUser(user.id, updates);
  }

  // ==========================================
  // GOOGLE AUTHENTICATION & USER ONBOARDING
  // ==========================================
  public handleGoogleAuth(googleData: {
    email: string;
    name: string;
    avatarUrl?: string;
    googleId?: string;
  }): { user: AdminUser; isNew: boolean; token: string } {
    let existing = this.getUserByEmail(googleData.email);

    if (existing) {
      const updated = this.updateUser(existing.id, {
        lastLogin: new Date().toISOString(),
        avatarUrl: googleData.avatarUrl || existing.avatarUrl,
        authProvider: 'google',
      })!;
      return {
        user: updated,
        isNew: false,
        token: `token-${updated.id}`,
      };
    }

    // Create new user (default: learner, marked as isNewUser: true for Admin to review and grant roles)
    const newUser = this.createUser({
      name: googleData.name || googleData.email.split('@')[0],
      email: googleData.email.toLowerCase(),
      role: 'learner',
      status: 'active',
      avatarUrl: googleData.avatarUrl,
      authProvider: 'google',
      isNewUser: true,
      note: 'Người dùng mới đăng nhập bằng Google. Chờ Quản trị viên phân quyền nếu cần.',
      salonName: 'Tiệm Nail Thành Viên',
      salonLocation: 'Chưa cập nhật',
    });

    this.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: 'learner',
      action: 'GOOGLE_SIGNUP',
      targetResource: newUser.id,
      details: `Đăng ký tài khoản mới qua Google (${newUser.email}). Trạng thái: Chờ duyệt/phân quyền.`,
      status: 'success',
    });

    return {
      user: newUser,
      isNew: true,
      token: `token-${newUser.id}`,
    };
  }

  public getPendingRoleUsers(): AdminUser[] {
    return this.data.users.filter((u) => u.isNewUser || u.role === 'learner');
  }

  // ==========================================
  // SUBSCRIPTION & PACKAGE REGISTRATION METHODS
  // ==========================================
  public getSubscriptions(status?: string): SubscriptionRequest[] {
    if (!this.data.subscriptions) {
      this.data.subscriptions = [];
    }
    if (!status || status === 'all') {
      return [...this.data.subscriptions].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    }
    return this.data.subscriptions
      .filter((s) => s.status === status)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public getSubscriptionById(id: string): SubscriptionRequest | undefined {
    return this.data.subscriptions?.find((s) => s.id === id);
  }

  public registerSubscription(params: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    planId: SubscriptionPlanId;
    note?: string;
  }): { success: boolean; request: SubscriptionRequest; user: AdminUser } {
    let targetUser: AdminUser | undefined;

    if (params.userId) {
      targetUser = this.getUserById(params.userId);
    }
    if (!targetUser && params.userEmail) {
      targetUser = this.getUserByEmail(params.userEmail);
    }

    if (!targetUser) {
      // Create user if not exists
      targetUser = this.createUser({
        name: params.userName || params.userEmail?.split('@')[0] || 'Học Viên Nail',
        email: params.userEmail?.toLowerCase() || `learner_${Date.now()}@nailspeak.pro`,
        role: 'learner',
        status: 'active',
        note: params.note,
      });
    }

    const planInfo = SUBSCRIPTION_PLANS[params.planId] || {
      nameVi: params.planId,
      priceUsd: params.planId === '3_months' ? 14 : params.planId === '6_months' ? 25 : params.planId === '1_year' ? 40 : 99,
    };

    const newRequest: SubscriptionRequest = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      salonName: targetUser.salonName,
      salonLocation: targetUser.salonLocation,
      planId: params.planId,
      planName: planInfo.nameVi,
      priceUsd: planInfo.priceUsd,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      note: params.note,
    };

    if (!this.data.subscriptions) {
      this.data.subscriptions = [];
    }
    this.data.subscriptions.unshift(newRequest);

    // Update target user's pending status
    const updatedUser = this.updateUser(targetUser.id, {
      subscriptionStatus: 'pending',
      subscriptionRequestedPlan: params.planId,
    })!;

    // Add Audit Log
    this.addAuditLog({
      actorId: targetUser.id,
      actorName: targetUser.name,
      actorRole: targetUser.role,
      action: 'SUBSCRIPTION_REGISTER',
      targetResource: newRequest.id,
      details: `Học viên đăng ký ${planInfo.nameVi} ($${planInfo.priceUsd}). Trạng thái: Chờ Admin phê duyệt. Ghi chú: ${params.note || 'Không có'}`,
      status: 'success',
    });

    // Notify admins via system announcement
    this.data.settings.systemAnnouncement = `🔔 Thông Báo Quản Trị: Học viên ${targetUser.name} (${targetUser.email}) vừa đăng ký ${planInfo.nameVi} ($${planInfo.priceUsd}). Vui lòng vào duyệt gói!`;

    this.saveStore(this.data);

    return {
      success: true,
      request: newRequest,
      user: updatedUser,
    };
  }

  public approveSubscription(
    requestId: string,
    actor: AdminUser
  ): { success: boolean; request?: SubscriptionRequest; user?: AdminUser; error?: string } {
    const sub = this.getSubscriptionById(requestId);
    if (!sub) {
      return { success: false, error: 'Không tìm thấy yêu cầu đăng ký gói' };
    }

    sub.status = 'approved';
    sub.reviewedAt = new Date().toISOString();
    sub.reviewedBy = `${actor.name} (${actor.role})`;

    const targetUser = this.getUserById(sub.userId);
    let updatedUser: AdminUser | undefined;

    // Calculate expiration
    const now = new Date();
    let expiresAt: string;
    if (sub.planId === '3_months') {
      now.setMonth(now.getMonth() + 3);
      expiresAt = now.toISOString();
    } else if (sub.planId === '6_months') {
      now.setMonth(now.getMonth() + 6);
      expiresAt = now.toISOString();
    } else if (sub.planId === '1_year') {
      now.setFullYear(now.getFullYear() + 1);
      expiresAt = now.toISOString();
    } else {
      // Lifetime
      expiresAt = '2099-12-31T23:59:59Z';
    }

    if (targetUser) {
      updatedUser =
        this.updateUser(targetUser.id, {
          subscriptionStatus: 'active',
          subscriptionPlan: sub.planId,
          subscriptionExpiresAt: expiresAt,
          note: `Đã duyệt ${sub.planName} bởi ${actor.name} ngày ${new Date().toLocaleDateString('vi-VN')}`,
        }) || undefined;
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUBSCRIPTION_APPROVE',
      targetResource: sub.id,
      details: `Quản trị viên ${actor.name} đã DUYỆT thành công ${sub.planName} cho học viên ${sub.userName} (${sub.userEmail})`,
      status: 'success',
    });

    this.saveStore(this.data);

    return {
      success: true,
      request: sub,
      user: updatedUser,
    };
  }

  public rejectSubscription(
    requestId: string,
    actor: AdminUser,
    reason?: string
  ): { success: boolean; request?: SubscriptionRequest; error?: string } {
    const sub = this.getSubscriptionById(requestId);
    if (!sub) {
      return { success: false, error: 'Không tìm thấy yêu cầu đăng ký gói' };
    }

    sub.status = 'rejected';
    sub.reviewedAt = new Date().toISOString();
    sub.reviewedBy = `${actor.name} (${actor.role})`;
    if (reason) sub.note = (sub.note ? sub.note + ' | ' : '') + `Lý do từ chối: ${reason}`;

    const targetUser = this.getUserById(sub.userId);
    if (targetUser && targetUser.subscriptionStatus === 'pending') {
      this.updateUser(targetUser.id, {
        subscriptionStatus: 'none',
      });
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUBSCRIPTION_REJECT',
      targetResource: sub.id,
      details: `Quản trị viên ${actor.name} từ chối đăng ký gói của học viên ${sub.userName}. Lý do: ${reason || 'Không nêu'}`,
      status: 'success',
    });

    this.saveStore(this.data);

    return {
      success: true,
      request: sub,
    };
  }

  public setUserSubscription(
    userId: string,
    planId: SubscriptionPlanId,
    status: 'none' | 'pending' | 'active',
    actor?: AdminUser
  ): { success: boolean; user?: AdminUser; error?: string } {
    const target = this.getUserById(userId);
    if (!target) return { success: false, error: 'Không tìm thấy học viên' };

    const planInfo = SUBSCRIPTION_PLANS[planId];
    const updated = this.updateUser(userId, {
      subscriptionPlan: planId,
      subscriptionStatus: status,
      subscriptionExpiresAt: status === 'active' ? (planId === 'lifetime' ? '2099-12-31T23:59:59Z' : new Date(Date.now() + 180 * 86400000).toISOString()) : undefined,
    });

    if (actor) {
      this.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'USER_SUBSCRIPTION_UPDATE',
        targetResource: userId,
        details: `Cập nhật trực tiếp gói học viên ${target.name}: ${planInfo?.nameVi || planId} (Trạng thái: ${status})`,
        status: 'success',
      });
    }

    this.saveStore(this.data);
    return { success: true, user: updated || undefined };
  }
}

export const rbacStore = new RbacStore();
