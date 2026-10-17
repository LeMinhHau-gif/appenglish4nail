export type ThemePaletteId =
  | 'rose_gold'      // Vàng Hồng & Nude (Mặc định - Chuẩn Nail Salon Mỹ)
  | 'blush_pink'     // Hồng Phấn & Đào Ngọt Ngào
  | 'latte_champagne'// Cà Phê Sữa & Champagne
  | 'velvet_noir'    // Nhung Đen & Nhũ Vàng Hoàng Gia
  | 'sage_spa';      // Ngọc Bích & Thảo Dược Spa

export type ThemeMode = 'light' | 'dark';

export interface ThemeOption {
  id: ThemePaletteId;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  swatchPrimary: string;
  swatchSecondary: string;
  swatchBg: string;
  previewGradient: string;
  accentText: string;
}

export const THEME_PALETTES: ThemeOption[] = [
  {
    id: 'rose_gold',
    nameVi: 'Vàng Hồng & Nude Salon',
    nameEn: 'Rose Gold & Nude',
    descriptionVi: 'Tông màu chuẩn các tiệm nail cao cấp tại Mỹ: Sang trọng, ấm áp, quý phái',
    swatchPrimary: '#d87262',
    swatchSecondary: '#e2b468',
    swatchBg: '#221c1e',
    previewGradient: 'from-[#d87262] via-[#d4687b] to-[#c94f6f]',
    accentText: 'text-[#e08272]',
  },
  {
    id: 'blush_pink',
    nameVi: 'Hồng Phấn & Đào Pastel',
    nameEn: 'Blush Pink & Peach',
    descriptionVi: 'Ngọt ngào, nữ tính, dịu mắt và tạo cảm giác tươi mới như sơn pastel OPI',
    swatchPrimary: '#e26d8c',
    swatchSecondary: '#f7a072',
    swatchBg: '#231a20',
    previewGradient: 'from-[#e26d8c] via-[#eb819c] to-[#f7a072]',
    accentText: 'text-[#ee829e]',
  },
  {
    id: 'latte_champagne',
    nameVi: 'Cà Phê Sữa & Champagne',
    nameEn: 'Warm Latte & Champagne',
    descriptionVi: 'Tone be latte tối giản, thanh lịch phong cách Scandinavian & Boutique Spa',
    swatchPrimary: '#c78862',
    swatchSecondary: '#daa520',
    swatchBg: '#201b17',
    previewGradient: 'from-[#c78862] via-[#b5734c] to-[#daa520]',
    accentText: 'text-[#d89772]',
  },
  {
    id: 'velvet_noir',
    nameVi: 'Nhung Đen & Nhũ Vàng',
    nameEn: 'Velvet Noir & Royal Gold',
    descriptionVi: 'Huyền bí, quyền lực với ánh nhũ vàng kim sắc sảo như tiệm VIP Las Vegas',
    swatchPrimary: '#e6c265',
    swatchSecondary: '#c84b5c',
    swatchBg: '#161418',
    previewGradient: 'from-[#e6c265] via-[#d4af37] to-[#b23a48]',
    accentText: 'text-[#f0cb6e]',
  },
  {
    id: 'sage_spa',
    nameVi: 'Ngọc Bích & Thảo Mộc',
    nameEn: 'Sage Spa & Eucalyptus',
    descriptionVi: 'Tươi mát, thư thái như phòng trị liệu Pedicure & Organic Herbal Spa',
    swatchPrimary: '#48a87d',
    swatchSecondary: '#d4a373',
    swatchBg: '#151d18',
    previewGradient: 'from-[#48a87d] via-[#388863] to-[#d4a373]',
    accentText: 'text-[#5ec094]',
  },
];

const STORAGE_KEY_PALETTE = 'nailspeak_theme_palette';
const STORAGE_KEY_MODE = 'nailspeak_theme_mode';

export class ThemeService {
  private static listeners: Array<(palette: ThemePaletteId, mode: ThemeMode) => void> = [];

  public static getPalette(): ThemePaletteId {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PALETTE) as ThemePaletteId;
      if (saved && THEME_PALETTES.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {}
    return 'rose_gold';
  }

  public static getMode(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark'; // Dark luxury default or light
  }

  public static setPalette(palette: ThemePaletteId): void {
    try {
      localStorage.setItem(STORAGE_KEY_PALETTE, palette);
    } catch {}
    this.applyToDOM(palette, this.getMode());
    this.notify();
  }

  public static setMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {}
    this.applyToDOM(this.getPalette(), mode);
    this.notify();
  }

  public static toggleMode(): ThemeMode {
    const next = this.getMode() === 'dark' ? 'light' : 'dark';
    this.setMode(next);
    return next;
  }

  public static applyToDOM(palette: ThemePaletteId, mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', palette);
    root.setAttribute('data-mode', mode);

    // Also toggle Tailwind 'dark' class if needed
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  public static subscribe(fn: (palette: ThemePaletteId, mode: ThemeMode) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private static notify(): void {
    const palette = this.getPalette();
    const mode = this.getMode();
    this.listeners.forEach((fn) => fn(palette, mode));
  }
}
