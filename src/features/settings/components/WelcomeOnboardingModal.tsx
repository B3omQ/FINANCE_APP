import React, { useState, useRef } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { validateImageFile } from '../../../shared/lib/imageProcessing';
import { AvatarCropModal } from './AvatarCropModal';
import { Camera, Sparkles, ArrowRight, User } from 'lucide-react';

interface WelcomeOnboardingModalProps {
  onComplete: (name: string) => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({ onComplete }) => {
  const { avatarUrl, uploadAvatar } = useThemeStore();
  const [name, setName] = useState('');
  const [selectedCropFile, setSelectedCropFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập tên của bạn để tiếp tục');
      return;
    }
    onComplete(trimmed);
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Tệp không hợp lệ');
      return;
    }

    setSelectedCropFile(file);
    setIsCropModalOpen(true);
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    try {
      await uploadAvatar(croppedBlob);
      setIsCropModalOpen(false);
      setSelectedCropFile(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể lưu ảnh đại diện');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in">
          {/* Header with Sparkles */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <Sparkles size={13} />
              <span>Chào mừng bạn mới</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Thiết lập hồ sơ cá nhân
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Nhập tên của bạn để ứng dụng cá nhân hóa không gian tài chính và hiển thị trên thanh công cụ.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs text-center">
              {errorMessage}
            </div>
          )}

          {/* Avatar Upload (Optional) */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group">
              <label
                htmlFor="onboarding-avatar-input"
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/60 shadow-md flex items-center justify-center bg-secondary/60 cursor-pointer block relative group-hover:border-primary transition-all active:scale-95"
                title="Nhấn để chọn ảnh đại diện"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-medium gap-0.5">
                  <Camera size={16} />
                  <span>Đổi ảnh</span>
                </div>
              </label>

              {/* Camera icon badge */}
              <label
                htmlFor="onboarding-avatar-input"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow border-2 border-card cursor-pointer"
              >
                <Camera size={11} />
              </label>
            </div>

            <label
              htmlFor="onboarding-avatar-input"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer py-1 px-2"
            >
              <Camera size={12} />
              <span>{avatarUrl ? 'Thay đổi ảnh' : 'Thêm ảnh đại diện (tùy chọn)'}</span>
            </label>

            <input
              id="onboarding-avatar-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="opacity-0 pointer-events-none absolute -z-10 w-px h-px overflow-hidden"
            />
          </div>

          {/* Form Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="onboarding-user-name" className="text-xs font-semibold text-foreground block mb-1.5">
                Tên hoặc biệt danh của bạn <span className="text-primary">*</span>
              </label>
              <Input
                id="onboarding-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Tuấn Tài Chính, Minh An..."
                className="text-sm py-2.5 font-medium"
                maxLength={32}
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
              disabled={!name.trim()}
            >
              <span>Vào không gian tài chính</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>

      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedCropFile(null);
        }}
        imageFile={selectedCropFile}
        onConfirm={handleCropConfirm}
      />
    </>
  );
};

