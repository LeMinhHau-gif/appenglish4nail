import { Router, Request, Response, NextFunction } from 'express';
import { rbacStore } from './rbacStore.js';
import {
  AdminUser,
  Permission,
  ROLE_DEFINITIONS,
  UserRole,
} from '../src/types/rbac.js';

export const rbacRouter = Router();

// Extend Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AdminUser;
}

// Authentication middleware
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check Authorization header or custom header
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.startsWith('token-')) {
      userId = token.replace('token-', '');
    } else {
      userId = token;
    }
  } else if (customUserId) {
    userId = customUserId;
  }

  // Retrieve user by ID or Email
  let user: AdminUser | undefined;
  if (userId) {
    user = rbacStore.getUserById(userId) || rbacStore.getUserByEmail(userId);
  }

  // If path is an admin path and user is not authenticated or not an admin
  const isAdminPath = req.originalUrl.includes('/admin/');
  if (isAdminPath) {
    if (!user) {
      return res.status(401).json({
        error: 'Chưa xác thực: Vui lòng đăng nhập với tài khoản Quản trị viên để truy cập.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (user.role === 'learner') {
      return res.status(403).json({
        error: 'Truy cập bị từ chối: Tài khoản học viên không có quyền truy cập vào Cổng Quản Trị Hệ Thống.',
        code: 'FORBIDDEN_LEARNER',
      });
    }
  }

  if (user && user.status === 'locked') {
    return res.status(403).json({
      error: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên cấp cao.',
      code: 'ACCOUNT_LOCKED',
    });
  }

  req.user = user;
  next();
}

// Permission checking middleware generator
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa.' });
    }

    const roleDef = ROLE_DEFINITIONS[user.role];
    const hasPerm = roleDef && roleDef.permissions.includes(permission);

    if (!hasPerm) {
      // Audit log the unauthorized access attempt
      rbacStore.addAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'ACCESS_DENIED',
        targetResource: req.originalUrl,
        details: `Cố gắng thực hiện quyền [${permission}] không được cấp phép`,
        status: 'denied',
        ipAddress: req.ip || '127.0.0.1',
      });

      return res.status(403).json({
        error: `Truy cập bị từ chối: Vai trò '${roleDef?.nameVi || user.role}' không có quyền '${permission}'.`,
        requiredPermission: permission,
        role: user.role,
      });
    }

    next();
  };
}

// ==========================================
// 1. AUTHENTICATION & DEMO SWITCHER ROUTES
// ==========================================

// Login endpoint
rbacRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  let targetUser: AdminUser | undefined;
  if (role && typeof role === 'string') {
    targetUser = rbacStore.getUsers().find((u) => u.role === role && u.status === 'active');
  } else if (email) {
    targetUser = rbacStore.getUserByEmail(email);
  }

  if (!targetUser) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  if (targetUser.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản này đã bị khóa. Vui lòng liên hệ Super Admin.' });
  }

  // Update last login
  targetUser = rbacStore.updateUser(targetUser.id, { lastLogin: new Date().toISOString() })!;

  rbacStore.addAuditLog({
    actorId: targetUser.id,
    actorName: targetUser.name,
    actorRole: targetUser.role,
    action: 'USER_LOGIN',
    targetResource: 'auth.session',
    details: `Đăng nhập thành công vào hệ thống với vai trò ${ROLE_DEFINITIONS[targetUser.role]?.nameVi}`,
    status: 'success',
  });

  return res.json({
    token: `token-${targetUser.id}`,
    user: targetUser,
    permissions: ROLE_DEFINITIONS[targetUser.role]?.permissions || [],
  });
});

// Google Sign-In endpoint
rbacRouter.post('/auth/google', (req: Request, res: Response) => {
  const { email, name, avatarUrl, googleId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email tài khoản Google là bắt buộc.' });
  }

  const result = rbacStore.handleGoogleAuth({
    email: String(email).trim(),
    name: name ? String(name).trim() : email.split('@')[0],
    avatarUrl,
    googleId,
  });

  return res.json({
    token: result.token,
    user: result.user,
    isNew: result.isNew,
    permissions: ROLE_DEFINITIONS[result.user.role]?.permissions || [],
    roleDefinition: ROLE_DEFINITIONS[result.user.role],
    message: result.isNew
      ? 'Đăng ký tài khoản mới qua Google thành công! Bạn đang ở vai trò Học viên.'
      : 'Đăng nhập Google thành công!',
  });
});

// Quick demo role switcher endpoint (crucial for live evaluation of all 5 roles)
rbacRouter.post('/auth/switch-demo-role', (req: Request, res: Response) => {
  const { targetRole } = req.body;
  if (!targetRole || !ROLE_DEFINITIONS[targetRole as UserRole]) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  }

  const user = rbacStore.getUsers().find((u) => u.role === targetRole && u.status === 'active');
  if (!user) {
    return res.status(404).json({ error: `Không tìm thấy tài khoản mẫu cho vai trò ${targetRole}` });
  }

  return res.json({
    token: `token-${user.id}`,
    user,
    permissions: ROLE_DEFINITIONS[user.role]?.permissions || [],
    roleDefinition: ROLE_DEFINITIONS[user.role],
  });
});

// Get current profile
rbacRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user,
    roleDefinition: ROLE_DEFINITIONS[user.role],
    permissions: ROLE_DEFINITIONS[user.role]?.permissions || [],
  });
});

// ==========================================
// 2. ROLES & RBAC MATRIX DEFINITIONS
// ==========================================

rbacRouter.get('/admin/roles', authenticate, requirePermission('roles.view'), (_req: Request, res: Response) => {
  const roles = Object.values(ROLE_DEFINITIONS);
  return res.json(roles);
});

// ==========================================
// 3. DASHBOARD STATS
// ==========================================

rbacRouter.get('/admin/dashboard', authenticate, requirePermission('dashboard.view'), (_req: Request, res: Response) => {
  const stats = rbacStore.getDashboardStats();
  return res.json(stats);
});

// ==========================================
// 4. USER MANAGEMENT (RBAC)
// ==========================================

// List users with search, role, and status filtering
rbacRouter.get('/admin/users', authenticate, requirePermission('users.view'), (req: AuthenticatedRequest, res: Response) => {
  const { search, role, status } = req.query;
  let users = rbacStore.getUsers();

  // If user is 'support', mask out non-learner sensitive info if any
  if (req.user?.role === 'support') {
    // Support can view learners, but only sees basic info for admins
  }

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.salonLocation && u.salonLocation.toLowerCase().includes(q)) ||
        (u.salonName && u.salonName.toLowerCase().includes(q))
    );
  }

  if (typeof role === 'string' && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }

  if (typeof status === 'string' && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  return res.json(users);
});

// Create new user
rbacRouter.post('/admin/users', authenticate, requirePermission('users.create'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { name, email, role, salonName, salonLocation, phone, note } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Họ tên, email và vai trò là bắt buộc.' });
  }

  const existing = rbacStore.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống.' });
  }

  // Security check: only Super Admin can create Super Admin accounts
  if (role === 'super_admin' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ có Super Admin mới có quyền tạo tài khoản Super Admin!' });
  }

  const newUser = rbacStore.createUser({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: role as UserRole,
    status: 'active',
    salonName: salonName ? String(salonName).trim() : 'Tiệm Nail California',
    salonLocation: salonLocation ? String(salonLocation).trim() : 'USA',
    phone: phone ? String(phone).trim() : '',
    note: note ? String(note).trim() : 'Tạo mới từ trang quản trị',
    totalXp: role === 'learner' ? 100 : 2500,
    streakDays: 1,
    completedLessonsCount: 0,
    avgPronunciationScore: 80,
  });

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'USER_CREATE',
    targetResource: newUser.id,
    details: `Tạo tài khoản mới: ${newUser.name} (${newUser.email}) - Vai trò: ${ROLE_DEFINITIONS[newUser.role]?.nameVi}`,
    status: 'success',
  });

  return res.status(201).json(newUser);
});

// Update user
rbacRouter.put('/admin/users/:id', authenticate, requirePermission('users.update'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;
  const target = rbacStore.getUserById(targetId);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  // If modifying super_admin, actor must be super_admin
  if (target.role === 'super_admin' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Bạn không có quyền sửa thông tin của Super Admin!' });
  }

  const { name, salonName, salonLocation, phone, note, avgPronunciationScore, streakDays } = req.body;
  const updated = rbacStore.updateUser(targetId, {
    ...(name ? { name: String(name).trim() } : {}),
    ...(salonName ? { salonName: String(salonName).trim() } : {}),
    ...(salonLocation ? { salonLocation: String(salonLocation).trim() } : {}),
    ...(phone ? { phone: String(phone).trim() } : {}),
    ...(note !== undefined ? { note: String(note).trim() } : {}),
    ...(typeof avgPronunciationScore === 'number' ? { avgPronunciationScore } : {}),
    ...(typeof streakDays === 'number' ? { streakDays } : {}),
  });

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'USER_UPDATE',
    targetResource: targetId,
    details: `Cập nhật thông tin người dùng ${target.name}`,
    status: 'success',
  });

  return res.json(updated);
});

// Lock user
rbacRouter.post('/admin/users/:id/lock', authenticate, requirePermission('users.lock'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;
  const target = rbacStore.getUserById(targetId);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  if (target.role === 'super_admin' && actor.role !== 'super_admin') {
    return res.status(403).json({ error: 'Không thể khóa tài khoản của Super Admin!' });
  }

  const result = rbacStore.setUserLock(targetId, true);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'USER_LOCK',
    targetResource: targetId,
    details: `Khóa tài khoản ${target.name} (${target.email})`,
    status: 'success',
  });

  return res.json({ success: true, user: result.user });
});

// Unlock user
rbacRouter.post('/admin/users/:id/unlock', authenticate, requirePermission('users.unlock'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;
  const target = rbacStore.getUserById(targetId);

  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  const result = rbacStore.setUserLock(targetId, false);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'USER_UNLOCK',
    targetResource: targetId,
    details: `Mở khóa tài khoản ${target.name} (${target.email})`,
    status: 'success',
  });

  return res.json({ success: true, user: result.user });
});

// Assign role with security guardrails (supports POST and PUT)
const handleAssignRole = (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.id;
  const { newRole, role, note } = req.body;
  const targetRole = newRole || role;

  if (!targetRole || !ROLE_DEFINITIONS[targetRole as UserRole]) {
    return res.status(400).json({ error: 'Vai trò mới không hợp lệ.' });
  }

  const target = rbacStore.getUserById(targetId);
  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  const result = rbacStore.assignUserRole(targetId, targetRole as UserRole, actor, note);
  if (!result.success) {
    rbacStore.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ROLE_ASSIGN_FAILED',
      targetResource: targetId,
      details: `Không thể thay đổi vai trò ${target.name}: ${result.error}`,
      status: 'failed',
    });
    return res.status(403).json({ error: result.error });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'ROLE_ASSIGN',
    targetResource: targetId,
    details: `Cấp quyền & gán vai trò [${ROLE_DEFINITIONS[targetRole as UserRole]?.nameVi}] cho ${target.name}${note ? ` (Ghi chú: ${note})` : ''}`,
    status: 'success',
  });

  return res.json({ success: true, user: result.user });
};

rbacRouter.post('/admin/users/:id/role', authenticate, requirePermission('roles.assign'), handleAssignRole);
rbacRouter.put('/admin/users/:id/role', authenticate, requirePermission('roles.assign'), handleAssignRole);

// Get pending or new users waiting for role assignment
rbacRouter.get('/admin/users/pending', authenticate, requirePermission('roles.assign'), (_req: Request, res: Response) => {
  const pending = rbacStore.getPendingRoleUsers();
  return res.json(pending);
});

// View a specific learner's study history in database (for Admin / Support)
rbacRouter.get('/admin/learners/:id/history', authenticate, requirePermission('users.view'), (req: AuthenticatedRequest, res: Response) => {
  const learnerId = req.params.id;
  const history = rbacStore.getLearnerHistory(learnerId);
  return res.json(history);
});

// ==========================================
// 4B. LEARNER STUDY HISTORY & STATS SYNC (PUBLIC/AUTHENTICATED)
// ==========================================

// Save a learner study action to persistent database
rbacRouter.post('/learners/history', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let currentUserId = 'usr-learner-1';
  let currentUserName = 'Lisa Hoàng';
  let currentUserEmail = 'learner@nailspeak.pro';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const cleanId = token.startsWith('token-') ? token.replace('token-', '') : token;
    const user = rbacStore.getUserById(cleanId) || rbacStore.getUserByEmail(cleanId);
    if (user) {
      currentUserId = user.id;
      currentUserName = user.name;
      currentUserEmail = user.email;
    }
  }

  const { lessonId, lessonTitle, action, score, details, targetSentence, spokenSentence, audioBlobUrl } = req.body;

  const record = rbacStore.addLearnerHistory({
    userId: currentUserId,
    userName: currentUserName,
    userEmail: currentUserEmail,
    lessonId,
    lessonTitle,
    action: action || 'recording_practice',
    score: typeof score === 'number' ? score : undefined,
    details,
    targetSentence,
    spokenSentence,
    audioBlobUrl,
  });

  return res.json({ success: true, record });
});

// Get current learner study history from database
rbacRouter.get('/learners/history', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const requestedUserId = req.query.userId as string;
  let targetId = requestedUserId;

  if (!targetId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    targetId = token.startsWith('token-') ? token.replace('token-', '') : token;
  }

  const history = rbacStore.getLearnerHistory(targetId);
  return res.json(history);
});

// Sync learner cumulative stats to persistent database
rbacRouter.post('/learners/stats/sync', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let targetId = req.body.userId;

  if (!targetId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    targetId = token.startsWith('token-') ? token.replace('token-', '') : token;
  }

  if (!targetId) {
    targetId = 'usr-learner-1';
  }

  const { totalXp, streakDays, completedLessonIds, savedVocabIds, avgPronunciationScore } = req.body;
  const updatedUser = rbacStore.syncLearnerStats(targetId, {
    totalXp,
    streakDays,
    completedLessonIds,
    savedVocabIds,
    avgPronunciationScore,
  });

  return res.json({ success: true, user: updatedUser });
});

// ==========================================
// 4C. SUBSCRIPTION REGISTRATION & ADMIN APPROVAL
// ==========================================

// Learner registers for a subscription package ($14, $25, $40, $99)
rbacRouter.post('/subscriptions/register', (req: Request, res: Response) => {
  const { userId, userEmail, userName, planId, note } = req.body;
  if (!planId) {
    return res.status(400).json({ error: 'Vui lòng chọn gói học (3 tháng, 6 tháng, 1 năm hoặc vĩnh viễn).' });
  }

  const result = rbacStore.registerSubscription({
    userId,
    userEmail,
    userName,
    planId,
    note,
  });

  return res.json({
    success: true,
    request: result.request,
    user: result.user,
    message: 'Đăng ký gói thành công! Hệ thống quản trị đã nhận được thông báo để Admin duyệt.',
  });
});

// Admin: Get all subscription requests
rbacRouter.get('/admin/subscriptions', authenticate, (req: Request, res: Response) => {
  const status = req.query.status as string;
  const requests = rbacStore.getSubscriptions(status);
  return res.json(requests);
});

// Admin: Approve a subscription request
rbacRouter.post('/admin/subscriptions/:id/approve', authenticate, requirePermission('users.update'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const requestId = req.params.id;

  const result = rbacStore.approveSubscription(requestId, actor);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    request: result.request,
    user: result.user,
    message: 'Đã duyệt và kích hoạt gói học thành công!',
  });
});

// Admin: Reject a subscription request
rbacRouter.post('/admin/subscriptions/:id/reject', authenticate, requirePermission('users.update'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const requestId = req.params.id;
  const { reason } = req.body;

  const result = rbacStore.rejectSubscription(requestId, actor, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    request: result.request,
    message: 'Đã từ chối yêu cầu đăng ký gói.',
  });
});

// Admin: Directly assign or update a user's subscription
rbacRouter.post('/admin/users/:id/subscription', authenticate, requirePermission('users.update'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const userId = req.params.id;
  const { planId, status } = req.body;

  const result = rbacStore.setUserSubscription(userId, planId, status || 'active', actor);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    user: result.user,
    message: 'Cập nhật gói học viên thành công!',
  });
});

// ==========================================
// 5. COURSES & CONTENT MANAGEMENT
// ==========================================

// Get all courses
rbacRouter.get('/admin/courses', authenticate, requirePermission('courses.view'), (_req: Request, res: Response) => {
  return res.json(rbacStore.getCourses());
});

// Create course
rbacRouter.post('/admin/courses', authenticate, requirePermission('courses.create'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const body = req.body;

  if (!body.title || !body.category) {
    return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc.' });
  }

  const newCourse = rbacStore.createCourse({
    title: String(body.title).trim(),
    tagline: body.tagline || 'Bài học giao tiếp tình huống thực tế tại tiệm nail',
    category: body.category || 'customer_care',
    categoryNameVi: body.categoryNameVi || 'Chăm Sóc Khách',
    iconName: body.iconName || 'Sparkles',
    badge: body.badge || 'Mới',
    difficulty: body.difficulty || 'Cơ bản',
    estimatedMinutes: Number(body.estimatedMinutes) || 8,
    summary: body.summary || '',
    culturalNote: body.culturalNote || '',
    dialogue: Array.isArray(body.dialogue) ? body.dialogue : [],
    keyPhrases: Array.isArray(body.keyPhrases) ? body.keyPhrases : [],
    vocabulary: Array.isArray(body.vocabulary) ? body.vocabulary : [],
    practicalTips: Array.isArray(body.practicalTips) ? body.practicalTips : [],
    quiz: Array.isArray(body.quiz) ? body.quiz : [],
    isPublished: Boolean(body.isPublished),
  });

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'COURSE_CREATE',
    targetResource: newCourse.id,
    details: `Tạo bài học mới: ${newCourse.title} (${newCourse.isPublished ? 'Xuất bản' : 'Bản nháp'})`,
    status: 'success',
  });

  return res.status(201).json(newCourse);
});

// Update course
rbacRouter.put('/admin/courses/:id', authenticate, requirePermission('courses.update'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const courseId = req.params.id;
  const updates = req.body;

  const updated = rbacStore.updateCourse(courseId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'COURSE_UPDATE',
    targetResource: courseId,
    details: `Cập nhật nội dung bài học: ${updated.title}`,
    status: 'success',
  });

  return res.json(updated);
});

// Toggle publish course
rbacRouter.post('/admin/courses/:id/publish', authenticate, requirePermission('courses.publish'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const courseId = req.params.id;
  const course = rbacStore.getCourseById(courseId);

  if (!course) {
    return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }

  const willPublish = !course.isPublished;
  const updated = rbacStore.updateCourse(courseId, {
    isPublished: willPublish,
    publishedAt: willPublish ? new Date().toISOString() : undefined,
  });

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: willPublish ? 'COURSE_PUBLISH' : 'COURSE_UNPUBLISH',
    targetResource: courseId,
    details: `${willPublish ? 'Xuất bản' : 'Chuyển về bản nháp'} bài học: ${course.title}`,
    status: 'success',
  });

  return res.json(updated);
});

// Delete course
rbacRouter.delete('/admin/courses/:id', authenticate, requirePermission('courses.delete'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const courseId = req.params.id;
  const course = rbacStore.getCourseById(courseId);

  if (!course) {
    return res.status(404).json({ error: 'Không tìm thấy bài học.' });
  }

  const success = rbacStore.deleteCourse(courseId);
  if (!success) {
    return res.status(500).json({ error: 'Không thể xóa bài học.' });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'COURSE_DELETE',
    targetResource: courseId,
    details: `Xóa bài học: ${course.title}`,
    status: 'success',
  });

  return res.json({ success: true, message: `Đã xóa bài học ${course.title}` });
});

// ==========================================
// 6. SUPPORT TICKETS MANAGEMENT
// ==========================================

// Get tickets
rbacRouter.get('/admin/support/tickets', authenticate, requirePermission('support.view'), (_req: Request, res: Response) => {
  return res.json(rbacStore.getSupportTickets());
});

// Create ticket
rbacRouter.post('/admin/support/tickets', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { subject, category, priority, salonLocation } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Tiêu đề yêu cầu hỗ trợ là bắt buộc.' });
  }

  const newTicket = rbacStore.createSupportTicket({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    salonLocation: salonLocation || user.salonLocation || 'Chưa cập nhật',
    subject: String(subject).trim(),
    category: category || 'lesson_content',
    priority: priority || 'medium',
    status: 'open',
  });

  rbacStore.addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'TICKET_CREATE',
    targetResource: newTicket.id,
    details: `Tạo yêu cầu hỗ trợ: "${newTicket.subject}"`,
    status: 'success',
  });

  return res.status(201).json(newTicket);
});

// Update ticket (status, add note)
rbacRouter.put('/admin/support/tickets/:id', authenticate, requirePermission('support.manage'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const ticketId = req.params.id;
  const { status, note, priority, assignedTo } = req.body;

  const updated = rbacStore.updateSupportTicket(
    ticketId,
    {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    },
    note ? { authorName: actor.name, content: String(note).trim() } : undefined
  );

  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy yêu cầu hỗ trợ.' });
  }

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'TICKET_UPDATE',
    targetResource: ticketId,
    details: `Cập nhật yêu cầu hỗ trợ #${ticketId} (Trạng thái: ${status || updated.status})`,
    status: 'success',
  });

  return res.json(updated);
});

// ==========================================
// 7. REPORTS & DATA EXPORT (ANALYST / ADMIN)
// ==========================================

rbacRouter.get('/admin/reports', authenticate, requirePermission('reports.view'), (_req: Request, res: Response) => {
  const stats = rbacStore.getDashboardStats();
  const users = rbacStore.getUsers();
  const courses = rbacStore.getCourses();

  const categoryBreakdown: Record<string, number> = {};
  for (const c of courses) {
    categoryBreakdown[c.categoryNameVi] = (categoryBreakdown[c.categoryNameVi] || 0) + 1;
  }

  const pronunciationDistribution = [
    { range: '90 - 100 điểm (Xuất sắc)', count: users.filter((u) => (u.avgPronunciationScore || 0) >= 90).length },
    { range: '80 - 89 điểm (Tốt)', count: users.filter((u) => (u.avgPronunciationScore || 0) >= 80 && (u.avgPronunciationScore || 0) < 90).length },
    { range: '70 - 79 điểm (Khá)', count: users.filter((u) => (u.avgPronunciationScore || 0) >= 70 && (u.avgPronunciationScore || 0) < 80).length },
    { range: 'Dưới 70 điểm (Cần rèn luyện)', count: users.filter((u) => (u.avgPronunciationScore || 0) < 70).length },
  ];

  return res.json({
    summary: stats,
    categoryBreakdown,
    pronunciationDistribution,
    topLearners: users
      .filter((u) => u.role === 'learner')
      .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))
      .slice(0, 5),
  });
});

// CSV Export Endpoint
rbacRouter.get('/admin/reports/export', authenticate, requirePermission('reports.export'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const users = rbacStore.getUsers();

  // Generate CSV Header & rows
  const headers = ['ID', 'HoTen', 'Email', 'VaiTro', 'TrangThai', 'TiemNail', 'KhuVuc', 'DiemPhatAmTB', 'TongXP', 'NgayStreak', 'BaiDaHoc', 'DangNhapCuoi'];
  const rows = users.map((u) => [
    `"${u.id}"`,
    `"${u.name}"`,
    `"${u.email}"`,
    `"${ROLE_DEFINITIONS[u.role]?.nameVi || u.role}"`,
    `"${u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}"`,
    `"${u.salonName || ''}"`,
    `"${u.salonLocation || ''}"`,
    `"${u.avgPronunciationScore || 0}"`,
    `"${u.totalXp || 0}"`,
    `"${u.streakDays || 0}"`,
    `"${u.completedLessonsCount || 0}"`,
    `"${new Date(u.lastLogin).toLocaleString('vi-VN')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'REPORT_EXPORT',
    targetResource: 'reports.csv',
    details: `Xuất file báo cáo danh sách và tiến độ học viên (${users.length} tài khoản)`,
    status: 'success',
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="NailSpeak_BaoCao_HocVien_${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csvContent);
});

// ==========================================
// 8. AUDIT LOGS (SUPER ADMIN)
// ==========================================

rbacRouter.get('/admin/audit-logs', authenticate, requirePermission('audit_logs.view'), (req: AuthenticatedRequest, res: Response) => {
  const { action, status } = req.query;
  let logs = rbacStore.getAuditLogs();

  if (typeof action === 'string' && action !== 'all') {
    logs = logs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
  }

  if (typeof status === 'string' && status !== 'all') {
    logs = logs.filter((l) => l.status === status);
  }

  return res.json(logs);
});

// ==========================================
// 9. SYSTEM SETTINGS (SUPER ADMIN ONLY)
// ==========================================

rbacRouter.get('/admin/settings', authenticate, requirePermission('settings.view'), (_req: Request, res: Response) => {
  return res.json(rbacStore.getSettings());
});

rbacRouter.put('/admin/settings', authenticate, requirePermission('settings.manage'), (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const updates = req.body;

  const newSettings = rbacStore.updateSettings(updates);

  rbacStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'SETTINGS_UPDATE',
    targetResource: 'system.settings',
    details: `Cập nhật cấu hình hệ thống: Bảo trì=${newSettings.maintenanceMode}, Điểm sàn=${newSettings.minPronunciationPassScore}`,
    status: 'success',
  });

  return res.json(newSettings);
});
