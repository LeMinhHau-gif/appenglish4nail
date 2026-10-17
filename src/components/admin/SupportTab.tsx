import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { SupportTicket } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  Headphones,
  Search,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Building,
  User,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

export const SupportTab: React.FC = () => {
  const { hasPermission, currentUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    category: 'pronunciation_ai',
    priority: 'medium',
    salonLocation: '',
  });

  const fetchTickets = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await AdminService.getSupportTickets();
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (e: any) {
      setActionError(e.message || 'Không thể tải danh sách yêu cầu hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('support.view')) {
      fetchTickets();
    }
  }, [hasPermission]);

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await AdminService.updateSupportTicket(ticketId, { status });
      setSelectedTicket(updated);
      setActionSuccess(`Đã chuyển trạng thái yêu cầu sang: ${status}`);
      fetchTickets();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newNoteText.trim()) return;

    setActionError(null);
    try {
      const updated = await AdminService.updateSupportTicket(selectedTicket.id, {
        note: newNoteText.trim(),
      });
      setSelectedTicket(updated);
      setNewNoteText('');
      setActionSuccess('Đã thêm ghi chú xử lý thành công');
      fetchTickets();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi thêm ghi chú');
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await AdminService.createSupportTicket(createForm);
      setActionSuccess('Đã tạo phiếu yêu cầu hỗ trợ mới thành công');
      setShowCreateModal(false);
      setCreateForm({
        subject: '',
        category: 'pronunciation_ai',
        priority: 'medium',
        salonLocation: '',
      });
      fetchTickets();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi tạo yêu cầu hỗ trợ');
    }
  };

  if (!hasPermission('support.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Không có quyền truy cập Hỗ Trợ</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Vai trò của bạn không có quyền <code className="text-rose-300">support.view</code>. Hãy chuyển vai trò sang{' '}
          <strong className="text-sky-300">Support</strong>, <strong className="text-rose-300">Admin</strong>, hoặc{' '}
          <strong className="text-amber-300">Super Admin</strong>.
        </p>
      </div>
    );
  }

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.salonLocation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold nail-text-main flex items-center gap-2">
            <Headphones className="w-4 h-4 text-sky-400" /> Bàn Hỗ Trợ Học Viên Tiệm Nail
          </h3>
          <p className="text-xs nail-text-muted mt-0.5">
            Xử lý thắc mắc phát âm, âm thanh microphone, và tư vấn lộ trình học cho thợ nail
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="nail-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tiếp Nhận Yêu Cầu
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200">
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
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="nail-card rounded-2xl p-3 border nail-border flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 nail-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, học viên, khu vực tiệm nail..."
            className="w-full nail-input pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái yêu cầu"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Đang mở (Open)</option>
            <option value="in_progress">Đang xử lý (In Progress)</option>
            <option value="resolved">Đã giải quyết (Resolved)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Lọc theo độ ưu tiên"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Mọi mức độ</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          <button
            onClick={fetchTickets}
            title="Làm mới"
            className="p-1.5 rounded-xl nail-bg-subtle hover:bg-white/10 nail-border border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Master Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tickets List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredTickets.map((t) => {
            const isSelected = selectedTicket?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`nail-card rounded-2xl p-3.5 border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                    : 'nail-border hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-xs nail-text-main line-clamp-1">{t.subject}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      t.status === 'open'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : t.status === 'in_progress'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {t.status === 'open' ? 'Chờ xử lý' : t.status === 'in_progress' ? 'Đang giải quyết' : 'Đã xong'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] nail-text-muted mt-2">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3 h-3 text-rose-300" /> {t.userName}
                  </span>
                  <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Ticket Details & Internal Discussion */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="nail-card rounded-2xl p-4 border nail-border space-y-4">
              <div className="border-b nail-border pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded text-amber-300">
                    #{selectedTicket.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasPermission('support.manage') && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                            selectedTicket.status === 'open' ? 'nail-btn-primary font-bold' : 'nail-bg-subtle'
                          }`}
                        >
                          Mở
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                            selectedTicket.status === 'in_progress' ? 'nail-btn-primary font-bold' : 'nail-bg-subtle'
                          }`}
                        >
                          Đang xử lý
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                            selectedTicket.status === 'resolved' ? 'nail-btn-primary font-bold' : 'nail-bg-subtle'
                          }`}
                        >
                          Đã giải quyết
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm nail-text-main mt-2">{selectedTicket.subject}</h4>

                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-white/5 text-xs">
                  <div>
                    <span className="text-[10px] nail-text-muted block">Học viên:</span>
                    <span className="font-semibold nail-text-main">{selectedTicket.userName}</span>
                    <span className="text-[11px] nail-text-muted block">{selectedTicket.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-[10px] nail-text-muted block">Tiệm nail & Khu vực:</span>
                    <span className="font-semibold nail-text-main">{selectedTicket.salonLocation}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes Thread */}
              <div>
                <h5 className="font-bold text-xs nail-text-main mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Ghi Chú & Tiến Trình Xử Lý Nội Bộ
                </h5>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedTicket.internalNotes.length === 0 ? (
                    <p className="text-xs nail-text-muted italic py-3 text-center">Chưa có ghi chú xử lý nào.</p>
                  ) : (
                    selectedTicket.internalNotes.map((note) => (
                      <div key={note.id} className="p-2.5 rounded-xl nail-bg-subtle border nail-border text-xs">
                        <div className="flex items-center justify-between text-[10px] nail-text-muted mb-1">
                          <span className="font-bold text-amber-300">{note.authorName}</span>
                          <span>{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="nail-text-main whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {hasPermission('support.manage') && (
                  <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm ghi chú hỗ trợ nội bộ hoặc kết quả tư vấn..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 nail-input py-2 px-3 text-xs rounded-xl"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="nail-btn-primary px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="nail-card rounded-2xl p-12 text-center border nail-border h-full flex flex-col items-center justify-center">
              <Headphones className="w-8 h-8 text-sky-400/60 mb-2" />
              <p className="text-xs nail-text-muted">Chọn một yêu cầu bên trái để xem chi tiết và xử lý</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="nail-card rounded-3xl p-6 border nail-border w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b nail-border mb-4">
              <h4 className="font-bold text-base nail-text-main flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" /> Tiếp Nhận Yêu Cầu Hỗ Trợ
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="nail-text-muted hover:nail-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold nail-text-muted mb-1">Vấn đề cần hỗ trợ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cần bổ sung thêm ví dụ nói chuyện tip và hóa đơn"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Phân loại</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                >
                  <option value="pronunciation_ai">Luyện phát âm AI & Giọng nói</option>
                  <option value="audio_issue">Âm thanh & Microphone tiệm nail</option>
                  <option value="lesson_content">Nội dung câu thoại & Từ vựng</option>
                  <option value="account">Tài khoản & Đăng nhập</option>
                  <option value="payment_tips">Giao tiếp tiền tip & bill</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Mức độ ưu tiên</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Thành phố / Tiệm</label>
                  <input
                    type="text"
                    placeholder="Houston, TX"
                    value={createForm.salonLocation}
                    onChange={(e) => setCreateForm({ ...createForm, salonLocation: e.target.value })}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t nail-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl nail-bg-subtle nail-text-muted hover:nail-text-main"
                >
                  Hủy
                </button>
                <button type="submit" className="nail-btn-primary px-5 py-2 rounded-xl font-bold">
                  Tạo Phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
