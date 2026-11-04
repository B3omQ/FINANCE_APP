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

  it('correctly parses Vietnamese currency amounts with regex', () => {
    // Requires sign [+-] or VND/đ currency unit
    const regex = /([+-])\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})(?:\s*(?:VND|VNĐ|vnd|vnđ|đ|d))?|([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})\s*(?:VND|VNĐ|vnd|vnđ|đ|d)/i;

    const vcbSample = 'TK 1012xxx | GD: -50,000 VND 29/10/26 14:30 | ND: Mua banh';
    const match1 = vcbSample.match(regex);
    expect(match1).not.toBeNull();
    expect(match1?.[1]).toBe('-');
    expect(match1?.[2]?.replace(/[,.]/g, '')).toBe('50000');

    const mbSample = 'Bien dong so du: TK 0987654321 -150,000VND';
    const match2 = mbSample.match(regex);
    expect(match2).not.toBeNull();
    expect(match2?.[1]).toBe('-');
    expect(match2?.[2]?.replace(/[,.]/g, '')).toBe('150000');

    const momoSample = 'Thanh toan thanh cong 45.000đ cho Circle K';
    const match3 = momoSample.match(regex);
    expect(match3).not.toBeNull();
    const rawVal = match3?.[3] ?? match3?.[2] ?? '';
    expect(rawVal.replace(/[,.]/g, '')).toBe('45000');
  });
});
