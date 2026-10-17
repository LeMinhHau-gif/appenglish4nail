import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { FirestoreSyncService } from '../../services/firestoreSync';
import {
  AdminUser,
  LearnerHistoryRecord,
  Permission,
  ROLE_DEFINITIONS,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanId,
  SubscriptionRequest,
  UserRole,
} from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Building,
  MapPin,
  CheckCircle2,
  Sparkles,
  History,
  Clock,
  Mic,
  Award,
  BookOpen,
  Crown,
  CreditCard,
} from 'lucide-react';

export const UsersRbacTab: React.FC = () => {
  const { hasPermission, currentUser } = useAuth();
  const [subTab, setSubTab] = useState<'users' | 'pending' | 'subscriptions' | 'matrix'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRequest[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState<AdminUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('learner');
  const [roleGrantNote, setRoleGrantNote] = useState<string>('');

  // Learner History Modal
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);
  const [learnerHistory, setLearnerHistory] = useState<LearnerHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'learner' as UserRole,
    salonName: '',
    salonLocation: '',
    phone: '',
    note: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await AdminService.getUsers(search, roleFilter, statusFilter);
      setUsers(data);
    } catch (e: any) {
      setActionError(e.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const data = await AdminService.getSubscriptions();
      setSubscriptions(data);
    } catch (e: any) {
      console.warn('Could not fetch subscriptions:', e);
    } finally {
      setSubsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('users.view')) {
      fetchUsers();
      fetchSubscriptions();
    }
  }, [hasPermission, roleFilter, statusFilter]);

  const handleApproveSubscription = async (sub: SubscriptionRequest) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await AdminService.approveSubscription(sub.id);
      try {
        await FirestoreSyncService.approveSubscription(sub.id, currentUser?.name || 'Quản Trị Viên');
      } catch (fErr) {
        console.warn('Firestore subscription approval sync warning:', fErr);
      }
      setActionSuccess(
        `Đã DUYỆT thành công ${sub.planName} cho học viên ${sub.userName} (${sub.userEmail})! Học viên đã được kích hoạt toàn bộ bài học.`
      );
      fetchSubscriptions();
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi duyệt gói học');
    }
  };

  const handleRejectSubscription = async (sub: SubscriptionRequest) => {
    const reason = prompt(`Lý do từ chối gói của ${sub.userName}:`, 'Chưa nhận được chuyển khoản / Thông tin không khớp');
    if (reason === null) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await AdminService.rejectSubscription(sub.id, reason);
      setActionSuccess(`Đã từ chối đăng ký gói của ${sub.userName}`);
      fetchSubscriptions();
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi từ chối gói học');
    }
  };

  const handleQuickGrantSubscription = async (user: AdminUser, planId: SubscriptionPlanId) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await AdminService.assignUserSubscription(user.id, planId, 'active');
      setActionSuccess(`Đã kích hoạt trực tiếp ${SUBSCRIPTION_PLANS[planId].nameVi} cho học viên ${user.name}`);
      fetchUsers();
      fetchSubscriptions();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi kích hoạt gói');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleLockToggle = async (user: AdminUser) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      if (user.status === 'active') {
        if (!confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.name}"?`)) return;
        await AdminService.lockUser(user.id);
        setActionSuccess(`Đã khóa thành công tài khoản ${user.name}`);
      } else {
        await AdminService.unlockUser(user.id);
        setActionSuccess(`Đã mở khóa thành công tài khoản ${user.name}`);
      }
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi thay đổi trạng thái tài khoản');
    }
  };

  const handleAssignRoleSubmit = async () => {
    if (!showRoleModal) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await AdminService.assignRole(showRoleModal.id, selectedNewRole, roleGrantNote);
      setActionSuccess(
        `Đã cấp quyền & cập nhật vai trò của ${showRoleModal.name} thành [${ROLE_DEFINITIONS[selectedNewRole]?.nameVi}]`
      );
      setShowRoleModal(null);
      setRoleGrantNote('');
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi gán vai trò');
    }
  };

  const handleViewHistory = async (user: AdminUser) => {
    setHistoryUser(user);
    setHistoryLoading(true);
    try {
      const hist = await AdminService.getLearnerDetailHistory(user.id);
      setLearnerHistory(hist);
    } catch (e: any) {
      console.warn('Could not fetch detailed learner history:', e);
      setLearnerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      await AdminService.createUser(newUserForm);
      setActionSuccess(`Tạo tài khoản mới thành công cho ${newUserForm.name}`);
      setShowAddModal(false);
      setNewUserForm({
        name: '',
        email: '',
        role: 'learner',
        salonName: '',
        salonLocation: '',
        phone: '',
        note: '',
      });
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi tạo tài khoản');
    }
  };

  if (!hasPermission('users.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Không có quyền truy cập Người Dùng</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Vai trò của bạn không có quyền <code className="text-rose-300">users.view</code>. Chỉ Quản trị viên
          được cấp quyền mới có thể truy cập danh sách người dùng.
        </p>
      </div>
    );
  }

  const allPermissionsList: { code: Permission; name: string; group: string }[] = [
    { code: 'dashboard.view', name: 'Xem bảng điều khiển & KPIs', group: 'Dashboard' },
    { code: 'users.view', name: 'Xem danh sách tài khoản học viên', group: 'Tài Khoản' },
    { code: 'users.create', name: 'Tạo tài khoản quản trị & học viên', group: 'Tài Khoản' },
    { code: 'users.update', name: 'Chỉnh sửa thông tin học viên', group: 'Tài Khoản' },
    { code: 'users.lock', name: 'Khóa tài khoản vi phạm', group: 'Tài Khoản' },
    { code: 'users.unlock', name: 'Mở khóa tài khoản', group: 'Tài Khoản' },
    { code: 'roles.view', name: 'Xem ma trận phân quyền RBAC', group: 'Phân Quyền' },
    { code: 'roles.assign', name: 'Gán vai trò cho người dùng', group: 'Phân Quyền' },
    { code: 'roles.manage', name: 'Điều chỉnh quyền hệ thống tối cao', group: 'Phân Quyền' },
    { code: 'courses.view', name: 'Xem danh sách bài học & giáo trình', group: 'Nội Dung' },
    { code: 'courses.create', name: 'Soạn thảo bài học mới', group: 'Nội Dung' },
    { code: 'courses.update', name: 'Cập nhật nội dung câu thoại, từ vựng', group: 'Nội Dung' },
    { code: 'courses.publish', name: 'Xuất bản hoặc lưu nháp bài học', group: 'Nội Dung' },
    { code: 'courses.delete', name: 'Xóa bài học khỏi hệ thống', group: 'Nội Dung' },
    { code: 'vocabulary.manage', name: 'Quản lý kho từ vựng chuyên ngành', group: 'Nội Dung' },
    { code: 'lessons.manage', name: 'Quản lý lộ trình bài học', group: 'Nội Dung' },
    { code: 'roleplay.manage', name: 'Quản lý kịch bản giao tiếp khách', group: 'Nội Dung' },
    { code: 'reports.view', name: 'Xem số liệu thống kê tiến độ', group: 'Báo Cáo' },
    { code: 'reports.export', name: 'Xuất báo cáo định dạng CSV', group: 'Báo Cáo' },
    { code: 'support.view', name: 'Xem danh sách yêu cầu hỗ trợ', group: 'Hỗ Trợ' },
    { code: 'support.manage', name: 'Xử lý, ghi chú ticket hỗ trợ', group: 'Hỗ Trợ' },
    { code: 'audit_logs.view', name: 'Xem nhật ký hoạt động hệ thống', group: 'Bảo Mật' },
    { code: 'settings.view', name: 'Xem cấu hình hệ thống', group: 'Cấu Hình' },
    { code: 'settings.manage', name: 'Thay đổi cấu hình & bảo trì', group: 'Cấu Hình' },
  ];

  const pendingUsers = users.filter((u) => u.isNewUser || u.role === 'learner');
  const pendingSubscriptions = subscriptions.filter((s) => s.status === 'pending');
  const displayedUsers = subTab === 'pending' ? pendingUsers : users;

  return (
    <div className="space-y-4">
      {/* Sub Tabs: Users List vs Pending Role Grant vs Subscriptions vs RBAC Matrix */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl nail-bg-subtle border nail-border flex-wrap">
          <button
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'users' ? 'nail-btn-primary shadow-sm' : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            Tất Cả Người Dùng ({users.length})
          </button>
          <button
            onClick={() => setSubTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'pending' ? 'nail-btn-primary shadow-sm' : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chờ Cấp Quyền ({pendingUsers.length})</span>
          </button>
          <button
            onClick={() => setSubTab('subscriptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'subscriptions' ? 'nail-btn-primary shadow-sm' : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Duyệt Gói Học Viên ({pendingSubscriptions.length})</span>
            {pendingSubscriptions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setSubTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'matrix' ? 'nail-btn-primary shadow-sm' : 'nail-text-muted hover:nail-text-main'
            }`}
          >
            Ma Trận RBAC (5 Vai Trò)
          </button>
        </div>

        {subTab !== 'matrix' && hasPermission('users.create') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="nail-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" /> Thêm Tài Khoản Mới
          </button>
        )}
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View 1 & 2: USERS LIST or PENDING ROLE USERS */}
      {(subTab === 'users' || subTab === 'pending') && (
        <div className="space-y-3">
          {/* Search & Filters */}
          <div className="nail-card rounded-2xl p-3 border nail-border flex flex-col sm:flex-row items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 nail-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên học viên, email Google, tiệm nail, thành phố..."
                className="w-full nail-input pl-9 pr-3 py-1.5 text-xs rounded-xl"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Lọc theo vai trò"
                className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="content_manager">Content Manager</option>
                <option value="support">Support</option>
                <option value="analyst">Analyst</option>
                <option value="learner">Học viên (Learner)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>

              <button
                onClick={fetchUsers}
                title="Làm mới"
                className="p-1.5 rounded-xl nail-bg-subtle hover:bg-white/10 nail-border border cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {subTab === 'pending' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-300">Quản lý cấp quyền tài khoản mới:</span>
                <span className="nail-text-secondary ml-1">
                  Đây là danh sách người dùng đã đăng ký qua Google hoặc đang ở vai trò Học viên.
                  Quản trị viên có thể bấm <strong className="text-amber-200">"Cấp Quyền"</strong> để bổ nhiệm vai trò quản trị tương ứng.
                </span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="nail-card rounded-2xl border nail-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b nail-border bg-white/5 text-[11px] font-bold nail-text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3">Người dùng / Học viên</th>
                    <th className="py-2.5 px-3">Vai trò RBAC</th>
                    <th className="py-2.5 px-3">Gói Bài Học</th>
                    <th className="py-2.5 px-3">Tiệm Nail & Địa điểm</th>
                    <th className="py-2.5 px-3 text-center">Điểm AI / XP</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center nail-text-muted">
                        Không có người dùng nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => {
                      const roleDef = ROLE_DEFINITIONS[u.role];
                      const isSelf = currentUser?.id === u.id;
                      const canAssign = hasPermission('roles.assign') && (!isSelf || currentUser?.role === 'super_admin');
                      const canLock = hasPermission('users.lock');

                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          {/* Name & Email & Google Badge */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full nail-bg-subtle border nail-border flex items-center justify-center font-bold text-xs nail-text-main shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold nail-text-main">{u.name}</span>
                                  {u.authProvider === 'google' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                      Google
                                    </span>
                                  )}
                                  {u.isNewUser && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                                      Mới
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] nail-text-muted block">{u.email}</span>
                                {u.roleGrantedBy && (
                                  <span className="text-[10px] text-amber-300/80 block mt-0.5">
                                    Cấp bởi: {u.roleGrantedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleDef?.colorScheme.bg} ${roleDef?.colorScheme.text} ${roleDef?.colorScheme.border}`}
                            >
                              {roleDef?.badge || u.role}
                            </span>
                          </td>

                          {/* Gói Bài Học (Subscription) */}
                          <td className="py-3 px-3">
                            {u.subscriptionStatus === 'active' ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>{SUBSCRIPTION_PLANS[u.subscriptionPlan || '6_months']?.nameVi || 'VIP Full'}</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                  Mở 100% bài học
                                </span>
                              </div>
                            ) : u.subscriptionStatus === 'pending' ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                  <span>Chờ duyệt: {SUBSCRIPTION_PLANS[u.subscriptionRequestedPlan || '6_months']?.nameVi}</span>
                                </span>
                                {hasPermission('users.update') && (
                                  <button
                                    onClick={() => handleQuickGrantSubscription(u, u.subscriptionRequestedPlan || '6_months')}
                                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold border border-emerald-500/40 cursor-pointer self-start"
                                  >
                                    ✓ Kích hoạt ngay
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] nail-text-muted">Học thử (5 bài)</span>
                                {hasPermission('users.update') && (
                                  <button
                                    onClick={() => handleQuickGrantSubscription(u, 'lifetime')}
                                    title="Cấp quyền VIP Vĩnh Viễn"
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 cursor-pointer"
                                  >
                                    + Cấp VIP
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Salon Info */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col text-[11px]">
                              <span className="nail-text-main flex items-center gap-1">
                                <Building className="w-3 h-3 text-rose-300" />
                                {u.salonName || 'Chưa cập nhật tiệm'}
                              </span>
                              <span className="nail-text-muted flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {u.salonLocation || 'Hoa Kỳ'}
                              </span>
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-emerald-400 block">{u.avgPronunciationScore || 75} đ</span>
                            <span className="text-[10px] nail-text-muted">{u.totalXp || 0} XP</span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View Learning History from DB */}
                              <button
                                onClick={() => handleViewHistory(u)}
                                title="Xem lịch sử học tập & phát âm từ cơ sở dữ liệu"
                                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 nail-text-main border nail-border flex items-center gap-1 cursor-pointer"
                              >
                                <History className="w-3 h-3 text-sky-400" />
                                <span className="hidden sm:inline">Lịch sử</span>
                              </button>

                              {/* Grant / Change Role */}
                              {canAssign && (
                                <button
                                  onClick={() => {
                                    setShowRoleModal(u);
                                    setSelectedNewRole(u.role === 'learner' ? 'support' : u.role);
                                  }}
                                  title="Cấp quyền & Gán vai trò quản trị"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Cấp Quyền</span>
                                </button>
                              )}

                              {canLock && !isSelf && (
                                <button
                                  onClick={() => handleLockToggle(u)}
                                  title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                  className={`p-1.5 rounded-lg text-[11px] border cursor-pointer ${
                                    u.status === 'active'
                                      ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30'
                                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30'
                                  }`}
                                >
                                  {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2B: SUBSCRIPTION APPROVALS (DUYỆT GÓI HỌC VIÊN) */}
      {subTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Header Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  Đang Chờ Duyệt Gói
                </span>
                <span className="text-xl font-black text-amber-200 mt-0.5 block">
                  {pendingSubscriptions.length} yêu cầu
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
                <Crown className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Đã Kích Hoạt VIP
                </span>
                <span className="text-xl font-black text-emerald-200 mt-0.5 block">
                  {subscriptions.filter((s) => s.status === 'approved').length} học viên
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl nail-card border nail-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold nail-text-muted uppercase tracking-wider block">
                  Mức Giá Tiêu Chuẩn
                </span>
                <span className="text-xs font-black text-slate-200 mt-1 block">
                  $14 (3T) • $25 (6T) • $40 (1N) • $99 (Vĩnh Viễn)
                </span>
              </div>
              <button
                onClick={fetchSubscriptions}
                title="Làm mới danh sách"
                className="p-2 rounded-xl nail-bg-subtle hover:bg-white/10 nail-border border cursor-pointer text-white/70 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${subsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="nail-card rounded-2xl border nail-border overflow-hidden">
            <div className="p-3.5 border-b nail-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-sm nail-text-main">
                  Danh Sách Yêu Cầu Đăng Ký Gói Bài Học
                </h4>
              </div>
              <span className="text-xs nail-text-muted">
                Tổng: {subscriptions.length} lượt đăng ký
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b nail-border bg-white/5 text-[11px] font-bold nail-text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3">Học viên</th>
                    <th className="py-2.5 px-3">Gói Đăng Ký</th>
                    <th className="py-2.5 px-3">Mức Giá</th>
                    <th className="py-2.5 px-3">Ghi Chú Thanh Toán / Zelle</th>
                    <th className="py-2.5 px-3">Thời Gian Gửi</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Phê Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center nail-text-muted">
                        Chưa có yêu cầu đăng ký gói nào từ học viên.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isPending = sub.status === 'pending';
                      const isApproved = sub.status === 'approved';

                      return (
                        <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-extrabold nail-text-main">{sub.userName}</div>
                            <div className="text-[11px] nail-text-muted">{sub.userEmail}</div>
                            {sub.salonName && (
                              <div className="text-[10px] text-rose-300/80 mt-0.5">
                                {sub.salonName} ({sub.salonLocation || 'Hoa Kỳ'})
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>{sub.planName}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-sm font-black text-emerald-400">
                              ${sub.priceUsd}
                            </span>
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <div className="text-xs text-slate-200 italic line-clamp-2">
                              {sub.note || 'Không có ghi chú'}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-[11px] nail-text-muted whitespace-nowrap">
                            {new Date(sub.requestedAt).toLocaleString('vi-VN')}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                <span>Chờ Duyệt</span>
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã Duyệt (Active)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <span>Đã Từ Chối</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveSubscription(sub)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Duyệt Gói (Mở Full)</span>
                                </button>
                                <button
                                  onClick={() => handleRejectSubscription(sub)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 cursor-pointer active:scale-95 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] nail-text-muted">
                                {sub.reviewedBy ? `Duyệt bởi: ${sub.reviewedBy}` : 'Đã xử lý'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 3: RBAC MATRIX */}
      {subTab === 'matrix' && (
        <div className="nail-card rounded-2xl p-4 border nail-border space-y-4">
          <div className="border-b nail-border pb-3">
            <h4 className="font-bold text-sm nail-text-main flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-300" /> Ma Trận Phân Quyền 5 Vai Trò Quản Trị Hệ Thống
            </h4>
            <p className="text-xs nail-text-muted mt-1">
              Phân quyền chặt chẽ theo nguyên tắc đặc quyền tối thiểu (PoLP). Toàn bộ thao tác đều được kiểm tra ở backend Express và ghi nhận Audit Log.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b nail-border bg-white/5">
                  <th className="py-2.5 px-3 font-bold nail-text-muted uppercase text-[11px]">Mã Quyền & Chức Năng</th>
                  <th className="py-2.5 px-2 text-center font-bold text-amber-300">👑 Super Admin</th>
                  <th className="py-2.5 px-2 text-center font-bold text-rose-300">🛡️ Admin</th>
                  <th className="py-2.5 px-2 text-center font-bold text-emerald-300">✍️ Content</th>
                  <th className="py-2.5 px-2 text-center font-bold text-sky-300">🎧 Support</th>
                  <th className="py-2.5 px-2 text-center font-bold text-purple-300">📊 Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allPermissionsList.map((p) => {
                  const saHas = ROLE_DEFINITIONS.super_admin.permissions.includes(p.code);
                  const admHas = ROLE_DEFINITIONS.admin.permissions.includes(p.code);
                  const cmHas = ROLE_DEFINITIONS.content_manager.permissions.includes(p.code);
                  const supHas = ROLE_DEFINITIONS.support.permissions.includes(p.code);
                  const anaHas = ROLE_DEFINITIONS.analyst.permissions.includes(p.code);

                  return (
                    <tr key={p.code} className="hover:bg-white/5">
                      <td className="py-2 px-3">
                        <span className="font-semibold nail-text-main block">{p.name}</span>
                        <code className="text-[10px] text-amber-200/80 font-mono">{p.code}</code>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {saHas ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {admHas ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {cmHas ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {supHas ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {anaHas ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="nail-card rounded-3xl p-6 border nail-border w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b nail-border mb-4">
              <h4 className="font-bold text-base nail-text-main flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-300" /> Thêm Tài Khoản Mới
              </h4>
              <button onClick={() => setShowAddModal(false)} className="nail-text-muted hover:nail-text-main cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold nail-text-muted mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Michelle Trương"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="michelle@nailstudio.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Vai trò khởi tạo *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                >
                  <option value="learner">Học viên (Thợ nail)</option>
                  <option value="support">Nhân viên hỗ trợ (Support)</option>
                  <option value="content_manager">Quản lý nội dung (Content Manager)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  {currentUser?.role === 'super_admin' && (
                    <option value="super_admin">Quản trị viên cấp cao (Super Admin)</option>
                  )}
                  <option value="analyst">Chuyên viên phân tích (Analyst)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Tên tiệm nail</label>
                  <input
                    type="text"
                    placeholder="Ruby Nails & Spa"
                    value={newUserForm.salonName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, salonName: e.target.value })}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Thành phố / Tiểu bang</label>
                  <input
                    type="text"
                    placeholder="Houston, TX"
                    value={newUserForm.salonLocation}
                    onChange={(e) => setNewUserForm({ ...newUserForm, salonLocation: e.target.value })}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl nail-bg-subtle nail-text-muted hover:nail-text-main cursor-pointer"
                >
                  Hủy
                </button>
                <button type="submit" className="nail-btn-primary px-4 py-2 rounded-xl font-bold cursor-pointer">
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ROLE & GRANT PERMISSIONS */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="nail-card rounded-3xl p-6 border nail-border w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b nail-border mb-4">
              <h4 className="font-bold text-base nail-text-main flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300" /> Cấp Quyền & Phân Vai Trò Quản Trị
              </h4>
              <button onClick={() => setShowRoleModal(null)} className="nail-text-muted hover:nail-text-main cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border nail-border mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full nail-gradient-accent flex items-center justify-center text-sm font-extrabold text-white">
                {showRoleModal.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold nail-text-main">{showRoleModal.name}</div>
                <div className="text-[11px] nail-text-muted">{showRoleModal.email}</div>
                <div className="text-[10px] text-amber-300 mt-0.5">
                  Vai trò hiện tại: {ROLE_DEFINITIONS[showRoleModal.role]?.nameVi}
                </div>
              </div>
            </div>

            <label className="block text-xs font-bold nail-text-main mb-2">
              Chọn vai trò cần cấp cho tài khoản này:
            </label>

            <div className="space-y-2 mb-4 text-xs">
              {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((r) => {
                const def = ROLE_DEFINITIONS[r];
                const isSelected = selectedNewRole === r;
                const isDisabled = r === 'super_admin' && currentUser?.role !== 'super_admin';

                return (
                  <button
                    key={r}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedNewRole(r)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'nail-btn-primary font-bold shadow-sm'
                        : 'nail-bg-subtle hover:bg-white/10 nail-border'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div>
                      <span className="font-bold nail-text-main block">{def.badge} - {def.nameVi}</span>
                      <span className="text-[11px] nail-text-muted block mt-0.5 leading-snug">{def.description}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-300 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Note input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold nail-text-muted mb-1">
                Ghi chú lý do cấp quyền / Bổ nhiệm
              </label>
              <input
                type="text"
                value={roleGrantNote}
                onChange={(e) => setRoleGrantNote(e.target.value)}
                placeholder="Ví dụ: Bổ nhiệm làm Content Manager soạn thảo bài học nail California"
                className="w-full nail-input py-2 px-3 text-xs rounded-xl"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 mb-4">
              🛡️ Thao tác cấp quyền sẽ được ghi lại vào <strong>Nhật ký Audit Log</strong> với tên người thực hiện: <strong>{currentUser?.name}</strong> ({currentUser?.role}).
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(null)}
                className="px-4 py-2 rounded-xl nail-bg-subtle nail-text-muted hover:nail-text-main text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAssignRoleSubmit}
                className="nail-btn-primary px-4 py-2 rounded-xl font-bold text-xs cursor-pointer active:scale-95"
              >
                Xác Nhận Cấp Quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW LEARNER HISTORY FROM DATABASE */}
      {historyUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="nail-card rounded-3xl p-6 border nail-border w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b nail-border mb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base nail-text-main">
                    Lịch Sử Học Tập Cơ Sở Dữ Liệu
                  </h4>
                  <p className="text-[11px] nail-text-muted">
                    Học viên: <strong className="nail-text-main">{historyUser.name}</strong> ({historyUser.email})
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryUser(null)} className="nail-text-muted hover:nail-text-main cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {historyLoading ? (
                <div className="py-12 text-center nail-text-muted text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Đang tải dữ liệu học viên từ database...</span>
                </div>
              ) : learnerHistory.length === 0 ? (
                <div className="py-12 text-center nail-text-muted text-xs">
                  Chưa có bản ghi lịch sử học tập nào trong cơ sở dữ liệu cho học viên này.
                </div>
              ) : (
                learnerHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl nail-bg-subtle border nail-border text-xs space-y-1 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold nail-text-main flex items-center gap-1.5">
                        {item.action === 'lesson_complete' ? (
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Mic className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{item.lessonTitle || item.lessonId || 'Hoạt động học tập'}</span>
                      </span>
                      {typeof item.score === 'number' && (
                        <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                          {item.score} điểm
                        </span>
                      )}
                    </div>

                    {item.details && (
                      <p className="text-[11px] nail-text-secondary">{item.details}</p>
                    )}

                    {item.targetSentence && (
                      <div className="text-[11px] bg-black/20 p-2 rounded-xl nail-text-muted mt-1 font-mono">
                        "{item.targetSentence}"
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] nail-text-muted pt-1 border-t nail-border/50">
                      <span>Mã: {item.id}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t nail-border flex justify-end">
              <button
                onClick={() => setHistoryUser(null)}
                className="px-4 py-2 rounded-xl nail-btn-primary text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
