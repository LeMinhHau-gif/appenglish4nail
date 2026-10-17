import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { AuditLog, ROLE_DEFINITIONS } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Search,
  RefreshCw,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
} from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getAuditLogs(actionFilter, statusFilter);
      setLogs(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('audit_logs.view')) {
      fetchLogs();
    }
  }, [hasPermission, actionFilter, statusFilter]);

  if (!hasPermission('audit_logs.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Khu Vực Bảo Mật Super Admin</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Chỉ có <strong className="text-amber-300">Super Admin (Quản trị viên cấp cao)</strong> mới có quyền truy cập nhật ký bảo mật và lịch sử thao tác hệ thống (<code className="text-rose-300">audit_logs.view</code>).
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.actorName.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.targetResource.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold nail-text-main flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> Nhật Ký Hoạt Động & Bảo Mật (Audit Logs)
          </h3>
          <p className="text-xs nail-text-muted mt-0.5">
            Lưu vết toàn bộ thao tác gán quyền, thay đổi tài khoản, xuất bản bài học và các lần truy cập trái phép
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="nail-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="nail-card rounded-2xl p-3 border nail-border flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 nail-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo người thực hiện, hành động, hoặc chi tiết thao tác..."
            className="w-full nail-input pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Lọc theo loại thao tác"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Tất cả thao tác</option>
            <option value="ROLE_ASSIGN">Gán vai trò RBAC</option>
            <option value="USER_CREATE">Tạo người dùng</option>
            <option value="USER_LOCK">Khóa tài khoản</option>
            <option value="COURSE_PUBLISH">Xuất bản bài học</option>
            <option value="SETTINGS_UPDATE">Cập nhật cấu hình</option>
            <option value="ACCESS_DENIED">Bị từ chối truy cập</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo kết quả thực hiện"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Mọi kết quả</option>
            <option value="success">Thành công</option>
            <option value="denied">Từ chối truy cập</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="nail-card rounded-2xl border nail-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b nail-border bg-white/5 text-[11px] font-bold nail-text-muted uppercase tracking-wider">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Người thực hiện</th>
                <th className="py-2.5 px-3">Hành động</th>
                <th className="py-2.5 px-3">Chi tiết & Đối tượng</th>
                <th className="py-2.5 px-3 text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredLogs.map((log) => {
                const roleDef = ROLE_DEFINITIONS[log.actorRole];
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors font-sans text-xs">
                    <td className="py-3 px-3 nail-text-muted whitespace-nowrap">
                      <span className="block font-semibold text-amber-200/90">
                        {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-[11px] opacity-75">
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold nail-text-main block">{log.actorName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border inline-block mt-0.5 ${roleDef?.colorScheme.bg || 'bg-white/10'} ${roleDef?.colorScheme.text || 'text-white'} ${roleDef?.colorScheme.border || 'border-white/20'}`}
                      >
                        {roleDef?.badge || log.actorRole}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-md">
                      <p className="nail-text-main">{log.details}</p>
                      <span className="text-[10px] font-mono nail-text-muted">
                        Mục tiêu: {log.targetResource} {log.ipAddress ? `• IP: ${log.ipAddress}` : ''}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Thành công
                        </span>
                      )}
                      {log.status === 'denied' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                          <AlertOctagon className="w-3 h-3" /> Bị từ chối
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <XCircle className="w-3 h-3" /> Thất bại
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
