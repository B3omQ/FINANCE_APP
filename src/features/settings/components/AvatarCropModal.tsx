import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { cropAndResizeAvatar, CropArea } from '../../../shared/lib/imageProcessing';
import { ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onConfirm: (croppedBlob: Blob) => Promise<void>;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  onConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImageReady, setIsImageReady] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // 320x320
    ctx.clearRect(0, 0, size, size);

    // Calculate scaled dimensions
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const scale = (size / minDim) * zoom;
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    const centerX = size / 2 + offset.x;
    const centerY = size / 2 + offset.y;

    const startX = centerX - drawWidth / 2;
    const startY = centerY - drawHeight / 2;

    // Draw original image
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);

    // Draw darkened mask outside the circular/square crop region
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    // Cut out circle in the center
    ctx.arc(size / 2, size / 2, size / 2 - 16, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw boundary circle
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset]);

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      setIsImageReady(false);
      imgRef.current = null;
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsImageReady(false);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      imgRef.current = img;
      setIsImageReady(true);
    };
    img.onerror = () => {
      console.error('Failed to load image in AvatarCropModal');
      setIsImageReady(false);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (isImageReady) {
      draw();
    }
  }, [draw, isImageReady]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile dragging
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (touch) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (touch) {
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    try {
      setIsProcessing(true);
      const size = canvas.width;
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const scale = (size / minDim) * zoom;
      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;

      const centerX = size / 2 + offset.x;
      const centerY = size / 2 + offset.y;
      const startX = centerX - drawWidth / 2;
      const startY = centerY - drawHeight / 2;

      // Crop box coords on canvas
      const cropRadius = size / 2 - 16;
      const cropCanvasLeft = size / 2 - cropRadius;
      const cropCanvasTop = size / 2 - cropRadius;
      const cropBoxSize = cropRadius * 2;

      // Map back to natural image coordinates
      const naturalCropX = Math.max(0, (cropCanvasLeft - startX) / scale);
      const naturalCropY = Math.max(0, (cropCanvasTop - startY) / scale);
      const naturalCropDim = Math.min(img.naturalWidth, img.naturalHeight, cropBoxSize / scale);

      const cropArea: CropArea = {
        x: Math.round(naturalCropX),
        y: Math.round(naturalCropY),
        width: Math.round(naturalCropDim),
        height: Math.round(naturalCropDim),
      };

      const croppedBlob = await cropAndResizeAvatar(img, cropArea);
      await onConfirm(croppedBlob);
      onClose();
    } catch (err) {
      console.error('Lỗi khi cắt ảnh đại diện:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cắt ảnh đại diện">
      <div className="flex flex-col items-center gap-5">
        <p className="text-xs text-muted-foreground text-center">
          Kéo ảnh để di chuyển vị trí, dùng thanh trượt để phóng to / thu nhỏ khung hình vuông tròn.
        </p>

        {/* Canvas Workspace */}
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-inner bg-black/40">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="cursor-grab active:cursor-grabbing block touch-none max-w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        </div>

        {/* Controls: Zoom & Reset */}
        <div className="w-full space-y-3 px-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <ZoomOut className="w-3.5 h-3.5" /> Thu nhỏ
            </span>
            <span className="font-mono text-foreground font-semibold">{(zoom * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1.5 font-medium">
              Phóng to <ZoomIn className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              aria-label="Độ phóng to ảnh đại diện"
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Đặt lại góc nhìn"
              className="px-2.5 py-1 text-xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm -mx-5 -mb-4 px-5 py-3.5 border-t border-border/50 flex items-center justify-end gap-3 w-[calc(100%+2.5rem)] mt-2 z-10 shadow-lg">
          <Button type="button" variant="outline" className="min-h-[40px] px-4" onClick={onClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={isProcessing}
            className="min-h-[40px] px-5 font-bold gap-2"
          >
            <Check className="w-4 h-4" /> {isProcessing ? 'Đang xử lý...' : 'Lưu ảnh'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
