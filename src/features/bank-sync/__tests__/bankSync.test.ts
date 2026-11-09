import { describe, it, expect } from 'vitest';
import { PendingBankTransaction } from '../types';

describe('Bank Notifications Logic & Parsing', () => {
  it('correctly handles pending transaction model', () => {
    const tx: PendingBankTransaction = {
      id: 'tx-1',
      bankCode: 'VCB',
      bankName: 'Vietcombank',
      amount: 45000,
      type: 'expense',
      content: 'Highlands Coffee',
      timestamp: Date.now(),
      rawTitle: 'Biến động số dư Vietcombank',
      rawText: 'TK 1012*** | GD: -45,000 VND 29/10/26 | ND: Highlands Coffee',
      packageName: 'com.VCB',
      status: 'pending',
    };

    expect(tx.amount).toBe(45000);
    expect(tx.type).toBe('expense');
    expect(tx.status).toBe('pending');
  });

  it('filters pending transactions from list', () => {
    const list: PendingBankTransaction[] = [
      {
        id: '1',
        bankCode: 'VCB',
        bankName: 'VCB',
        amount: 50000,
        type: 'expense',
        timestamp: 100,
        rawTitle: '',
        rawText: '',
        packageName: '',
        status: 'pending',
      },
      {
        id: '2',
        bankCode: 'MB',
        bankName: 'MB',
        amount: 200000,
        type: 'income',
        timestamp: 200,
        rawTitle: '',
        rawText: '',
        packageName: '',
        status: 'imported',
      },
      {
        id: '3',
        bankCode: 'TCB',
        bankName: 'TCB',
        amount: 15000,
        type: 'expense',
        timestamp: 300,
        rawTitle: '',
        rawText: '',
        packageName: '',
        status: 'dismissed',
      },
    ];

    const pending = list.filter((t) => t.status === 'pending');
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe('1');
  });

  it('correctly parses Vietnamese currency amounts with regex including Techcombank and MB Bank formats', () => {
    // Regex matching amount formats with signs or currency:
    // 1) Sign [+-] followed by optional VND and number (e.g. Techcombank: +VND 500,000, -VND 150,000, + VND 500,000)
    // 2) VND followed by sign and number (e.g. VND +500,000)
    // 3) Number followed by VND (e.g. MB/VCB: -150,000VND, 50.000đ)
    const amountRegex = /(?:([+-])\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})|(?:VND|VNĐ|vnd|vnđ|đ|d)\s*([+-])\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})|([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})\s*(?:VND|VNĐ|vnd|vnđ|đ|d))/i;
    const balanceStripRegex = /(?:số\s*dư|so\s*du|số\s*dư\s*khả\s*dụng|so\s*du\s*kha\s*dung)\s*:?\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?/gi;

    // Techcombank Sample 1: +VND 500,000 with balance
    const tcbIncome = 'TK 19033388888888 tai Techcombank +VND 500,000 luc 14:30 05/11/2026. So du: VND 1,500,000. Noi dung: Nguyen Van A chuyen tien';
    const cleanTcbIncome = tcbIncome.replace(balanceStripRegex, '');
    const matchTcb1 = cleanTcbIncome.match(amountRegex);
    expect(matchTcb1).not.toBeNull();
    const signTcb1 = matchTcb1?.[1] || matchTcb1?.[3] || '';
    const numTcb1 = matchTcb1?.[2] || matchTcb1?.[4] || matchTcb1?.[5] || '';
    expect(signTcb1).toBe('+');
    expect(numTcb1.replace(/[,.]/g, '')).toBe('500000');

    // Techcombank Sample 2: -VND 150,000 with balance
    const tcbExpense = 'TK 19033388888888 tai Techcombank -VND 150,000 luc 09:15 05/11/2026. So du: VND 1,350,000. Noi dung: Thanh toan ca phe';
    const cleanTcbExpense = tcbExpense.replace(balanceStripRegex, '');
    const matchTcb2 = cleanTcbExpense.match(amountRegex);
    expect(matchTcb2).not.toBeNull();
    const signTcb2 = matchTcb2?.[1] || matchTcb2?.[3] || '';
    const numTcb2 = matchTcb2?.[2] || matchTcb2?.[4] || matchTcb2?.[5] || '';
    expect(signTcb2).toBe('-');
    expect(numTcb2.replace(/[,.]/g, '')).toBe('150000');

    // Techcombank Sample 3: Spaced + VND 500,000
    const tcbSpaced = 'TK 19033388888888 tai Techcombank + VND 500,000 luc 14:30. So du: VND 1,500,000';
    const cleanTcbSpaced = tcbSpaced.replace(balanceStripRegex, '');
    const matchTcb3 = cleanTcbSpaced.match(amountRegex);
    expect(matchTcb3).not.toBeNull();
    expect(matchTcb3?.[1]).toBe('+');
    expect(matchTcb3?.[2]?.replace(/[,.]/g, '')).toBe('500000');

    // MB Bank Sample: -150,000VND
    const mbSample = 'Bien dong so du: TK 0987654321 -150,000VND luc 12:30. So du: 2,000,000VND. ND: Mua banh';
    const cleanMb = mbSample.replace(balanceStripRegex, '');
    const matchMb = cleanMb.match(amountRegex);
    expect(matchMb).not.toBeNull();
    expect(matchMb?.[1]).toBe('-');
    expect(matchMb?.[2]?.replace(/[,.]/g, '')).toBe('150000');

    // Vietcombank Sample: -50,000 VND
    const vcbSample = 'TK 1012xxx | GD: -50,000 VND 29/10/26 14:30 | ND: Mua banh';
    const matchVcb = vcbSample.match(amountRegex);
    expect(matchVcb).not.toBeNull();
    expect(matchVcb?.[1]).toBe('-');
    expect(matchVcb?.[2]?.replace(/[,.]/g, '')).toBe('50000');

    // MoMo Sample: 45.000đ
    const momoSample = 'Thanh toan thanh cong 45.000đ cho Circle K';
    const matchMomo = momoSample.match(amountRegex);
    expect(matchMomo).not.toBeNull();
    const rawVal = matchMomo?.[5] ?? matchMomo?.[2] ?? '';
    expect(rawVal.replace(/[,.]/g, '')).toBe('45000');
  });

  it('correctly extracts note without falsely matching VND', () => {
    const notePriorityRegex = /\b(?:Nội dung|Noi dung|Lý do|Ly do|Ghi chú|Ghi chu|ND)\b\s*:?\s*([^|;\n\r.]+)/i;
    const noteFallbackRegex = /\b(?:tại|tai|cho|tới|to)\b\s*:?\s*(?!Techcombank|MB|Vietcombank|ACB|VPBank|BIDV)([^|;\n\r.]+)/i;

    const tcbText = 'TK 19033388888888 tai Techcombank +VND 500,000 luc 14:30 05/11/2026. So du: VND 1,500,000. Noi dung: Nguyen Van A chuyen tien';
    const m1 = tcbText.match(notePriorityRegex);
    expect(m1).not.toBeNull();
    expect(m1?.[1]?.trim()).toBe('Nguyen Van A chuyen tien');

    const cardText = 'Thanh toan qua the debit 4011xxxxxx: -50,000 VND tai SHOPEE. So du: 1,450,000 VND';
    let note = cardText.match(notePriorityRegex)?.[1]?.trim();
    if (!note) {
      note = cardText.match(noteFallbackRegex)?.[1]?.trim();
    }
    expect(note).toBe('SHOPEE');
  });
});
