import React from 'react';
import { useThemeStore } from '../../../store/themeStore';
import {
  evaluateWcag,
  generateDerivativeShades,
} from '../../../shared/lib/colorContrast';
import { TrendingUp, ShieldCheck, AlertTriangle, Sparkles, Wallet } from 'lucide-react';

export const ThemePreviewCard: React.FC = () => {
  const { config, avatarUrl } = useThemeStore();
  const { accentColor, borderRadius, cardOpacity, mode, fontFamily } = config;

  // Background color estimation for current theme mode
  const estimatedBg = mode === 'light' ? '#f8fafc' : mode === 'oled' ? '#000000' : '#0a0d14';
  const estimatedCardBg = mode === 'light' ? '#ffffff' : mode === 'oled' ? '#0a0a0a' : '#0f141f';

  // Evaluate WCAG AA contrast for text on button and text on card
  const accentVsWhite = evaluateWcag('#ffffff', accentColor);
  const accentVsDark = evaluateWcag('#090d16', accentColor);
  const bestButtonText = accentVsWhite.ratio >= accentVsDark.ratio ? '#ffffff' : '#090d16';
  const buttonContrast = accentVsWhite.ratio >= accentVsDark.ratio ? accentVsWhite : accentVsDark;

  const _cardTextContrast = evaluateWcag(mode === 'light' ? '#0f172a' : '#f8fafc', estimatedCardBg);

  const derivative = generateDerivativeShades(accentColor);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Xem trước giao diện thực tế
        </h3>

        {/* WCAG AA Status Badge */}
        <div
          className={`fin-badge border ${
            buttonContrast.passesAA
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={`Tỉ lệ tương phản WCAG: ${buttonContrast.ratioFormatted}`}
        >
          {buttonContrast.passesAA ? (
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
          <span>
            Độ tương phản {buttonContrast.ratioFormatted} • {buttonContrast.scoreLabel}
          </span>
        </div>
      </div>

      {/* Mock Live Screen Container */}
      <div
        className="p-5 rounded-2xl border border-border/80 shadow-2xl relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: estimatedBg,
        }}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: accentColor }}
        />

        {/* Mock Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 shadow-sm"
              style={{ borderColor: accentColor }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: derivative.mutedBg, color: accentColor }}
                >
                  JD
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{config.userName || 'John Doe'}</div>
              <div className="text-[10px] text-muted-foreground">Tài khoản chính • {fontFamily}</div>
            </div>
          </div>

          <div
            className="text-[10px] px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: derivative.mutedBg,
              color: accentColor,
              borderColor: derivative.border,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            {mode.toUpperCase()} MODE
          </div>
        </div>

        {/* Mock Stat Card with Live Opacity & Radius */}
        <div
          className="p-4 relative transition-all duration-200 border shadow-lg mb-4"
          style={{
            backgroundColor: `rgba(${mode === 'light' ? '255,255,255' : '15,20,31'}, ${cardOpacity / 100})`,
            borderRadius: `${borderRadius}px`,
            borderColor: derivative.border,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Tổng tài sản ròng
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> +14.2%
            </span>
          </div>

          <div className="text-xl font-bold font-tabular tracking-tight text-foreground">
            186.450.000 <span className="text-xs font-normal text-muted-foreground">₫</span>
          </div>

          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">Độ mờ thẻ: {cardOpacity}%</span>
            <span className="text-muted-foreground text-[11px]">Bo góc: {borderRadius}px</span>
          </div>
        </div>

        {/* Mock Buttons with Accent Color */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="w-full py-2 px-3 text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            style={{
              backgroundColor: accentColor,
              color: bestButtonText,
              borderRadius: `${Math.max(6, borderRadius - 2)}px`,
            }}
          >
            + Thêm giao dịch
          </button>

          <button
            type="button"
            className="w-full py-2 px-3 text-xs font-semibold border transition-all flex items-center justify-center gap-1.5"
            style={{
              borderColor: derivative.border,
              color: accentColor,
              backgroundColor: derivative.mutedBg,
              borderRadius: `${Math.max(6, borderRadius - 2)}px`,
            }}
          >
            Xuất báo cáo
          </button>
        </div>

        {/* Contrast Warning Footnote if below WCAG AA */}
        {!buttonContrast.passesAA && (
          <div className="mt-3.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Màu điểm nhấn này có độ tương phản hơi thấp ({buttonContrast.ratioFormatted}). Bạn nên chọn màu đậm hơn một chút để chữ trên nút dễ đọc nhất.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
