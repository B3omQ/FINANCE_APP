export interface PendingBankTransaction {
  id: string;
  bankCode: string;
  bankName: string;
  amount: number;
  type: 'expense' | 'income';
  accountNumber?: string;
  content?: string;
  timestamp: number;
  rawTitle: string;
  rawText: string;
  packageName: string;
  status: 'pending' | 'imported' | 'dismissed';
}

export interface DiagnosticLogItem {
  id: string;
  timestamp: number;
  packageName: string;
  bankName?: string;
  title: string;
  text: string;
  status: string;
  reason: string;
}
