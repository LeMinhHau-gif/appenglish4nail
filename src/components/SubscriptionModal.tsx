import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/adminService';
import { FirestoreSyncService } from '../services/firestoreSync';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../types/rbac';
import {
  X,
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  HelpCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  onSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onSuccess,
}) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('6_months');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: '3_months' as SubscriptionPlanId,
      name: 'Gói 3 Tháng',
      price: '$14',
      priceNum: 14,
      period: '3 tháng học tập',
      monthly: 'Chỉ $4.6/tháng',
      popular: false,
      tag: 'Khởi động',
      features: [
        'Mở khóa 100% 15+ bài học tình huống',
        'Luyện phát âm AI & chấm điểm chuẩn',
        'Mẫu câu xử lý phàn nàn & xin tip',
      ],
    },
    {
      id: '6_months' as SubscriptionPlanId,
      name: 'Gói 6 Tháng',
      price: '$25',
      priceNum: 25,
      period: '6 tháng rèn luyện',
      monthly: 'Chỉ $4.1/tháng',
      popular: true,
      tag: 'Phổ biến nhất 🔥',
      features: [
        'Toàn bộ đặc quyền của gói 3 tháng',
        'Bộ kịch bản từ chối dao cạo gót an toàn',
        'Kỹ thuật trò chuyện tâm lý tạo thân thiết',
        'Đồng bộ tiến độ học vĩnh viễn trên đám mây',
      ],
    },
    {
      id: '1_year' as SubscriptionPlanId,
      name: 'Gói 1 Năm',
      price: '$40',
      priceNum: 40,
      period: '12 tháng gắn bó',
      monthly: 'Chỉ $3.3/tháng',
      popular: false,
      tag: 'Tiết kiệm nhất 💎',
      features: [
        'Trọn vẹn 1 năm cập nhật bài học mới',
        'Chuyên đề kỹ năng Upsell dịch vụ cao cấp',
        'Huy hiệu VIP Pro trên bảng xếp hạng salon',
        'Hỗ trợ giải đáp tình huống tiếng Anh tiệm nail',
      ],
    },
    {
      id: 'lifetime' as SubscriptionPlanId,
      name: 'Gói Vĩnh Viễn',
      price: '$99',
      priceNum: 99,
      period: 'Trọn đời không gia hạn',
      monthly: 'Thanh toán 1 lần duy nhất',
      popular: false,
      tag: 'Sở hữu trọn đời 👑',
      features: [
        'Truy cập vĩnh viễn trọn đời (Lifetime)',
        'Mọi khóa học, bản ghi & cập nhật tương lai',
        'Đặc quyền học viên VIP Danh Dự cao cấp nhất',
        'Kèm tài liệu hội thoại PDF in sẵn dán bàn làm',
      ],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await AdminService.registerSubscription(selectedPlan, note.trim());
      if (res.user) {
        updateCurrentUser(res.user);
      }
      try {
        const planObj = plans.find((p) => p.id === selectedPlan);
        await FirestoreSyncService.registerSubscription(
          currentUser,
          selectedPlan,
          planObj?.priceNum || 25,
          planObj?.name || 'Gói 6 Tháng',
          note.trim()
        );
      } catch (fErr) {
        console.warn('Firestore subscription sync warning:', fErr);
      }
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi gửi đăng ký gói');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl nail-card border nail-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b nail-border flex items-center justify-between nail-bg-subtle shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base nail-text-main flex items-center gap-1.5">
                <span>Nâng Cấp Gói Học VIP NailSpeak Pro</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                  Mở Khóa Toàn Bộ
                </span>
              </h3>
              <p className="text-[11px] nail-text-muted">
                Tiếng Anh Bản Địa cho thợ Nail • Tự tin giao tiếp, tăng tip & giữ khách Mỹ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {submitted ? (
            <div className="p-6 text-center space-y-4 nail-card rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-emerald-300">
                  Đã Gửi Đăng Ký Gói Thành Công!
                </h4>
                <p className="text-xs text-white/90 max-w-md mx-auto leading-relaxed font-medium">
                  Hệ thống quản trị đã nhận được thông báo về gói của bạn{' '}
                  <strong className="text-amber-300">
                    ({plans.find((p) => p.id === selectedPlan)?.name} -{' '}
                    {plans.find((p) => p.id === selectedPlan)?.price})
                  </strong>
                  . Ban quản trị (Admin) sẽ vào duyệt và kích hoạt mở khóa toàn bộ bài học cho bạn trong thời gian sớm nhất!
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl nail-btn-primary font-black text-xs cursor-pointer shadow-md"
                >
                  Đã hiểu & Tiếp tục học
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Notice for Guest vs Logged in user */}
              {!currentUser ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Bạn cần đăng nhập tài khoản trước để lưu tiến trình và đăng ký gói.</span>
                  </div>
                  {onOpenAuth && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="py-1 px-3 rounded-lg bg-amber-400 text-slate-900 font-extrabold text-xs whitespace-nowrap cursor-pointer hover:bg-amber-300"
                    >
                      Đăng nhập ngay
                    </button>
                  )}
                </div>
              ) : currentUser.subscriptionStatus === 'pending' ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0 animate-spin" />
                  <span>
                    Bạn đã có yêu cầu đăng ký đang chờ Admin duyệt. Bạn có thể gửi lại hoặc thay đổi gói bên dưới nếu muốn!
                  </span>
                </div>
              ) : null}

              {/* 4 Pricing Package Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/30 shadow-lg'
                          : 'nail-border nail-bg-subtle hover:bg-white/5'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                          {p.tag}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-sm nail-text-main flex items-center gap-1.5">
                            {p.name}
                          </h4>
                          {!p.popular && p.tag && (
                            <span className="text-[10px] font-bold text-amber-300 nail-bg-card px-2 py-0.5 rounded-md border nail-border">
                              {p.tag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1.5 my-2">
                          <span className="text-2xl font-black text-amber-300">{p.price}</span>
                          <span className="text-xs nail-text-muted">/ {p.period}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-rose-300 mb-3">
                          {p.monthly}
                        </div>

                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 mt-3 border-t nail-border-subtle flex items-center justify-between text-xs">
                        <span className={`font-bold ${isSelected ? 'text-amber-300' : 'nail-text-muted'}`}>
                          {isSelected ? '✓ Đã chọn gói này' : 'Bấm để chọn'}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400 text-slate-900'
                              : 'border-white/30'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Notes Form & Submit */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold nail-text-secondary uppercase tracking-wider mb-1">
                    Ghi chú đăng ký & thông tin chuyển khoản (Zelle / Venmo / CashApp / Chuyển khoản)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Đã gửi qua Zelle số đuôi 5678 (tên Lisa Hoang), hoặc ghi chú cho Admin..."
                    className="w-full px-3.5 py-2.5 rounded-xl nail-bg-subtle border nail-border text-xs nail-text-main focus:outline-hidden focus:border-theme-primary placeholder:nail-text-muted"
                  />
                  <p className="text-[10px] nail-text-muted mt-1">
                    * Sau khi gửi, hệ thống quản trị sẽ nhận thông báo để Admin kiểm tra và duyệt mở khóa ngay.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 px-4 rounded-xl nail-btn-primary font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    <span>
                      {currentUser
                        ? `Xác Nhận Đăng Ký ${plans.find((p) => p.id === selectedPlan)?.name} (${plans.find((p) => p.id === selectedPlan)?.price})`
                        : 'Đăng Nhập Để Tiếp Tục Đăng Ký'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3.5 px-4 rounded-xl nail-bg-subtle hover:bg-white/10 text-white/80 border nail-border text-xs font-bold cursor-pointer"
                  >
                    Để sau
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
