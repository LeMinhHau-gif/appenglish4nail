import React from 'react';
import { X, Palette, Sun, Moon, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemePaletteId } from '../services/themeService';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { palette, mode, theme, palettes, setPalette, setMode, toggleMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl nail-card p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 nail-gradient-accent"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b nail-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl nail-gradient-accent flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black nail-text-main flex items-center gap-1.5">
                <span>Bảng Màu Tiệm Nail</span>
                <span className="text-xs px-2 py-0.5 rounded-full nail-badge-primary font-bold">
                  5 Tone Màu
                </span>
              </h2>
              <p className="text-xs nail-text-muted">
                Thiết kế màu sắc cao cấp chuẩn các tiệm nail tại Hoa Kỳ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full nail-bg-subtle flex items-center justify-center nail-text-muted hover:nail-text-main transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Light / Dark Mode Toggle Card */}
          <div className="p-3.5 rounded-2xl nail-bg-subtle border nail-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center nail-bg-card border nail-border shadow-xs">
                {mode === 'dark' ? (
                  <Moon className="w-5 h-5 text-amber-300" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-xs font-black nail-text-main">
                  {mode === 'dark' ? 'Chế độ Tối (Velvet Noir)' : 'Chế độ Sáng (Salon Porcelain)'}
                </p>
                <p className="text-[11px] nail-text-muted">
                  {mode === 'dark'
                    ? 'Dịu mắt, ấm cúng khi học bài sau giờ làm việc tiệm'
                    : 'Sáng rõ, dễ nhìn dưới ánh đèn LED & tia UV của bàn nail'}
                </p>
              </div>
            </div>

            <div className="flex items-center p-1 rounded-xl nail-bg-card border nail-border">
              <button
                onClick={() => setMode('light')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'light'
                    ? 'nail-gradient-accent text-white shadow-xs'
                    : 'nail-text-muted hover:nail-text-main'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Sáng</span>
              </button>
              <button
                onClick={() => setMode('dark')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'dark'
                    ? 'nail-gradient-accent text-white shadow-xs'
                    : 'nail-text-muted hover:nail-text-main'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Tối</span>
              </button>
            </div>
          </div>

          {/* Palette List */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider nail-text-subtle flex items-center justify-between">
              <span>Chọn Bảng Màu Thương Hiệu Nail</span>
              <span className="text-[11px] font-medium nail-text-primary">
                Đang dùng: {theme.nameVi}
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {palettes.map((item) => {
                const isSelected = palette === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setPalette(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between ${
                      isSelected
                        ? 'border-2 shadow-md'
                        : 'nail-bg-subtle nail-border hover:nail-bg-card-hover'
                    }`}
                    style={{
                      borderColor: isSelected ? item.swatchPrimary : undefined,
                      backgroundColor: isSelected ? 'var(--theme-bg-card)' : undefined,
                    }}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Color Preview Swatch Pill */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white/80 shadow-sm"
                          style={{ backgroundColor: item.swatchPrimary }}
                          title="Màu chính"
                        />
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white/80 shadow-sm"
                          style={{ backgroundColor: item.swatchSecondary }}
                          title="Ánh nhũ / Điểm nhấn"
                        />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs sm:text-sm font-extrabold nail-text-main">
                            {item.nameVi}
                          </h4>
                          {item.id === 'rose_gold' && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md nail-badge-gold">
                              Best Seller
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] nail-text-muted mt-0.5 leading-snug line-clamp-1">
                          {item.descriptionVi}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {isSelected ? (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: item.swatchPrimary }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 nail-border" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t nail-border flex items-center justify-between">
          <span className="text-[11px] nail-text-subtle flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 nail-text-secondary" />
            Tự động lưu bảng màu cho lần học sau
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl nail-btn-primary font-bold text-xs cursor-pointer shadow-md"
          >
            Đồng Ý & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
};
