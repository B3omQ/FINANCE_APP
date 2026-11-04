import React, { useState } from 'react';
import { useBankNotifications } from '../useBankNotifications';
import { useUIStore } from '@/store/uiStore';
import { formatMoney } from '@/shared/lib/formatMoney';
import { BellRing, X, PlusCircle, Building2, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { BankNotificationDiagnosticsModal } from './BankNotificationDiagnosticsModal';

export { BankNotificationDiagnosticsModal };

export function BankNotificationBanner() {
  const { pendingList, dismissTransaction, markAsImported } = useBankNotifications();
  const { openQuickAdd } = useUIStore();
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  if (pendingList.length === 0) {
    return null;
  }

  const handleImport = (tx: (typeof pendingList)[0]) => {
    openQuickAdd({
      amount: tx.amount,
      type: tx.type,
      note: `${tx.bankName}: ${tx.content || 'Chi tiêu qua ngân hàng'}`,
      onProcessed: () => {
        markAsImported(tx.id);
      },
    });
  };

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BellRing size={16} className="animate-bounce" />
            <span>Phát hiện biến động số dư ngân hàng ({pendingList.length})</span>
          </div>

          <button
            type="button"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2.5 rounded-lg border border-border/50 bg-background/60"
          >
            <Activity size={13} className="text-primary" />
            <span>Xem nhật ký</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingList.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm backdrop-blur-sm flex flex-col justify-between gap-3 transition-all hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-primary">
                        {tx.bankName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-1 mt-0.5">
                      {tx.content || tx.rawText || 'Giao dịch ngân hàng'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-extrabold ${
                      tx.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissTransaction(tx.id)}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X size={14} className="mr-1" />
                  Bỏ qua
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleImport(tx)}
                  className="h-8 px-3 text-xs bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle size={14} className="mr-1.5 stroke-[2.2]" />
                  Ghi sổ ngay
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BankNotificationDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </>
  );
}

// Dev trigger widget to simulate notifications on desktop/browser
export function BankNotificationTestWidget() {
  const { addMockTransaction } = useBankNotifications();
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  return (
    <>
      <div className="p-4 rounded-xl border border-dashed border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <span>
            <strong>Giả lập Test:</strong> Bắn thử thông báo ngân hàng trừ tiền để kiểm tra tính năng tự động ghi nhận
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => addMockTransaction('Vietcombank', 45000, 'expense', 'Cafe Trung Nguyen')}
          >
            + VCB -45k
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => addMockTransaction('Techcombank', 120000, 'expense', 'Grab Food')}
          >
            + TCB -120k
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => addMockTransaction('MB Bank', 500000, 'income', 'Nhan luong thuong')}
          >
            + MB +500k
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-[11px] gap-1 font-semibold"
            onClick={() => setIsDiagnosticsOpen(true)}
          >
            <Activity size={12} />
            <span>Nhật ký log</span>
          </Button>
        </div>
      </div>

      <BankNotificationDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </>
  );
}
