/**
 * themeStore.ts
 * Central Zustand store for UI/UX customization:
 * Color palettes, dark/light/OLED modes, typography, card glassmorphism,
 * and high-performance binary storage (IndexedDB) for avatar & background images.
 */

import { create } from 'zustand';
import { hexToHsl } from '../shared/lib/colorContrast';
import {
  saveMediaAsset,
  getMediaAssetUrl,
  deleteMediaAsset,
} from '../shared/lib/mediaStorage';

export type ThemeMode = 'dark' | 'light' | 'oled';

export type FontFamily =
  | 'Plus Jakarta Sans'
  | 'Inter'
  | 'Be Vietnam Pro'
  | 'JetBrains Mono'
  | 'Roboto'
  | 'System';

export interface BgSettings {
  hasImage: boolean;
  blur: number; // 0 to 20 px
  overlayOpacity: number; // 0 to 90 %
  isFixed: boolean;
  objectFit: 'cover' | 'contain';
}

export interface ThemeConfig {
  userName: string; // User display name shown in header and sidebar
  mode: ThemeMode;
  accentColor: string; // Hex e.g. #10b981
  borderRadius: number; // 0, 8, 14, 20 px
  cardOpacity: number; // 50 to 100 %
  fontFamily: FontFamily;
  useCustomFinColors: boolean;
  customIncomeColor: string;
  customExpenseColor: string;
  bgSettings: BgSettings;
  hasAvatar: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  userName: '',
  mode: 'dark',
  accentColor: '#10b981',
  borderRadius: 14,
  cardOpacity: 85,
  fontFamily: 'Plus Jakarta Sans',
  useCustomFinColors: false,
  customIncomeColor: '#10b981',
  customExpenseColor: '#ef4444',
  bgSettings: {
    hasImage: false,
    blur: 8,
    overlayOpacity: 45,
    isFixed: true,
    objectFit: 'cover',
  },
  hasAvatar: false,
};

const STORAGE_KEY = 'finance_app_theme_config_v1';

export interface ThemeState {
  config: ThemeConfig;
  avatarUrl: string | null;
  bgImageUrl: string | null;
  isInitialized: boolean;

  // Actions
  initTheme: () => Promise<void>;
  setUserName: (name: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (hex: string) => void;
  setBorderRadius: (px: number) => void;
  setCardOpacity: (percent: number) => void;
  setFontFamily: (font: FontFamily) => void;
  setCustomFinColors: (useCustom: boolean, incomeHex?: string, expenseHex?: string) => void;
  setBgSettings: (settings: Partial<BgSettings>) => void;
  uploadAvatar: (blob: Blob) => Promise<void>;
  removeAvatar: () => Promise<void>;
  uploadBgImage: (blob: Blob) => Promise<void>;
  removeBgImage: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  applyToDOM: () => void;
}

function loadConfigFromStorage(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_THEME_CONFIG,
      ...parsed,
      bgSettings: {
        ...DEFAULT_THEME_CONFIG.bgSettings,
        ...(parsed.bgSettings || {}),
      },
    };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

function saveConfigToStorage(config: ThemeConfig) {
  try {
    // Only persist lightweight JSON metadata, NEVER raw base64 data
    const { ...persistData } = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistData));
  } catch (err) {
    console.error('Failed to save theme config to localStorage:', err);
  }
}

function getFontStack(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case 'Inter':
      return "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    case 'Be Vietnam Pro':
      return "'Be Vietnam Pro', system-ui, sans-serif";
    case 'JetBrains Mono':
      return "'JetBrains Mono', monospace";
    case 'Roboto':
      return "'Roboto', system-ui, sans-serif";
    case 'System':
      return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    default:
      return "'Plus Jakarta Sans', system-ui, sans-serif";
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  config: DEFAULT_THEME_CONFIG,
  avatarUrl: null,
  bgImageUrl: null,
  isInitialized: false,

  initTheme: async () => {
    const config = loadConfigFromStorage();

    let avatarUrl: string | null = null;
    let bgImageUrl: string | null = null;

    if (config.hasAvatar) {
      avatarUrl = await getMediaAssetUrl('user_avatar');
    }

    if (config.bgSettings.hasImage) {
      bgImageUrl = await getMediaAssetUrl('user_background');
    }

    set({ config, avatarUrl, bgImageUrl, isInitialized: true });
    get().applyToDOM();
  },

  setUserName: (name: string) => {
    set((state) => {
      const updated = { ...state.config, userName: name };
      saveConfigToStorage(updated);
      return { config: updated };
    });
  },

  setThemeMode: (mode: ThemeMode) => {
    set((state) => {
      const updated = { ...state.config, mode };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setAccentColor: (hex: string) => {
    set((state) => {
      const updated = { ...state.config, accentColor: hex };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setBorderRadius: (px: number) => {
    set((state) => {
      const updated = { ...state.config, borderRadius: px };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setCardOpacity: (percent: number) => {
    set((state) => {
      const updated = { ...state.config, cardOpacity: percent };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setFontFamily: (font: FontFamily) => {
    set((state) => {
      const updated = { ...state.config, fontFamily: font };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setCustomFinColors: (useCustom: boolean, incomeHex?: string, expenseHex?: string) => {
    set((state) => {
      const updated: ThemeConfig = {
        ...state.config,
        useCustomFinColors: useCustom,
        customIncomeColor: incomeHex ?? state.config.customIncomeColor,
        customExpenseColor: expenseHex ?? state.config.customExpenseColor,
      };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  setBgSettings: (partial: Partial<BgSettings>) => {
    set((state) => {
      const updated: ThemeConfig = {
        ...state.config,
        bgSettings: {
          ...state.config.bgSettings,
          ...partial,
        },
      };
      saveConfigToStorage(updated);
      return { config: updated };
    });
    get().applyToDOM();
  },

  uploadAvatar: async (blob: Blob) => {
    await saveMediaAsset('user_avatar', blob);
    const prevUrl = get().avatarUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    const newUrl = URL.createObjectURL(blob);
    set((state) => {
      const updated = { ...state.config, hasAvatar: true };
      saveConfigToStorage(updated);
      return { config: updated, avatarUrl: newUrl };
    });
  },

  removeAvatar: async () => {
    await deleteMediaAsset('user_avatar');
    const prevUrl = get().avatarUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set((state) => {
      const updated = { ...state.config, hasAvatar: false };
      saveConfigToStorage(updated);
      return { config: updated, avatarUrl: null };
    });
  },

  uploadBgImage: async (blob: Blob) => {
    await saveMediaAsset('user_background', blob);
    const prevUrl = get().bgImageUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    const newUrl = URL.createObjectURL(blob);
    set((state) => {
      const updated = {
        ...state.config,
        bgSettings: {
          ...state.config.bgSettings,
          hasImage: true,
        },
      };
      saveConfigToStorage(updated);
      return { config: updated, bgImageUrl: newUrl };
    });
    get().applyToDOM();
  },

  removeBgImage: async () => {
    await deleteMediaAsset('user_background');
    const prevUrl = get().bgImageUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set((state) => {
      const updated = {
        ...state.config,
        bgSettings: {
          ...state.config.bgSettings,
          hasImage: false,
        },
      };
      saveConfigToStorage(updated);
      return { config: updated, bgImageUrl: null };
    });
    get().applyToDOM();
  },

  resetToDefaults: async () => {
    const prevAvatar = get().avatarUrl;
    if (prevAvatar) URL.revokeObjectURL(prevAvatar);
    const prevBg = get().bgImageUrl;
    if (prevBg) URL.revokeObjectURL(prevBg);

    await deleteMediaAsset('user_avatar');
    await deleteMediaAsset('user_background');

    localStorage.removeItem(STORAGE_KEY);
    set({
      config: DEFAULT_THEME_CONFIG,
      avatarUrl: null,
      bgImageUrl: null,
    });
    get().applyToDOM();
  },

  applyToDOM: () => {
    if (typeof document === 'undefined') return;
    const { mode, accentColor, borderRadius, cardOpacity, fontFamily } = get().config;
    const root = document.documentElement;

    // 1. Theme Mode classes
    root.classList.remove('dark', 'light', 'oled');
    if (mode === 'light') {
      root.classList.add('light');
    } else if (mode === 'oled') {
      root.classList.add('dark', 'oled');
    } else {
      root.classList.add('dark');
    }

    // 2. Primary Accent Color
    const hsl = hexToHsl(accentColor);
    root.style.setProperty('--primary', hsl.formatted);
    root.style.setProperty('--ring', hsl.formatted);
    root.style.setProperty('--primary-hex', accentColor);

    // 3. Border radius
    root.style.setProperty('--radius', `${borderRadius}px`);

    // 4. Card glass opacity
    root.style.setProperty('--card-opacity', `${cardOpacity / 100}`);

    // 5. Font Family
    document.body.style.fontFamily = getFontStack(fontFamily);
  },
}));
