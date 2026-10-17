import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/adminService';
import { DashboardStats, ROLE_DEFINITIONS, UserRole } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BookOpen,
  Award,
  Headphones,
  Clock,
  Shield,
  Activity,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface DashboardTabProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateTab }) => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getDashboard();
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('dashboard.view')) {
      fetchStats();
    }
  }, [hasPermission]);

  if (!hasPermission('dashboard.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <Shield className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Không có quyền truy cập Dashboard</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Vai trò hiện tại của bạn không có quyền <code className="text-rose-300">dashboard.view</code>.
          Hãy dùng thanh chọn vai trò ở trên để chuyển sang <strong className="text-amber-300">Super Admin</strong>,{' '}
          <strong className="text-rose-300">Admin</strong> hoặc <strong className="text-purple-300">Analyst</strong>.
        </p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="nail-card rounded-2xl p-12 text-center border nail-border">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-sm nail-text-muted">Đang tải số liệu tổng quan hệ thống...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nail-card rounded-2xl p-6 border border-rose-500/30 bg-rose-500/10 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm text-rose-200">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-1.5 text-xs rounded-xl bg-white/10 hover:bg-white/20 nail-text-main font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-5">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="nail-card rounded-2xl p-4 border nail-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold nail-text-muted">Tổng Học Viên</span>
            <div className="p-2 rounded-xl bg-pink-500/15 text-pink-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold nail-text-main">{stats.totalLearners}</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +100%
            </span>
          </div>
          <p className="text-[11px] nail-text-muted mt-1">Đang hoạt động trên toàn quốc</p>
        </div>

        <div className="nail-card rounded-2xl p-4 border nail-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold nail-text-muted">Bài Học & Tình Huống</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold nail-text-main">{stats.totalLessons}</span>
            <span className="text-[11px] text-amber-300 font-medium">Chuẩn tiệm nail Mỹ</span>
          </div>
          <p className="text-[11px] nail-text-muted mt-1">8 chuyên mục thực tế</p>
        </div>

        <div className="nail-card rounded-2xl p-4 border nail-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold nail-text-muted">Điểm Phát Âm TB</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold nail-text-main">{stats.avgPronunciationScore}/100</span>
            <span className="text-[11px] text-emerald-400 font-medium">Mức Tốt</span>
          </div>
          <p className="text-[11px] nail-text-muted mt-1">Đánh giá bởi AI & Web Speech</p>
        </div>

        <div className="nail-card rounded-2xl p-4 border nail-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold nail-text-muted">Hỗ Trợ Chờ Xử Lý</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold nail-text-main">{stats.pendingSupportTickets}</span>
            <span className="text-[11px] text-sky-400 font-medium">Cần hỗ trợ</span>
          </div>
          <p className="text-[11px] nail-text-muted mt-1">Giải đáp thắc mắc phát âm & kỹ thuật</p>
        </div>
      </div>

      {/* Role Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Role Distribution Card */}
        <div className="nail-card rounded-2xl p-4 border nail-border md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-300" />
              <h4 className="font-bold text-sm nail-text-main">Cơ Cấu 5 Vai Trò Quản Trị RBAC</h4>
            </div>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs text-amber-300 hover:underline flex items-center gap-1"
            >
              Xem chi tiết <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(stats.roleDistribution) as UserRole[]).map((rKey) => {
              const def = ROLE_DEFINITIONS[rKey];
              const count = stats.roleDistribution[rKey];
              return (
                <div
                  key={rKey}
                  className={`p-2.5 rounded-xl border ${def.colorScheme.bg} ${def.colorScheme.border}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold nail-text-main">{def.badge}</span>
                    <span className="text-base font-extrabold nail-text-main">{count}</span>
                  </div>
                  <p className="text-[10px] nail-text-muted mt-1 truncate">{def.nameVi}</p>
                  <span className="text-[10px] text-amber-200/90 font-medium">
                    {def.permissions.length} quyền cấp
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="nail-card rounded-2xl p-4 border nail-border">
          <h4 className="font-bold text-sm nail-text-main mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-300" /> Thao Tác Nhanh
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('users')}
              className="w-full text-left p-2.5 rounded-xl nail-bg-subtle hover:bg-white/10 border nail-border transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold nail-text-main block">Quản lý Tài khoản & Phân quyền</span>
                <span className="text-[11px] nail-text-muted">Thêm, khóa, gán quyền RBAC</span>
              </div>
              <span className="text-xs text-amber-300">→</span>
            </button>

            <button
              onClick={() => onNavigateTab('content')}
              className="w-full text-left p-2.5 rounded-xl nail-bg-subtle hover:bg-white/10 border nail-border transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold nail-text-main block">Quản lý Bài học & Nội dung</span>
                <span className="text-[11px] nail-text-muted">Tạo mới, xuất bản, lưu nháp</span>
              </div>
              <span className="text-xs text-amber-300">→</span>
            </button>

            <button
              onClick={() => onNavigateTab('support')}
              className="w-full text-left p-2.5 rounded-xl nail-bg-subtle hover:bg-white/10 border nail-border transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold nail-text-main block">Hỗ trợ Học viên Tiệm Nail</span>
                <span className="text-[11px] nail-text-muted">Xử lý thắc mắc và ghi chú</span>
              </div>
              <span className="text-xs text-amber-300">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Stream */}
      <div className="nail-card rounded-2xl p-4 border nail-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-sm nail-text-main">Nhật Ký Thao Tác Quản Trị Gần Đây</h4>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs nail-text-muted hover:nail-text-main flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Làm mới
          </button>
        </div>

        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
          {stats.recentActivities.map((act) => {
            const roleDef = ROLE_DEFINITIONS[act.actorRole];
            return (
              <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold nail-text-main">{act.actorName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${roleDef?.colorScheme.bg || 'bg-white/10'} ${roleDef?.colorScheme.text || 'text-white'} ${roleDef?.colorScheme.border || 'border-white/20'}`}
                    >
                      {roleDef?.badge || act.actorRole}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 nail-text-muted">
                      {act.action}
                    </span>
                  </div>
                  <p className="text-xs nail-text-main mt-0.5">{act.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] nail-text-muted block">
                    {new Date(act.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${act.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {act.status === 'success' ? '✓ Thành công' : '✗ Từ chối'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
