import React, { useState, useRef } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { validateImageFile } from '../../../shared/lib/imageProcessing';
import { AvatarCropModal } from './AvatarCropModal';
import { Camera, Trash2, User, Palette, Check, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { config, avatarUrl, setUserName, uploadAvatar, removeAvatar } = useThemeStore();
  const [name, setName] = useState(config.userName || '');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedCropSrc, setSelectedCropSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Keep local name in sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName(config.userName || '');
      setIsSaved(false);
      setErrorMessage(null);
    }
  }, [isOpen, config.userName]);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập tên người dùng');
      return;
    }
    setUserName(trimmed);
    setIsSaved(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
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

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedCropSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc dữ liệu ảnh từ thiết bị');
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedDataUrl: string) => {
    try {
      await uploadAvatar(croppedDataUrl);
      setIsCropModalOpen(false);
      setSelectedCropSrc(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể cập nhật ảnh đại diện');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể gỡ ảnh đại diện');
    }
  };

  const handleGoToThemeSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Hồ sơ người dùng"
        description="Thay đổi tên hiển thị và ảnh đại diện trên ứng dụng"
        className="max-w-md"
      >
        <div className="space-y-6 pt-2">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              {errorMessage}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full overflow-hidden border-3 border-primary/70 shadow-lg flex items-center justify-center bg-card cursor-pointer block relative group-hover:border-primary transition-all active:scale-95"
                title="Nhấn để chọn ảnh mới từ thư viện"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <User size={40} />
                  </div>
                )}

                {/* Mobile & Desktop Tap overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1 backdrop-blur-[2px]">
                  <Camera size={20} />
                  <span>Đổi ảnh</span>
                </div>
              </div>

              {/* Camera Badge always visible for easy tapping on mobile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-card cursor-pointer active:scale-90 transition-transform"
                title="Chọn ảnh từ thiết bị"
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Native file input - accessible sr-only to guarantee Android WebView compatibility */}
            <input
              id="user-profile-avatar-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleAvatarFileSelect}
              className="sr-only"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 rounded-xl border border-border/70 hover:bg-muted font-medium bg-secondary/50 text-foreground active:scale-95 transition-all shadow-sm"
              >
                <Upload size={13} /> <span>{avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
              </button>

              {avatarUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  className="gap-1 text-xs py-2 px-2.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={13} /> Gỡ ảnh
                </Button>
              )}
            </div>
          </div>

          {/* Name Input Form */}
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label htmlFor="user-display-name" className="text-xs font-semibold text-foreground block mb-1.5">
                Tên hiển thị (thay thế FINANCE VAULT)
              </label>
              <Input
                id="user-display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A, Tuấn Finance..."
                className="text-sm font-medium"
                maxLength={32}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Tên này sẽ hiển thị ở góc trên của thanh bên (PC) và thanh tiêu đề (Mobile).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 min-w-[90px]">
                {isSaved ? (
                  <>
                    <Check size={14} /> Đã lưu
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </form>

          {/* Quick theme settings link */}
          <div className="pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={handleGoToThemeSettings}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-primary" />
                <span>Mở tùy biến chủ đề & màu sắc</span>
              </div>
              <span className="text-[10px] text-primary font-semibold">Chi tiết →</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedCropSrc(null);
        }}
        imageSrc={selectedCropSrc}
        onConfirm={handleCropConfirm}
      />
    </>
  );
};
