import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { SystemSettings } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Save,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sliders,
  PhoneCall,
  Power,
  RefreshCw,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getSettings();
      setSettings(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('settings.view')) {
      fetchSettings();
    }
  }, [hasPermission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await AdminService.updateSettings(settings);
      setSettings(updated);
      setSuccess('Cấu hình hệ thống đã được lưu và áp dụng toàn diện!');
    } catch (e: any) {
      setError(e.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('settings.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Khu Vực Quản Trị Cấp Cao</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Chỉ có <strong className="text-amber-300">Super Admin (Quản trị viên cấp cao)</strong> mới có quyền xem và cấu hình thông số hệ thống (<code className="text-rose-300">settings.view</code>, <code className="text-rose-300">settings.manage</code>).
        </p>
      </div>
    );
  }

  if (loading && !settings) {
    return (
      <div className="nail-card rounded-2xl p-12 text-center border nail-border">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-sm nail-text-muted">Đang tải cấu hình...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-base font-bold nail-text-main flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" /> Cấu Hình Hệ Thống & Bảo Trì Toàn Diện
        </h3>
        <p className="text-xs nail-text-muted mt-0.5">
          Quyền hạn tối cao dành riêng cho Super Admin. Các thay đổi tại đây sẽ ảnh hưởng trực tiếp đến toàn bộ ứng dụng và học viên.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card 1: General & Maintenance */}
        <div className="nail-card rounded-2xl p-4 border nail-border space-y-3">
          <h4 className="font-bold text-sm nail-text-main flex items-center gap-2 pb-2 border-b nail-border">
            <Power className="w-4 h-4 text-rose-400" /> Trạng Thái Vận Hành & Khẩn Cấp
          </h4>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border nail-border">
            <div>
              <span className="font-bold text-xs nail-text-main block">Chế Độ Bảo Trì Hệ Thống</span>
              <span className="text-[11px] nail-text-muted">
                Khi kích hoạt, chỉ các tài khoản Quản trị viên mới có thể truy cập; học viên sẽ thấy thông báo bảo trì.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border nail-border">
            <div>
              <span className="font-bold text-xs nail-text-main block">Kích Hoạt Hội Thoại AI Mô Phỏng Khách Hàng</span>
              <span className="text-[11px] nail-text-muted">
                Sử dụng Gemini API để tương tác hội thoại âm thanh thời gian thực.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAiRoleplay}
                onChange={(e) => setSettings({ ...settings, enableAiRoleplay: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Card 2: Standards & Scores */}
        <div className="nail-card rounded-2xl p-4 border nail-border space-y-3">
          <h4 className="font-bold text-sm nail-text-main flex items-center gap-2 pb-2 border-b nail-border">
            <Sliders className="w-4 h-4 text-emerald-400" /> Tiêu Chuẩn Đánh Giá Phát Âm
          </h4>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold nail-text-main">Điểm sàn đạt bài học phát âm:</label>
              <span className="font-extrabold text-amber-300 text-sm">{settings.minPronunciationPassScore} / 100</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.minPronunciationPassScore}
              onChange={(e) => setSettings({ ...settings, minPronunciationPassScore: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <p className="text-[11px] nail-text-muted mt-1">
              Thợ nail cần đạt mức điểm này trong phần Luyện Phát Âm AI để được tính hoàn thành bài học.
            </p>
          </div>
        </div>

        {/* Card 3: Announcement Banner */}
        <div className="nail-card rounded-2xl p-4 border nail-border space-y-3">
          <h4 className="font-bold text-sm nail-text-main flex items-center gap-2 pb-2 border-b nail-border">
            <Bell className="w-4 h-4 text-sky-400" /> Thông Báo Toàn Hệ Thống (Broadcast Announcement)
          </h4>

          <div>
            <label className="block text-xs font-semibold nail-text-muted mb-1">
              Nội dung thông báo hiển thị cho toàn bộ thợ nail:
            </label>
            <textarea
              rows={2}
              value={settings.systemAnnouncement}
              onChange={(e) => setSettings({ ...settings, systemAnnouncement: e.target.value })}
              className="w-full nail-input py-2 px-3 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Card 4: Hotline & Support Info */}
        <div className="nail-card rounded-2xl p-4 border nail-border space-y-3">
          <h4 className="font-bold text-sm nail-text-main flex items-center gap-2 pb-2 border-b nail-border">
            <PhoneCall className="w-4 h-4 text-amber-400" /> Đường Dây Nóng Hỗ Trợ Tiệm Nail
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold nail-text-muted mb-1">Số điện thoại Hotline</label>
              <input
                type="text"
                value={settings.salonSupportHotline}
                onChange={(e) => setSettings({ ...settings, salonSupportHotline: e.target.value })}
                className="w-full nail-input py-2 px-3 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold nail-text-muted mb-1">Email tiếp nhận hỗ trợ</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full nail-input py-2 px-3 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="nail-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu Cấu Hình Hệ Thống</span>
          </button>
        </div>
      </form>
    </div>
  );
};
