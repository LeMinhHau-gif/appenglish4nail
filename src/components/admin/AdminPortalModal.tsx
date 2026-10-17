import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcherBar } from './RoleSwitcherBar';
import { DashboardTab } from './DashboardTab';
import { UsersRbacTab } from './UsersRbacTab';
import { ContentTab } from './ContentTab';
import { SupportTab } from './SupportTab';
import { ReportsTab } from './ReportsTab';
import { AuditLogsTab } from './AuditLogsTab';
import { SettingsTab } from './SettingsTab';
import {
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  Headphones,
  BarChart3,
  FileText,
  Settings,
  Lock,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  LogOut,
  LogIn,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Permission, UserRole, ROLE_DEFINITIONS } from '../../types/rbac';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const { hasPermission, roleDefinition, isAdmin, currentUser, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredPermission: Permission;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      requiredPermission: 'dashboard.view',
    },
    {
      id: 'users',
      label: 'Tài Khoản & Phân Quyền',
      icon: Users,
      requiredPermission: 'users.view',
    },
    {
      id: 'content',
      label: 'Nội Dung & Giáo Trình',
      icon: BookOpen,
      requiredPermission: 'courses.view',
    },
    {
      id: 'support',
      label: 'Bàn Hỗ Trợ Học Viên',
      icon: Headphones,
      requiredPermission: 'support.view',
    },
    {
      id: 'reports',
      label: 'Báo Cáo & Thống Kê',
      icon: BarChart3,
      requiredPermission: 'reports.view',
    },
    {
      id: 'audit',
      label: 'Nhật Ký Audit Logs',
      icon: FileText,
      requiredPermission: 'audit_logs.view',
      badge: 'Bảo Mật',
    },
    {
      id: 'settings',
      label: 'Cấu Hình Hệ Thống',
      icon: Settings,
      requiredPermission: 'settings.view',
      badge: 'Super Admin',
    },
  ];

  const handleAdminRoleLogin = async (role: UserRole) => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      await login(undefined, undefined, role);
    } catch (e: any) {
      setAdminError(e.message || 'Đăng nhập quản trị viên thất bại');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;
    setAdminLoading(true);
    setAdminError(null);
    try {
      await login(adminEmail.trim());
    } catch (e: any) {
      setAdminError(e.message || 'Email quản trị viên không chính xác');
    } finally {
      setAdminLoading(false);
    }
  };

  // GATEKEEPER VIEW: If user is not an administrator, deny entry and show discrete admin login
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full nail-card border nail-border rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 mx-auto flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-black nail-text-main">
              Cổng Quản Trị Hệ Thống
            </h2>
            <p className="text-[11px] text-amber-300 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-block">
              Dành riêng cho nhân sự quản trị (RBAC)
            </p>
            <p className="text-xs nail-text-secondary leading-relaxed pt-1">
              Bạn đang ở chế độ học viên thường. Vui lòng xác thực tài khoản quản trị để vào hệ thống điều hành.
            </p>
          </div>

          {adminError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {adminError}
            </div>
          )}

          {/* Quick Admin Role Access (5 roles) */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold nail-text-muted uppercase tracking-wider">
              Xác thực vai trò quản trị:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleAdminRoleLogin('super_admin')}
                disabled={adminLoading}
                className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="font-black text-amber-300 text-xs flex items-center justify-between">
                  <span>👑 Super Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[10px] text-amber-200/70 mt-0.5">Toàn quyền hệ thống</div>
              </button>

              <button
                onClick={() => handleAdminRoleLogin('admin')}
                disabled={adminLoading}
                className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="font-black text-rose-300 text-xs flex items-center justify-between">
                  <span>🛡️ Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[10px] text-rose-200/70 mt-0.5">Quản lý người học & nội dung</div>
              </button>

              <button
                onClick={() => handleAdminRoleLogin('content_manager')}
                disabled={adminLoading}
                className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="font-black text-emerald-300 text-xs flex items-center justify-between">
                  <span>✍️ Content Manager</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[10px] text-emerald-200/70 mt-0.5">Biên soạn giáo trình nail</div>
              </button>

              <button
                onClick={() => handleAdminRoleLogin('support')}
                disabled={adminLoading}
                className="p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="font-black text-sky-300 text-xs flex items-center justify-between">
                  <span>🎧 Support Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[10px] text-sky-200/70 mt-0.5">Hỗ trợ sự cố học viên</div>
              </button>

              <button
                onClick={() => handleAdminRoleLogin('analyst')}
                disabled={adminLoading}
                className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-left transition-all group cursor-pointer col-span-1 sm:col-span-2"
              >
                <div className="font-black text-purple-300 text-xs flex items-center justify-between">
                  <span>📊 Analyst (Chuyên viên phân tích số liệu)</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[10px] text-purple-200/70 mt-0.5">Xem báo cáo học tập & xuất file CSV</div>
              </button>
            </div>

            {/* Email input */}
            <form onSubmit={handleAdminEmailLogin} className="pt-2 flex gap-2">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Nhập email quản trị (vd: admin@nailspeak.pro)"
                className="flex-1 px-3 py-2 rounded-xl nail-bg-subtle border nail-border text-xs nail-text-main focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={adminLoading}
                className="px-4 py-2 rounded-xl nail-btn-primary font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Xác thực</span>
              </button>
            </form>
          </div>

          <div className="pt-2 border-t nail-border">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl nail-bg-subtle hover:bg-white/10 nail-text-muted hover:nail-text-main text-xs font-semibold border nail-border transition-all cursor-pointer"
            >
              ← Quay lại giao diện học tiếng Anh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMINISTRATOR VIEW: Full Enterprise Admin Suite
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <header className="nail-card border-b nail-border px-4 py-3 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl nail-bg-subtle hover:bg-white/10 border nail-border nail-text-main flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Về Giao Diện Học</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base nail-text-main flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Cổng Quản Trị Hệ Thống RBAC
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleDefinition.colorScheme.bg} ${roleDefinition.colorScheme.text} ${roleDefinition.colorScheme.border}`}
              >
                {roleDefinition.badge}
              </span>
            </div>
            <p className="text-[11px] nail-text-muted hidden sm:block">
              NailSpeak Pro Enterprise • Phân quyền 5 vai trò & kiểm soát truy cập đặc quyền tối thiểu
            </p>
          </div>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border nail-border text-xs">
              <div className="w-6 h-6 rounded-full nail-gradient-accent flex items-center justify-center text-[10px] text-white font-black">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold nail-text-main leading-tight">{currentUser.name}</div>
                <div className="text-[10px] nail-text-muted leading-tight">{currentUser.email}</div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            title="Đăng xuất tài khoản quản trị"
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Đóng bảng quản trị"
            className="p-2 rounded-xl nail-bg-subtle hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body with RoleSwitcherBar at top (only visible for super_admin) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-4">
        {/* Role Switcher Bar (visible only for testing if super_admin) */}
        <RoleSwitcherBar />

        {/* Tab Navigation Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b nail-border">
          {navItems.map((item) => {
            const hasAccess = hasPermission(item.requiredPermission);
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 border cursor-pointer ${
                  isActive
                    ? 'nail-btn-primary shadow-sm'
                    : hasAccess
                    ? 'nail-bg-subtle hover:bg-white/10 nail-text-main nail-border'
                    : 'opacity-50 nail-bg-subtle nail-text-muted border-dashed nail-border cursor-not-allowed'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {!hasAccess && <Lock className="w-3 h-3 text-rose-400 ml-0.5" />}
                {item.badge && hasAccess && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/15 text-white/90">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Render */}
        <main className="min-h-[500px]">
          {activeTab === 'dashboard' && <DashboardTab onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'users' && <UsersRbacTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'support' && <SupportTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'audit' && <AuditLogsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
};
