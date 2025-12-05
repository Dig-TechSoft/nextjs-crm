'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';
import { routing } from '@/i18n/routing';

export interface WithdrawalRequest {
  id: number;
  deal: string | null;
  login: string | null;
  clientName: string | null;
  amount: number | null;
  bankName: string | null;
  bankNumber: string | null;
  time: Date | string | null;
  updateTime: Date | string | null;
  status: string | null;
  balance: number | null;
  credit: number | null;
  equity: number | null;
  margin: number | null;
  marginFree: number | null;
  marginLevel: number | null;
  operator: string | null;
  currency: string | null;
  cancelWithdrawDeal: string | null;
  comment: string | null;
  paymentMethod: string | null;
  usdtType: string | null;
  walletAddress: string | null;
}

interface WithdrawalRow extends RowDataPacket {
  Withdraw_ID: number;
  Deal: string | null;
  Login: string | null;
  ClientName: string | null;
  Amount: number | string | null;
  BankName: string | null;
  BankNumber: string | null;
  Time: Date | string | null;
  UpdateTime: Date | string | null;
  Status: string | null;
  balance: number | string | null;
  credit: number | string | null;
  equity: number | string | null;
  margin: number | string | null;
  marginfree: number | string | null;
  marginlevel: number | string | null;
  operator: string | null;
  currency: string | null;
  cancelwithdrawdeal: string | null;
  Comment: string | null;
  PaymentMethod: string | null;
  USDTType: string | null;
  WalletAddress: string | null;
}

const BALANCE_API_URL =
  process.env.BALANCE_API_URL || 'http://127.0.0.1:3000/api/trade/balance';

const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS || 10000);

function revalidateWithdrawPages() {
  revalidatePath('/operations/withdraw');
  routing.locales.forEach((locale) =>
    revalidatePath(`/${locale}/operations/withdraw`)
  );
}

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function fetchWithdrawalRequestsPaginated(
  page: number,
  pageSize: number,
  filters?: { status?: string; from?: string; to?: string }
): Promise<{ requests: WithdrawalRequest[]; total: number }> {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const limit = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const offset = (currentPage - 1) * limit;

  const whereParts: string[] = [];
  const params: Array<string | number | Date> = [];

  const status = filters?.status?.toLowerCase();
  const hasDates = Boolean(filters?.from) || Boolean(filters?.to);
  if (status && status !== 'all') {
    if (status === 'pending' && !hasDates) {
      whereParts.push(`(LOWER(Status) = ? OR DATE(Time) = CURDATE())`);
      params.push(status);
    } else {
      whereParts.push(`LOWER(Status) = ?`);
      params.push(status);
    }
  }

  const from = filters?.from ? new Date(filters.from) : null;
  if (from && !Number.isNaN(from.getTime())) {
    whereParts.push(`Time >= ?`);
    params.push(from);
  }

  const to = filters?.to ? new Date(filters.to) : null;
  if (to && !Number.isNaN(to.getTime())) {
    whereParts.push(`Time <= ?`);
    params.push(to);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  try {
    const [[countRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM withdrawal_request ${whereClause}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const [rows] = await pool.query<WithdrawalRow[]>(
      `
        SELECT
          Withdraw_ID,
          Deal,
          Login,
          ClientName,
          Amount,
          BankName,
          BankNumber,
          Time,
          UpdateTime,
          Status,
          balance,
          credit,
          equity,
          margin,
          marginfree,
          marginlevel,
          operator,
          currency,
          cancelwithdrawdeal,
        Comment,
        PaymentMethod,
        USDTType,
        WalletAddress
      FROM withdrawal_request
      ${whereClause}
      ORDER BY Time DESC
      LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

    const requests = rows.map((row) => ({
      id: row.Withdraw_ID,
      deal: row.Deal,
      login: row.Login,
      clientName: row.ClientName,
      amount: toNumber(row.Amount),
      bankName: row.BankName,
      bankNumber: row.BankNumber,
      time: row.Time,
      updateTime: row.UpdateTime,
      status: row.Status,
      balance: toNumber(row.balance),
      credit: toNumber(row.credit),
      equity: toNumber(row.equity),
      margin: toNumber(row.margin),
      marginFree: toNumber(row.marginfree),
      marginLevel: toNumber(row.marginlevel),
      operator: row.operator,
      currency: row.currency,
      cancelWithdrawDeal: row.cancelwithdrawdeal,
      comment: row.Comment,
      paymentMethod: row.PaymentMethod,
      usdtType: row.USDTType,
      walletAddress: row.WalletAddress,
    }));

    return { requests, total };
  } catch (error) {
    console.error('fetchWithdrawalRequestsPaginated error:', error);
    return { requests: [], total: 0 };
  }
}

export async function approveWithdrawalAction(formData: FormData) {
  const withdrawId = Number(formData.get('withdrawId'));
  const commentInput = (formData.get('comment')?.toString() || '').trim();
  const customComment = commentInput || 'Approved';
  const operator = (formData.get('operator')?.toString() || '').trim() || 'Operator';

  try {
    if (!withdrawId) {
      return { success: false, error: 'Invalid withdraw id.' };
    }

    const [rows] = await pool.query<WithdrawalRow[]>(
      `SELECT * FROM withdrawal_request WHERE Withdraw_ID = ?`,
      [withdrawId]
    );

    if (!rows.length) {
      return { success: false, error: 'Request not found.' };
    }

    const request = rows[0];
    const currentStatus = (request.Status || '').toLowerCase();
    if (currentStatus === 'cancelled') {
      return { success: false, error: 'This request was cancelled by the client.' };
    }
    if (currentStatus === 'rejected') {
      return { success: false, error: 'This request has been rejected.' };
    }
    if (currentStatus === 'transferred') {
      return { success: false, error: 'This request is already approved.' };
    }

    await pool.query(
      `
        UPDATE withdrawal_request
        SET Status = 'transferred',
            Comment = ?,
            operator = ?,
            currency = 'USD',
            UpdateTime = CURRENT_TIMESTAMP
        WHERE Withdraw_ID = ?
      `,
      [customComment, operator, withdrawId]
    );

    revalidateWithdrawPages();

    return { success: true };
  } catch (error) {
    console.error('approveWithdrawalAction error:', error);
    return { success: false, error: 'Withdrawal approval failed on server.' };
  }
}

export async function rejectWithdrawalAction(formData: FormData) {
  const withdrawId = Number(formData.get('withdrawId'));
  const commentInput = (formData.get('comment')?.toString() || '').trim();
  const customComment = commentInput || 'ADJ_RejectWithdraw';
  const operator = (formData.get('operator')?.toString() || '').trim() || 'Operator';

  try {
    if (!withdrawId) {
      return { success: false, error: 'Invalid withdraw id.' };
    }

    const [rows] = await pool.query<WithdrawalRow[]>(
      `SELECT * FROM withdrawal_request WHERE Withdraw_ID = ?`,
      [withdrawId]
    );

    if (!rows.length) {
      return { success: false, error: 'Request not found.' };
    }

    const request = rows[0];
    const currentStatus = (request.Status || '').toLowerCase();
    if (currentStatus === 'cancelled') {
      return { success: false, error: 'This request was cancelled by the client.' };
    }
    if (currentStatus === 'rejected') {
      return { success: false, error: 'This request is already rejected.' };
    }
    if (currentStatus === 'transferred') {
      return { success: false, error: 'This request is already approved.' };
    }

    const login = request.Login;
    const amountValue = toNumber(request.Amount);

    if (!login) {
      return { success: false, error: 'Login is missing for this request.' };
    }
    if (!amountValue || Number.isNaN(amountValue)) {
      return { success: false, error: 'Amount is missing for this request.' };
    }

    const apiUrl = new URL(BALANCE_API_URL);
    apiUrl.searchParams.set('login', login);
    apiUrl.searchParams.set('type', '2');
    apiUrl.searchParams.set('balance', amountValue.toString());
    apiUrl.searchParams.set('comment', 'ADJ_RejectWithdraw');

    let ticket = '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const apiResponse = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!apiResponse.ok) {
      return { success: false, error: 'Refund API call failed.' };
    }

    const payload = (await apiResponse.json()) as
      | { success?: boolean; data?: { ticket?: string } }
      | undefined;

    if (!payload?.success || !payload.data?.ticket) {
      return { success: false, error: 'Refund API did not return a ticket.' };
    }

    ticket = payload.data.ticket;

    await pool.query(
      `
        UPDATE withdrawal_request
        SET Status = 'rejected',
            Comment = ?,
            cancelwithdrawdeal = ?,
            operator = ?,
            currency = 'USD',
            UpdateTime = CURRENT_TIMESTAMP
        WHERE Withdraw_ID = ?
      `,
      [customComment, ticket, operator, withdrawId]
    );

    revalidateWithdrawPages();

    return { success: true, ticket };
  } catch (error) {
    console.error('rejectWithdrawalAction error:', error);
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Refund API timed out.'
        : 'Withdrawal rejection failed on server.';
    return { success: false, error: message };
  }
}
