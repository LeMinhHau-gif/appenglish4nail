import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Download,
  Award,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const { hasPermission, currentRole } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getReports();
      setReportData(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải số liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('reports.view')) {
      fetchReports();
    }
  }, [hasPermission]);

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      await AdminService.downloadReportsCsv();
      setSuccess('Đã xuất file báo cáo CSV thành công (chuẩn UTF-8 mở trực tiếp trên Excel)!');
    } catch (e: any) {
      setError(e.message || 'Lỗi khi xuất file báo cáo CSV');
    } finally {
      setExporting(false);
    }
  };

  if (!hasPermission('reports.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Không có quyền xem Báo cáo & Thống kê</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Vai trò hiện tại không có quyền <code className="text-rose-300">reports.view</code>. Hãy chuyển vai trò sang{' '}
          <strong className="text-purple-300">Analyst (Chuyên viên phân tích)</strong>,{' '}
          <strong className="text-rose-300">Admin</strong>, hoặc <strong className="text-amber-300">Super Admin</strong>.
        </p>
      </div>
    );
  }

  if (loading && !reportData) {
    return (
      <div className="nail-card rounded-2xl p-12 text-center border nail-border">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
        <p className="text-sm nail-text-muted">Đang phân tích và tổng hợp số liệu học tập...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold nail-text-main flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Báo Cáo & Phân Tích Hiệu Suất Học Tập
          </h3>
          <p className="text-xs nail-text-muted mt-0.5">
            Dữ liệu tổng hợp tiến độ, phân bố điểm phát âm AI và chuyên cần của thợ nail tại Hoa Kỳ
          </p>
        </div>

        {hasPermission('reports.export') && (
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="nail-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            )}
            <span>Xuất Báo Cáo CSV (Excel)</span>
          </button>
        )}
      </div>

      {currentRole === 'analyst' && (
        <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Vai trò Analyst (Chuyên viên phân tích):</strong> Bạn có quyền xem toàn diện các biểu đồ, số liệu và xuất báo cáo CSV. Hệ thống bảo mật RBAC hạn chế thao tác sửa đổi hay xóa dữ liệu.
          </span>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pronunciation Distribution */}
        <div className="nail-card rounded-2xl p-4 border nail-border">
          <h4 className="font-bold text-sm nail-text-main mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-300" /> Phân Bổ Điểm Phát Âm Tiếng Anh
          </h4>

          <div className="space-y-3">
            {reportData?.pronunciationDistribution?.map((item: any, idx: number) => {
              const total = reportData.summary?.totalLearners || 4;
              const percent = Math.round((item.count / Math.max(1, total)) * 100);
              const colors = [
                'bg-emerald-500',
                'bg-amber-500',
                'bg-sky-500',
                'bg-rose-500',
              ];

              return (
                <div key={item.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="nail-text-main font-semibold">{item.range}</span>
                    <span className="nail-text-muted">
                      {item.count} học viên ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[idx % colors.length]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="nail-card rounded-2xl p-4 border nail-border">
          <h4 className="font-bold text-sm nail-text-main mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-300" /> Phân Bổ Bài Học Theo Chuyên Mục
          </h4>

          <div className="space-y-2">
            {Object.entries(reportData?.categoryBreakdown || {}).map(([catName, count]: any) => (
              <div
                key={catName}
                className="p-2 rounded-xl nail-bg-subtle border nail-border flex items-center justify-between text-xs"
              >
                <span className="font-semibold nail-text-main">{catName}</span>
                <span className="font-bold text-amber-300">{count} bài học</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Learners */}
      <div className="nail-card rounded-2xl p-4 border nail-border">
        <h4 className="font-bold text-sm nail-text-main mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-300" /> Học Viên Xuất Sắc Nhất Tháng
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b nail-border text-[11px] nail-text-muted uppercase font-bold">
                <th className="py-2 px-3">Học viên</th>
                <th className="py-2 px-3">Tiệm nail & Khu vực</th>
                <th className="py-2 px-3 text-center">Chuỗi Streak</th>
                <th className="py-2 px-3 text-center">Điểm AI</th>
                <th className="py-2 px-3 text-right">Tổng XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reportData?.topLearners?.map((learner: any, idx: number) => (
                <tr key={learner.id} className="hover:bg-white/5">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 text-xs">#{idx + 1}</span>
                      <span className="font-bold nail-text-main">{learner.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 nail-text-muted">
                    {learner.salonName} • {learner.salonLocation}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                    🔥 {learner.streakDays} ngày
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                    {learner.avgPronunciationScore} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold nail-text-main">
                    {learner.totalXp} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
