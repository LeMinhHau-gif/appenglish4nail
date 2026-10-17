import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import { CourseItem } from '../../types/rbac';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { TopicCategory } from '../../types';

export const ContentTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishFilter, setPublishFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseItem | null>(null);

  const [formState, setFormState] = useState({
    title: '',
    tagline: '',
    category: 'customer_care' as TopicCategory,
    categoryNameVi: 'Chăm Sóc Khách',
    difficulty: 'Cơ bản' as 'Cơ bản' | 'Trung cấp' | 'Nâng cao',
    estimatedMinutes: 8,
    summary: '',
    culturalNote: '',
    isPublished: true,
  });

  const fetchCourses = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await AdminService.getCourses();
      setCourses(data);
    } catch (e: any) {
      setActionError(e.message || 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('courses.view')) {
      fetchCourses();
    }
  }, [hasPermission]);

  const handleTogglePublish = async (course: CourseItem) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await AdminService.togglePublishCourse(course.id);
      setActionSuccess(
        `Đã ${updated.isPublished ? 'xuất bản' : 'chuyển sang bản nháp'} bài học: "${course.title}"`
      );
      fetchCourses();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi thay đổi trạng thái bài học');
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học: "${course.title}"?`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await AdminService.deleteCourse(course.id);
      setActionSuccess(`Đã xóa bài học: "${course.title}"`);
      fetchCourses();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi xóa bài học');
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      if (editCourse) {
        await AdminService.updateCourse(editCourse.id, formState);
        setActionSuccess(`Đã cập nhật bài học "${formState.title}" thành công`);
        setEditCourse(null);
      } else {
        await AdminService.createCourse({
          ...formState,
          iconName: 'Sparkles',
          badge: 'Mới',
          dialogue: [
            {
              id: 'd-new-1',
              speaker: 'client',
              english: 'Excuse me, could you check this for me?',
              vietnamese: 'Xin lỗi, em xem lại chỗ này giúp chị được không?',
            },
            {
              id: 'd-new-2',
              speaker: 'tech',
              english: 'Of course! Let me take a look and fix that right away.',
              vietnamese: 'Dạ được chứ chị! Để em xem và sửa lại cho chị ngay.',
            },
          ],
          keyPhrases: [
            {
              id: 'p-new-1',
              english: 'Let me fix that right away',
              vietnamese: 'Để em sửa lại ngay cho chị',
              context: 'Xoa dịu khách',
            },
          ],
          vocabulary: [
            {
              id: 'v-new-1',
              word: 'Cuticle',
              phonetic: '/ˈkjuː.tɪ.kəl/',
              meaning: 'Viền da móng',
              exampleEn: 'Be gentle with my cuticles.',
              exampleVi: 'Làm nhẹ tay với khóe da của chị nhé.',
            },
          ],
          practicalTips: ['Luôn giữ giọng điệu hòa nhã và mỉm cười với khách.'],
          quiz: [
            {
              id: 'q-new-1',
              question: 'Nên nói câu gì khi khách góp ý móng chưa đều?',
              situation: 'Khách muốn sửa lại',
              options: [
                'No problem, that is your nail shape.',
                'Thank you for telling me, let me fix it right away.',
                'You should come back tomorrow.',
              ],
              correctIndex: 1,
              explanation: 'Luôn cảm ơn lời góp ý và cam kết sửa ngay.',
            },
          ],
        });
        setActionSuccess(`Đã tạo bài học mới "${formState.title}" thành công`);
        setShowAddModal(false);
      }
      fetchCourses();
    } catch (e: any) {
      setActionError(e.message || 'Lỗi khi lưu bài học');
    }
  };

  const openEditModal = (c: CourseItem) => {
    setEditCourse(c);
    setFormState({
      title: c.title,
      tagline: c.tagline,
      category: c.category,
      categoryNameVi: c.categoryNameVi,
      difficulty: c.difficulty,
      estimatedMinutes: c.estimatedMinutes,
      summary: c.summary,
      culturalNote: c.culturalNote,
      isPublished: c.isPublished,
    });
  };

  if (!hasPermission('courses.view')) {
    return (
      <div className="nail-card rounded-2xl p-8 text-center border nail-border">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold nail-text-main">Không có quyền Quản lý Khóa học</h3>
        <p className="text-sm nail-text-muted max-w-md mx-auto mt-1">
          Vai trò của bạn không có quyền <code className="text-rose-300">courses.view</code>. Hãy chuyển vai trò sang{' '}
          <strong className="text-emerald-300">Content Manager</strong>, <strong className="text-rose-300">Admin</strong>, hoặc{' '}
          <strong className="text-amber-300">Super Admin</strong>.
        </p>
      </div>
    );
  }

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.summary.toLowerCase().includes(search.toLowerCase()) ||
      c.categoryNameVi.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchPublish =
      publishFilter === 'all' ||
      (publishFilter === 'published' && c.isPublished) ||
      (publishFilter === 'draft' && !c.isPublished);
    return matchSearch && matchCategory && matchPublish;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold nail-text-main flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Quản Lý Nội Dung Giáo Trình & Bài Học
          </h3>
          <p className="text-xs nail-text-muted mt-0.5">
            Tổng cộng: <strong className="nail-text-main">{courses.length}</strong> bài học •{' '}
            <strong className="text-emerald-300">{courses.filter((c) => c.isPublished).length}</strong> đã xuất bản •{' '}
            <strong className="text-amber-300">{courses.filter((c) => !c.isPublished).length}</strong> bản nháp
          </p>
        </div>

        {hasPermission('courses.create') && (
          <button
            onClick={() => {
              setEditCourse(null);
              setFormState({
                title: '',
                tagline: '',
                category: 'complaints',
                categoryNameVi: 'Xử Lý Phàn Nàn',
                difficulty: 'Cơ bản',
                estimatedMinutes: 8,
                summary: '',
                culturalNote: '',
                isPublished: true,
              });
              setShowAddModal(true);
            }}
            className="nail-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Soạn Bài Học Mới
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
            placeholder="Tìm theo tiêu đề, nội dung tóm tắt hoặc chủ đề..."
            className="w-full nail-input pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Lọc theo chủ đề"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Tất cả chủ đề</option>
            <option value="complaints">Xử lý phàn nàn</option>
            <option value="upselling">Upsell & Tăng thu nhập</option>
            <option value="safety_health">An toàn & Sức khỏe</option>
            <option value="consultation">Tư vấn dáng móng</option>
            <option value="customer_care">Chăm sóc khách</option>
            <option value="payment_tips">Thanh toán & Tip</option>
            <option value="salon_skills">Dụng cụ & Kỹ thuật</option>
            <option value="small_talk">Small Talk</option>
          </select>

          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value)}
            aria-label="Lọc theo trạng thái xuất bản"
            className="nail-input py-1.5 px-2.5 text-xs rounded-xl flex-1 sm:flex-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>

          <button
            onClick={fetchCourses}
            title="Làm mới"
            className="p-1.5 rounded-xl nail-bg-subtle hover:bg-white/10 nail-border border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredCourses.map((c) => (
          <div
            key={c.id}
            className={`nail-card rounded-2xl p-4 border transition-all flex flex-col justify-between ${
              c.isPublished ? 'nail-border' : 'border-amber-500/40 bg-amber-500/5'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="nail-badge-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.categoryNameVi}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.isPublished
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {c.isPublished ? '✓ Đã xuất bản' : '✍ Bản nháp'}
                  </span>
                  <span className="text-[10px] nail-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" /> {c.estimatedMinutes}p
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {hasPermission('courses.publish') && (
                    <button
                      onClick={() => handleTogglePublish(c)}
                      title={c.isPublished ? 'Chuyển về bản nháp' : 'Xuất bản bài học'}
                      className="p-1 rounded-lg nail-bg-subtle hover:bg-white/10 border nail-border text-xs"
                    >
                      {c.isPublished ? <EyeOff className="w-3.5 h-3.5 text-amber-300" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  )}

                  {hasPermission('courses.update') && (
                    <button
                      onClick={() => openEditModal(c)}
                      title="Chỉnh sửa bài học"
                      className="p-1 rounded-lg nail-bg-subtle hover:bg-white/10 border nail-border text-xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-sky-300" />
                    </button>
                  )}

                  {hasPermission('courses.delete') && (
                    <button
                      onClick={() => handleDeleteCourse(c)}
                      title="Xóa bài học"
                      className="p-1 rounded-lg nail-bg-subtle hover:bg-white/10 border border-rose-500/30 text-rose-300 hover:text-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-sm nail-text-main line-clamp-1">{c.title}</h4>
              <p className="text-xs nail-text-muted mt-1 line-clamp-2">{c.summary}</p>
            </div>

            <div className="pt-3 mt-3 border-t nail-border flex items-center justify-between text-[11px] nail-text-muted">
              <span>{c.dialogue?.length || 0} câu thoại • {c.vocabulary?.length || 0} từ vựng</span>
              <span>Cập nhật: {new Date(c.updatedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / CREATE MODAL */}
      {(showAddModal || editCourse) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="nail-card rounded-3xl p-6 border nail-border w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b nail-border mb-4">
              <h4 className="font-bold text-base nail-text-main flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {editCourse ? 'Chỉnh Sửa Bài Học' : 'Soạn Bài Học Mới'}
              </h4>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditCourse(null);
                }}
                className="nail-text-muted hover:nail-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold nail-text-muted mb-1">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tư Vấn Dáng Móng Almond & Coffin Hợp Với Bàn Tay"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Câu dẫn dắt (Tagline)</label>
                <input
                  type="text"
                  placeholder="Mẹo tư vấn khách chọn dáng móng sành điệu và bền"
                  value={formState.tagline}
                  onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Chuyên mục *</label>
                  <select
                    value={formState.category}
                    onChange={(e) => {
                      const cat = e.target.value as TopicCategory;
                      const catMap: Record<TopicCategory, string> = {
                        complaints: 'Xử Lý Phàn Nàn',
                        upselling: 'Upsell & Tăng Thu Nhập',
                        safety_health: 'An Toàn & Sức Khỏe',
                        consultation: 'Tư Vấn Dáng Móng',
                        customer_care: 'Chăm Sóc Khách',
                        payment_tips: 'Thanh Toán & Tip',
                        salon_skills: 'Kỹ Thuật Tiệm',
                        small_talk: 'Giao Tiếp Small Talk',
                      };
                      setFormState({
                        ...formState,
                        category: cat,
                        categoryNameVi: catMap[cat] || 'Giao Tiếp',
                      });
                    }}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  >
                    <option value="complaints">Xử lý phàn nàn</option>
                    <option value="upselling">Upsell</option>
                    <option value="consultation">Tư vấn dáng móng</option>
                    <option value="customer_care">Chăm sóc khách</option>
                    <option value="payment_tips">Thanh toán & Tip</option>
                    <option value="salon_skills">Kỹ thuật tiệm</option>
                    <option value="small_talk">Small talk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold nail-text-muted mb-1">Thời lượng ước tính</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={formState.estimatedMinutes}
                    onChange={(e) => setFormState({ ...formState, estimatedMinutes: Number(e.target.value) })}
                    className="w-full nail-input py-2 px-3 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Tóm tắt nội dung bài học</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn gọn mục tiêu giúp thợ nail giao tiếp tự tin..."
                  value={formState.summary}
                  onChange={(e) => setFormState({ ...formState, summary: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold nail-text-muted mb-1">Ghi chú văn hóa Mỹ tiệm nail</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Khách Mỹ chuộng dáng móng Almond vì tôn ngón tay thon thả..."
                  value={formState.culturalNote}
                  onChange={(e) => setFormState({ ...formState, culturalNote: e.target.value })}
                  className="w-full nail-input py-2 px-3 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishCheckbox"
                  checked={formState.isPublished}
                  onChange={(e) => setFormState({ ...formState, isPublished: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="publishCheckbox" className="font-semibold nail-text-main cursor-pointer">
                  Xuất bản bài học ngay (Học viên có thể học ngay lập tức)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t nail-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditCourse(null);
                  }}
                  className="px-4 py-2 rounded-xl nail-bg-subtle nail-text-muted hover:nail-text-main"
                >
                  Hủy
                </button>
                <button type="submit" className="nail-btn-primary px-5 py-2 rounded-xl font-bold">
                  {editCourse ? 'Lưu Thay Đổi' : 'Tạo Bài Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
