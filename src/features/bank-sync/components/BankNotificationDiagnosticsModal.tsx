import React, { useEffect, useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useBankNotifications } from '../useBankNotifications';
import { useToast } from '@/shared/ui/Toast';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Copy, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  Smartphone,
  Check
} from 'lucide-react';

export interface BankNotificationDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BankNotificationDiagnosticsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { logs, fetchLogs, clearLogs, addMockTransaction } = useBankNotifications();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchLogs().finally(() => setIsLoading(false));
    }
  }, [isOpen, fetchLogs]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchLogs();
    setIsLoading(false);
    showToast({ message: 'Đã làm mới nhật ký đọc thông báo', type: 'info' });
  };

  const handleClear = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử log thông báo không?')) {
      await clearLogs();
      showToast({ message: 'Đã xóa sạch nhật ký', type: 'info' });
    }
  };

  const handleCopyLogs = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast({ message: 'Đã sao chép toàn bộ log vào bộ nhớ tạm', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestNotification = async (bankName: string) => {
    await addMockTransaction(bankName, 120000, 'expense', 'Test chuyển khoản');
    await fetchLogs();
    showToast({ message: `Đã phát thông báo mẫu ${bankName}`, type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} /> Thành công
          </span>
        );
      case 'SERVICE_CONNECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Activity size={12} /> Dịch vụ hoạt động
          </span>
        );
      case 'SERVICE_DISCONNECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert size={12} /> Mất kết nối
          </span>
        );
      case 'UNSUPPORTED_APP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Smartphone size={12} /> App chưa hỗ trợ
          </span>
        );
      default: // IGNORED
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={12} /> Bỏ qua
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kiểm tra & Nhật ký đọc thông báo ngân hàng"
      description="Xem trực tiếp thông báo được bắt từ hệ thống Android để kiểm tra MB Bank, Techcombank và các ngân hàng khác."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Permission Instructions Card */}
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-primary">
            <ShieldAlert size={16} />
            <span>Cách cấp quyền đọc thông báo trên Android (Bắt buộc)</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Quyền đọc thông báo ngân hàng <strong className="text-foreground">không nằm trong mục Quyền ứng dụng thông thường</strong>. Bạn cần kích hoạt như sau:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
            <li>
              Vào <strong className="text-foreground">Cài đặt điện thoại</strong> &gt; <strong className="text-foreground">Thông báo</strong> (hoặc <strong className="text-foreground">Ứng dụng</strong>) &gt; <strong className="text-foreground">Quyền truy cập thông báo</strong> (Device & app notifications).
            </li>
            <li>
              Tìm ứng dụng <strong className="text-primary font-bold">FinanceApp</strong> và gạt <strong className="text-emerald-400">BẬT</strong>.
            </li>
            <li>
              <span className="text-amber-400 font-semibold">* Nếu cần gạt bị mờ/xám (Android 13/14/15):</span> Vào <em>Cài đặt &gt; Ứng dụng &gt; FinanceApp &gt; Bấm dấu 3 chấm góc trên bên phải &gt; Chọn &quot;Cho phép cài đặt bị hạn chế&quot; (Allow restricted settings)</em>, sau đó quay lại bước 2 để gạt bật.
            </li>
          </ol>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 gap-1 text-xs"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="h-8 gap-1 text-xs"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Đã copy' : 'Sao chép Log'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={logs.length === 0}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-rose-400"
            >
              <Trash2 size={13} />
              <span>Xóa log</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Thử nghiệm:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestNotification('MB Bank')}
              className="h-7 text-[10px] px-2"
            >
              + Giả lập MB
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestNotification('Techcombank')}
              className="h-7 text-[10px] px-2"
            >
              + Giả lập Tech
            </Button>
          </div>
        </div>

        {/* Logs List Container */}
        <div className="border border-border/70 rounded-xl bg-background/50 overflow-hidden">
          <div className="px-3.5 py-2 bg-muted/40 border-b border-border/50 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Danh sách thông báo đã nhận ({logs.length})</span>
            <span className="text-[10px] font-normal">Tự động lưu tối đa 50 thông báo gần nhất</span>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-border/40 p-1">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Info size={28} className="mx-auto text-muted-foreground/50" />
                <p>Chưa có dữ liệu thông báo nào được ghi nhận.</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Nếu bạn vừa chuyển khoản mà chưa thấy log, hãy kiểm tra xem bạn đã cấp <strong>Quyền truy cập thông báo</strong> cho FinanceApp chưa theo hướng dẫn ở trên!
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 space-y-1.5 hover:bg-muted/20 transition-colors rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-xs font-bold text-foreground">
                        {log.bankName || log.packageName}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>

                  {log.title && (
                    <div className="text-xs font-semibold text-foreground/90 line-clamp-1">
                      {log.title}
                    </div>
                  )}

                  {log.text && (
                    <div className="text-[11px] text-muted-foreground font-mono bg-muted/40 p-1.5 rounded border border-border/30 break-all">
                      {log.text}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">Package: <code className="text-foreground/80">{log.packageName}</code></span>
                    <span className="text-primary font-medium shrink-0">{log.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
