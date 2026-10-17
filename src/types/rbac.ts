export type UserRole =
  | 'super_admin'      // Quản trị viên cấp cao: toàn quyền
  | 'admin'            // Quản trị viên: quản lý người học & nội dung
  | 'content_manager'  // Quản lý nội dung: bài học, từ vựng, tình huống
  | 'support'          // Nhân viên hỗ trợ: tra cứu học viên, xử lý yêu cầu
  | 'analyst'          // Chuyên viên phân tích: xem báo cáo, xuất số liệu
  | 'learner';         // Học viên tiệm nail

export type Permission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.lock'
  | 'users.unlock'
  | 'roles.view'
  | 'roles.assign'
  | 'roles.manage'
  | 'courses.view'
  | 'courses.create'
  | 'courses.update'
  | 'courses.publish'
  | 'courses.delete'
  | 'vocabulary.manage'
  | 'lessons.manage'
  | 'roleplay.manage'
  | 'reports.view'
  | 'reports.export'
  | 'support.view'
  | 'support.manage'
  | 'audit_logs.view'
  | 'settings.view'
  | 'settings.manage';

export interface RoleDefinition {
  id: UserRole;
  nameVi: string;
  nameEn: string;
  badge: string;
  description: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
  };
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    nameVi: 'Quản Trị Viên Cấp Cao',
    nameEn: 'Super Admin',
    badge: '👑 Super Admin',
    description: 'Toàn quyền tối cao: cấu hình hệ thống, quản lý tài khoản admin, phân quyền RBAC và kiểm tra audit log.',
    colorScheme: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
    },
    permissions: [
      'dashboard.view',
      'users.view',
      'users.create',
      'users.update',
      'users.lock',
      'users.unlock',
      'roles.view',
      'roles.assign',
      'roles.manage',
      'courses.view',
      'courses.create',
      'courses.update',
      'courses.publish',
      'courses.delete',
      'vocabulary.manage',
      'lessons.manage',
      'roleplay.manage',
      'reports.view',
      'reports.export',
      'support.view',
      'support.manage',
      'audit_logs.view',
      'settings.view',
      'settings.manage',
    ],
  },
  admin: {
    id: 'admin',
    nameVi: 'Quản Trị Viên',
    nameEn: 'Admin',
    badge: '🛡️ Admin',
    description: 'Quản lý người học, quản lý nội dung học tập, xem dashboard và xử lý vận hành thông thường.',
    colorScheme: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
    },
    permissions: [
      'dashboard.view',
      'users.view',
      'users.create',
      'users.update',
      'users.lock',
      'users.unlock',
      'roles.view',
      'courses.view',
      'courses.create',
      'courses.update',
      'courses.publish',
      'vocabulary.manage',
      'lessons.manage',
      'roleplay.manage',
      'reports.view',
      'support.view',
      'support.manage',
    ],
  },
  content_manager: {
    id: 'content_manager',
    nameVi: 'Quản Lý Nội Dung',
    nameEn: 'Content Manager',
    badge: '✍️ Content Manager',
    description: 'Tạo, sửa, lưu nháp và xuất bản khóa học, bài học, từ vựng và kịch bản hội thoại mẫu.',
    colorScheme: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
    },
    permissions: [
      'courses.view',
      'courses.create',
      'courses.update',
      'courses.publish',
      'courses.delete',
      'vocabulary.manage',
      'lessons.manage',
      'roleplay.manage',
    ],
  },
  support: {
    id: 'support',
    nameVi: 'Nhân Viên Hỗ Trợ',
    nameEn: 'Support Staff',
    badge: '🎧 Support',
    description: 'Tra cứu thông tin học viên, xem tiến độ học tập và ghi nhận hỗ trợ thắc mắc tiệm nail.',
    colorScheme: {
      bg: 'bg-sky-500/20',
      text: 'text-sky-300',
      border: 'border-sky-500/40',
    },
    permissions: [
      'users.view',
      'courses.view',
      'support.view',
      'support.manage',
    ],
  },
  analyst: {
    id: 'analyst',
    nameVi: 'Chuyên Viên Phân Tích',
    nameEn: 'Data Analyst',
    badge: '📊 Analyst',
    description: 'Xem thống kê tiến độ học viên, tỷ lệ hoàn thành và xuất báo cáo dữ liệu định dạng CSV.',
    colorScheme: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
    },
    permissions: [
      'dashboard.view',
      'courses.view',
      'reports.view',
      'reports.export',
    ],
  },
  learner: {
    id: 'learner',
    nameVi: 'Học Viên Tiệm Nail',
    nameEn: 'Learner',
    badge: '💅 Thợ Nail',
    description: 'Người học tiếng Anh: tham gia bài học, luyện phát âm AI, luyện hội thoại và thi đua bảng xếp hạng.',
    colorScheme: {
      bg: 'bg-pink-500/20',
      text: 'text-pink-300',
      border: 'border-pink-500/40',
    },
    permissions: [
      'courses.view',
    ],
  },
};

export type SubscriptionPlanId = 'free' | '3_months' | '6_months' | '1_year' | 'lifetime';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  nameVi: string;
  durationLabel: string;
  priceUsd: number;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    nameVi: 'Gói Học Thử Miễn Phí',
    durationLabel: '5 bài học đầu tiên',
    priceUsd: 0,
    features: [
      'Truy cập 5 bài học tình huống cơ bản',
      'Luyện phát âm AI cơ bản',
      'Lưu từ vựng yêu thích',
    ],
  },
  '3_months': {
    id: '3_months',
    nameVi: 'Gói 3 Tháng',
    durationLabel: '3 tháng học tập',
    priceUsd: 14,
    features: [
      'Mở khóa 100% tất cả các bài học và tình huống',
      'AI chấm điểm phát âm không giới hạn',
      'Luyện hội thoại salon thực tế 24/7',
      'Đồng bộ cơ sở dữ liệu học tập',
    ],
  },
  '6_months': {
    id: '6_months',
    nameVi: 'Gói 6 Tháng',
    durationLabel: '6 tháng rèn luyện',
    priceUsd: 25,
    popular: true,
    features: [
      'Toàn quyền học tất cả bài học hiện có & mới',
      'Chuyên đề kỹ năng xử lý phàn nàn & upsell',
      'Luyện phản xạ nghe nói bản xứ cấp tốc',
      'Ưu tiên hỗ trợ từ bộ phận Support',
    ],
  },
  '1_year': {
    id: '1_year',
    nameVi: 'Gói 1 Năm',
    durationLabel: '12 tháng nâng cao',
    priceUsd: 40,
    features: [
      'Tiết kiệm tối đa cho thợ nail gắn bó tại Mỹ',
      'Nắm trọn vẹn thuật ngữ ngành nail & spa',
      'Kỹ năng tăng tiền tip và giữ khách quen',
      'Huy hiệu VIP thành viên trên bảng xếp hạng',
    ],
  },
  lifetime: {
    id: 'lifetime',
    nameVi: 'Gói Vĩnh Viễn (Lifetime)',
    durationLabel: 'Sở hữu trọn đời',
    priceUsd: 99,
    features: [
      'Truy cập vĩnh viễn không cần gia hạn',
      'Cập nhật miễn phí tất cả giáo trình salon tương lai',
      'Đặc quyền thành viên VIP cao cấp nhất',
      'Hỗ trợ 1-1 các tình huống giao tiếp thực tế',
    ],
  },
};

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  salonName?: string;
  salonLocation?: string;
  planId: SubscriptionPlanId;
  planName: string;
  priceUsd: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'locked';
  salonLocation?: string;
  salonName?: string;
  createdAt: string;
  lastLogin: string;
  totalXp?: number;
  streakDays?: number;
  completedLessonsCount?: number;
  avgPronunciationScore?: number;
  avatarUrl?: string;
  phone?: string;
  note?: string;
  authProvider?: 'google' | 'local' | 'demo';
  isNewUser?: boolean;
  roleGrantedBy?: string;
  roleGrantedAt?: string;
  completedLessonIds?: string[];
  savedVocabIds?: string[];
  subscriptionPlan?: SubscriptionPlanId;
  subscriptionStatus?: 'none' | 'pending' | 'active';
  subscriptionRequestedPlan?: SubscriptionPlanId;
  subscriptionExpiresAt?: string;
}

export interface LearnerHistoryRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  lessonId?: string;
  lessonTitle?: string;
  action: 'lesson_complete' | 'recording_practice' | 'quiz' | 'vocab_save' | 'daily_streak';
  score?: number;
  details?: string;
  targetSentence?: string;
  spokenSentence?: string;
  audioBlobUrl?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
  status: 'success' | 'denied' | 'failed';
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  salonLocation: string;
  subject: string;
  category: 'audio_issue' | 'pronunciation_ai' | 'lesson_content' | 'account' | 'payment_tips';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  internalNotes: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
}

export interface SystemSettings {
  appName: string;
  salonSupportHotline: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
  minPronunciationPassScore: number;
  systemAnnouncement: string;
  sessionTimeoutHours: number;
  enableAiRoleplay: boolean;
}

export interface DashboardStats {
  totalLearners: number;
  activeToday: number;
  totalLessons: number;
  completionRatePercent: number;
  avgPronunciationScore: number;
  totalPracticedHours: number;
  pendingSupportTickets: number;
  roleDistribution: Record<UserRole, number>;
  recentActivities: AuditLog[];
}

import type { Lesson } from './index';

export interface CourseItem extends Lesson {
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

