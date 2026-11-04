import { useState, useEffect, useCallback } from 'react';
import { PendingBankTransaction, DiagnosticLogItem } from './types';

const STORAGE_KEY = 'pending_bank_notifications_local';
const LOGS_STORAGE_KEY = 'bank_notification_diagnostic_logs_local';

export function useBankNotifications() {
  const [pendingList, setPendingList] = useState<PendingBankTransaction[]>([]);
  const [logs, setLogs] = useState<DiagnosticLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const raw = await invoke<string>('get_pending_bank_transactions');
        const parsed: PendingBankTransaction[] = JSON.parse(raw || '[]');
        setPendingList(parsed.filter((tx) => tx.status === 'pending'));
      } else {
        // Fallback for Web browser testing
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: PendingBankTransaction[] = JSON.parse(stored);
          setPendingList(parsed.filter((tx) => tx.status === 'pending'));
        }
      }
    } catch (err) {
      console.warn('Could not fetch bank transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (): Promise<DiagnosticLogItem[]> => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const raw = await invoke<string>('get_bank_notification_logs');
        const parsed: DiagnosticLogItem[] = JSON.parse(raw || '[]');
        setLogs(parsed);
        return parsed;
      } else {
        const stored = localStorage.getItem(LOGS_STORAGE_KEY);
        const parsed: DiagnosticLogItem[] = stored ? JSON.parse(stored) : [];
        setLogs(parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('Could not fetch diagnostic logs:', err);
      return [];
    }
  }, []);

  const clearLogs = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('clear_bank_notification_logs');
      } else {
        localStorage.removeItem(LOGS_STORAGE_KEY);
      }
      setLogs([]);
    } catch (err) {
      console.warn('Could not clear diagnostic logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    // Poll every 8 seconds for new bank notification alerts
    const interval = setInterval(fetchTransactions, 8000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const dismissTransaction = async (id: string) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('update_bank_transaction_status', { id, status: 'dismissed' });
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const list: PendingBankTransaction[] = JSON.parse(stored);
          const updated = list.map((item) => (item.id === id ? { ...item, status: 'dismissed' as const } : item));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
      setPendingList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to dismiss transaction:', err);
    }
  };

  const markAsImported = async (id: string) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('update_bank_transaction_status', { id, status: 'imported' });
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const list: PendingBankTransaction[] = JSON.parse(stored);
          const updated = list.map((item) => (item.id === id ? { ...item, status: 'imported' as const } : item));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
      setPendingList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to mark transaction imported:', err);
    }
  };

  const addMockTransaction = async (
    bankName = 'Vietcombank',
    amount = 55000,
    type: 'expense' | 'income' = 'expense',
    content = 'Highlands Coffee'
  ) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('add_mock_bank_transaction', {
          bankCode: 'VCB',
          bankName,
          amount,
          txType: type,
          content,
        });
      } else {
        const mockItem: PendingBankTransaction = {
          id: `mock-${Date.now()}`,
          bankCode: 'VCB',
          bankName,
          amount,
          type,
          accountNumber: '1012***',
          content,
          timestamp: Date.now(),
          rawTitle: `Biến động số dư ${bankName}`,
          rawText: `GD: ${type === 'expense' ? '-' : '+'}${amount.toLocaleString()} VND. ND: ${content}`,
          packageName: 'com.VCB',
          status: 'pending',
        };
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        localStorage.setItem(STORAGE_KEY, JSON.stringify([mockItem, ...current]));
      }
      await fetchTransactions();
    } catch (err) {
      console.error('Failed to add mock transaction:', err);
    }
  };

  return {
    pendingList,
    logs,
    isLoading,
    refresh: fetchTransactions,
    fetchLogs,
    clearLogs,
    dismissTransaction,
    markAsImported,
    addMockTransaction,
  };
}
