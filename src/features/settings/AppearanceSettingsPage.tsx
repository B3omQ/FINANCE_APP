import React, { useState, useRef } from 'react';
import { useThemeStore, ThemeMode, FontFamily } from '../../store/themeStore';
import { ACCENT_PRESETS } from '../../shared/lib/colorContrast';
import { validateImageFile, resizeBackgroundImage } from '../../shared/lib/imageProcessing';
import { AvatarCropModal } from './components/AvatarCropModal';
import { ThemePreviewCard } from './components/ThemePreviewCard';
import { Button } from '../../shared/ui/Button';
import {
  Sun,
  Moon,
  Tv,
  Palette,
  Type,
  User,
  Sliders,
  RotateCcw,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

export const AppearanceSettingsPage: React.FC = () => {
  const {
    config,
    avatarUrl,
    bgImageUrl,
    setUserName,
    setThemeMode,
    setAccentColor,
    setBorderRadius,
    setCardOpacity,
    setFontFamily,
    setBgSettings,
    setCustomFinColors,
    uploadAvatar,
    removeAvatar,
    uploadBgImage,
    removeBgImage,
    resetToDefaults,
  } = useThemeStore();

  const [userNameInput, setUserNameInput] = useState(config.userName || '');
  const [userNameSaved, setUserNameSaved] = useState(false);
  const [selectedCropSrc, setSelectedCropSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setUserNameInput(config.userName || '');
  }, [config.userName]);

  const handleSaveUserName = () => {
    const trimmed = userNameInput.trim();
    if (!trimmed) {
      setErrorMessage('Tên người dùng không được để trống');
      return;
    }
    setUserName(trimmed);
    setUserNameSaved(true);
    setErrorMessage(null);
    setTimeout(() => setUserNameSaved(false), 2000);
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Tệp không hợp lệ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedCropSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc tệp ảnh từ thiết bị');
    };
    reader.readAsDataURL(file);
  };

  // Handle background image file selection
  const handleBgSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Tệp không hợp lệ');
      return;
    }

    try {
      setIsUploadingBg(true);
      const resizedBlob = await resizeBackgroundImage(file);
      await uploadBgImage(resizedBlob);
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể xử lý ảnh nền. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsUploadingBg(false);
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    await resetToDefaults();
    setResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tùy biến Giao diện & Chủ đề
            </h1>
            <span className="fin-badge bg-primary/10 text-primary border border-primary/25">
              <Sparkles className="w-3 h-3" /> Cá nhân hóa
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Điều chỉnh màu sắc, phông chữ, chế độ hiển thị, avatar và ảnh nền mờ theo phong cách riêng của bạn.
          </p>
        </div>

        {/* Reset button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetConfirmOpen(true)}
          className="gap-2 text-xs shrink-0 self-start sm:self-auto hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Đặt lại mặc định
        </Button>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline hover:no-underline ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Two Column Layout: Controls on Left, Sticky Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Settings Form (8 cols on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: Theme Mode */}
          <div className="fin-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sun className="w-4 h-4 text-primary" />
              <span>Chế độ hiển thị</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  mode: 'dark' as ThemeMode,
                  title: 'Tối Obsidian',
                  subtitle: 'Đen xám ngân hàng',
                  icon: Moon,
                  color: 'bg-[#0a0d14] text-white border-border',
                },
                {
                  mode: 'light' as ThemeMode,
                  title: 'Sáng Tinh gọn',
                  subtitle: 'Trắng trang nhã',
                  icon: Sun,
                  color: 'bg-white text-slate-900 border-slate-200',
                },
                {
                  mode: 'oled' as ThemeMode,
                  title: 'OLED Đen',
                  subtitle: 'Thuần đen #000000',
                  icon: Tv,
                  color: 'bg-black text-white border-neutral-800',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = config.mode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setThemeMode(item.mode)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-md shadow-primary/10'
                        : 'border-border/60 hover:border-border'
                    } ${item.color}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'opacity-70'}`} />
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{item.title}</div>
                      <div className="text-[10px] opacity-60 leading-tight">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Accent Color & Presets */}
          <div className="fin-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Palette className="w-4 h-4 text-primary" />
                <span>Màu sắc điểm nhấn (Accent)</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase bg-secondary/80 px-2 py-0.5 rounded">
                {config.accentColor}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Chọn màu chủ đạo. Hệ thống tự động sinh các sắc độ hover, viền vi tế, nền mờ và kiểm tra độ tương phản WCAG 2.1 AA.
            </p>

            {/* Curated Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {ACCENT_PRESETS.map((preset) => {
                const isSelected = config.accentColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setAccentColor(preset.hex)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 group ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary/40 bg-primary/5'
                        : 'border-border/60 hover:border-border hover:bg-secondary/40'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-black/20 flex items-center justify-center"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Picker */}
            <div className="pt-2 flex items-center gap-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-lg border border-border bg-card cursor-pointer"
                  title="Chọn màu tùy thích từ bảng màu"
                  aria-label="Bảng chọn màu tùy thích"
                />
                <span className="text-xs text-muted-foreground font-medium">Màu tùy chọn</span>
              </div>
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                    setAccentColor(e.target.value);
                  }
                }}
                placeholder="#10b981"
                className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-border bg-secondary/50 text-foreground"
              />
            </div>
          </div>

          {/* SECTION 3: Shapes & Typography */}
          <div className="fin-card p-5 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Hình khối & Phông chữ</span>
            </div>

            {/* Border Radius */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Độ bo góc thẻ (Border Radius)</span>
                <span className="font-mono text-foreground font-semibold">{config.borderRadius}px</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { px: 0, label: 'Vuông (0px)' },
                  { px: 8, label: 'Gọn (8px)' },
                  { px: 14, label: 'Chuẩn (14px)' },
                  { px: 20, label: 'Mềm (20px)' },
                ].map((item) => (
                  <button
                    key={item.px}
                    type="button"
                    onClick={() => setBorderRadius(item.px)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      config.borderRadius === item.px
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Glass Opacity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Độ mờ mặt kính thẻ (Glass Opacity)</span>
                <span className="font-mono text-foreground font-semibold">{config.cardOpacity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={config.cardOpacity}
                onChange={(e) => setCardOpacity(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Độ mờ mặt kính thẻ"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/70">
                <span>50% (Trong suốt kính)</span>
                <span>85% (Cân bằng khuyên dùng)</span>
                <span>100% (Đặc hoàn toàn)</span>
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Type className="w-3.5 h-3.5 text-primary" />
                <span>Phông chữ giao diện</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    'Plus Jakarta Sans',
                    'Inter',
                    'Be Vietnam Pro',
                    'JetBrains Mono',
                    'Roboto',
                    'System',
                  ] as FontFamily[]
                ).map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setFontFamily(font)}
                    className={`py-2 px-3 text-xs rounded-lg border text-left transition-all ${
                      config.fontFamily === font
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="truncate">{font}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: Avatar & User Profile */}
          <div className="fin-card p-5 space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="w-4 h-4 text-primary" />
              <span>Hồ sơ người dùng & Ảnh đại diện</span>
            </div>

            {/* Sub-item: Display Name Input */}
            <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-2.5">
              <label htmlFor="settings-user-name" className="text-xs font-semibold text-foreground block">
                Tên hiển thị người dùng (Hiển thị thay thế FINANCE VAULT)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="settings-user-name"
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  placeholder="Ví dụ: Minh Tuấn, Alex..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-card border border-border/70 focus:border-primary focus:outline-none"
                  maxLength={32}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSaveUserName}
                  disabled={!userNameInput.trim() || userNameInput === config.userName}
                  className="gap-1.5 text-xs py-2 px-3 shrink-0"
                >
                  {userNameSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-primary" /> Đã lưu
                    </>
                  ) : (
                    'Lưu tên'
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tên hiển thị tại góc trên thanh bên (PC) và thanh tiêu đề (Mobile).
              </p>
            </div>

            {/* Sub-item: Avatar Upload */}
            <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-md flex items-center justify-center bg-card cursor-pointer block active:scale-95 transition-transform"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      avatarInputRef.current?.click();
                    }
                  }}
                  title="Chọn ảnh đại diện"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="text-xs font-semibold text-foreground">Ảnh đại diện Sidebar</div>
                <p className="text-[11px] text-muted-foreground">
                  Hỗ trợ PNG, JPG, WebP, GIF. Khung cắt 1:1, tự động tối ưu hóa về 256x256 pixel.
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    id="settings-avatar-file-input"
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleAvatarSelect}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-border/70 hover:bg-muted font-medium bg-card text-foreground active:scale-95 transition-all shadow-sm"
                  >
                    <Upload className="w-3 h-3" /> {avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh lên'}
                  </button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={removeAvatar}
                      className="gap-1 text-xs py-1 px-2.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" /> Gỡ ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-item: Background Wallpaper */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Hình nền giao diện</div>
                  <p className="text-[11px] text-muted-foreground">
                    Tải ảnh nền mờ (tự động nén tối đa 1920px). Lưu trực tiếp trong cơ sở dữ liệu IndexedDB an toàn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="settings-bg-file-input"
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleBgSelect}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    disabled={isUploadingBg}
                    className={`cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-border/70 hover:bg-muted font-medium bg-card text-foreground active:scale-95 transition-all shadow-sm ${
                      isUploadingBg ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3 h-3" /> {isUploadingBg ? 'Đang nén...' : bgImageUrl ? 'Đổi hình nền' : 'Chọn hình nền'}
                  </button>
                  {bgImageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={removeBgImage}
                      className="gap-1 text-xs py-1 px-2.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" /> Gỡ nền
                    </Button>
                  )}
                </div>
              </div>

              {/* Background Adjustment Controls (when bg is uploaded) */}
              {config.bgSettings.hasImage && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                  {/* Blur slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Độ làm mờ (Blur)</span>
                      <span className="font-mono text-foreground font-semibold">
                        {config.bgSettings.blur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={config.bgSettings.blur}
                      onChange={(e) =>
                        setBgSettings({ blur: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      aria-label="Độ làm mờ hình nền"
                    />
                  </div>

                  {/* Overlay Darkening slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Lớp phủ tối tương phản (Dark Overlay)</span>
                      <span className="font-mono text-foreground font-semibold">
                        {config.bgSettings.overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={config.bgSettings.overlayOpacity}
                      onChange={(e) =>
                        setBgSettings({ overlayOpacity: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      aria-label="Lớp phủ tối tương phản hình nền"
                    />
                  </div>

                  {/* Fixed when scrolling */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">Cố định ảnh nền khi cuộn trang</span>
                    <input
                      type="checkbox"
                      checked={config.bgSettings.isFixed}
                      onChange={(e) => setBgSettings({ isFixed: e.target.checked })}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      aria-label="Cố định ảnh nền khi cuộn trang"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: Advanced (Financial semantic colors) */}
          <div className="fin-card p-5 space-y-4">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Nâng cao: Tùy chỉnh màu Thu nhập & Chi tiêu</span>
              </div>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="pt-2 space-y-4 border-t border-border/40 text-xs">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 flex items-start gap-2.5 text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Theo nguyên tắc an toàn thị giác tài chính, màu xanh lá (Thu nhập) và màu đỏ (Chi tiêu) được giữ cố định để bảo đảm phản xạ trực quan. Bạn có thể mở khóa bên dưới nếu muốn thay đổi.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium text-foreground">Kích hoạt màu tùy chỉnh cho Thu / Chi</span>
                  <input
                    type="checkbox"
                    checked={config.useCustomFinColors}
                    onChange={(e) => setCustomFinColors(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    aria-label="Kích hoạt màu tùy chỉnh cho Thu / Chi"
                  />
                </div>

                {config.useCustomFinColors && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <span className="text-muted-foreground font-medium">Màu Thu nhập</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customIncomeColor}
                          onChange={(e) =>
                            setCustomFinColors(true, e.target.value, config.customExpenseColor)
                          }
                          className="w-8 h-8 rounded border border-border bg-card cursor-pointer"
                          aria-label="Màu Thu nhập tùy chọn"
                        />
                        <span className="font-mono text-foreground">{config.customIncomeColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-muted-foreground font-medium">Màu Chi tiêu</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customExpenseColor}
                          onChange={(e) =>
                            setCustomFinColors(true, config.customIncomeColor, e.target.value)
                          }
                          className="w-8 h-8 rounded border border-border bg-card cursor-pointer"
                          aria-label="Màu Chi tiêu tùy chọn"
                        />
                        <span className="font-mono text-foreground">{config.customExpenseColor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Live Preview (5 cols on large screens) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          <ThemePreviewCard />
        </div>
      </div>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedCropSrc(null);
        }}
        imageSrc={selectedCropSrc}
        onConfirm={async (croppedDataUrl) => {
          await uploadAvatar(croppedDataUrl);
        }}
      />

      {/* Reset Confirmation Prompt */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="fin-card p-6 max-w-sm w-full space-y-4 border-destructive/30 bg-card shadow-2xl">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" />
              Đặt lại giao diện mặc định?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thao tác này sẽ khôi phục toàn bộ bảng màu Emerald Obsidian, chế độ tối, font chữ ban đầu và xóa ảnh đại diện cùng hình nền đã tải.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setResetConfirmOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
              >
                Xác nhận đặt lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
