'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RowDataPacket } from 'mysql2';

export interface DepositRequest {
  id: number;
  deal: string | null;
  login: string | null;
  uploadCode: string | null;
  time: Date | string | null;
  updateTime: Date | string | null;
  status: string | null;
  amount: number | null;
  comment: string | null;
  paymentMethod: string | null;
  usdtType: string | null;
  walletAddress: string | null;
}

interface DepositRequestRow extends RowDataPacket {
  Receipt_ID: number;
  Deal: string | null;
  Login: string | null;
  UploadCode: string | null;
  Time: Date | string | null;
  UpdateTime: Date | string | null;
  Status: string | null;
  Amount: number | string | null;
  Comment: string | null;
  PaymentMethod: string | null;
  USDTType: string | null;
  WalletAddress: string | null;
}

const DEPOSIT_API_URL =
  process.env.DEPOSIT_API_URL || 'http://127.0.0.1:3000/api/trade/balance';

export async function fetchDepositRequests(): Promise<DepositRequest[]> {
  const [rows] = await pool.query<DepositRequestRow[]>(`
    SELECT
      Receipt_ID,
      Deal,
      Login,
      UploadCode,
      Time,
      UpdateTime,
      Status,
      Amount,
      Comment,
      PaymentMethod,
      USDTType,
      WalletAddress
    FROM deposit_receipt_upload
    ORDER BY Time DESC
  `);

  return rows.map((row) => ({
    id: row.Receipt_ID,
    deal: row.Deal,
    login: row.Login,
    uploadCode: row.UploadCode,
    time: row.Time,
    updateTime: row.UpdateTime,
    status: row.Status,
    amount:
      row.Amount === null
        ? null
        : typeof row.Amount === 'number'
        ? row.Amount
        : parseFloat(row.Amount),
    comment: row.Comment,
    paymentMethod: row.PaymentMethod,
    usdtType: row.USDTType,
    walletAddress: row.WalletAddress,
  }));
}

export async function fetchDepositRequestsPaginated(
  page: number,
  pageSize: number
): Promise<{ requests: DepositRequest[]; total: number }> {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const limit = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const offset = (currentPage - 1) * limit;

  const [[countRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM deposit_receipt_upload`
  );
  const total = Number(countRow?.total ?? 0);

  const [rows] = await pool.query<DepositRequestRow[]>(
    `
      SELECT
        Receipt_ID,
        Deal,
        Login,
        UploadCode,
        Time,
        UpdateTime,
        Status,
        Amount,
        Comment,
        PaymentMethod,
        USDTType,
        WalletAddress
      FROM deposit_receipt_upload
      ORDER BY Time DESC
      LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  const requests = rows.map((row) => ({
    id: row.Receipt_ID,
    deal: row.Deal,
    login: row.Login,
    uploadCode: row.UploadCode,
    time: row.Time,
    updateTime: row.UpdateTime,
    status: row.Status,
    amount:
      row.Amount === null
        ? null
        : typeof row.Amount === 'number'
        ? row.Amount
        : parseFloat(row.Amount),
    comment: row.Comment,
    paymentMethod: row.PaymentMethod,
    usdtType: row.USDTType,
    walletAddress: row.WalletAddress,
  }));

  return { requests, total };
}

export async function approveDepositAction(formData: FormData) {
  const receiptId = Number(formData.get('receiptId'));
  const commentInput = (formData.get('comment')?.toString() || '').trim();
  const customComment = commentInput || 'Deposit_BO';

  if (!receiptId) {
    return { success: false, error: 'Invalid receipt id.' };
  }

  const [rows] = await pool.query<DepositRequestRow[]>(
    `SELECT * FROM deposit_receipt_upload WHERE Receipt_ID = ?`,
    [receiptId]
  );

  if (!rows.length) {
    return { success: false, error: 'Request not found.' };
  }

  const request = rows[0];

  if ((request.Status || '').toLowerCase() === 'approved') {
    return { success: false, error: 'This request is already approved.' };
  }

  if ((request.Status || '').toLowerCase() === 'rejected') {
    return { success: false, error: 'This request has been rejected.' };
  }
  if (!request.Login) {
    return { success: false, error: 'Login is missing for this request.' };
  }

  const amountValue =
    request.Amount === null
      ? null
      : typeof request.Amount === 'number'
      ? request.Amount
      : parseFloat(request.Amount);

  if (!amountValue || Number.isNaN(amountValue)) {
    return { success: false, error: 'Amount is missing for this request.' };
  }

  const apiUrl = new URL(DEPOSIT_API_URL);
  apiUrl.searchParams.set('login', request.Login);
  apiUrl.searchParams.set('type', '2');
  apiUrl.searchParams.set('balance', amountValue.toString());
  apiUrl.searchParams.set('comment', customComment);

  let ticket = '';

  try {
    const apiResponse = await fetch(apiUrl.toString(), { cache: 'no-store' });

    if (!apiResponse.ok) {
      return { success: false, error: 'Deposit API call failed.' };
    }

    const payload = (await apiResponse.json()) as
      | { success?: boolean; data?: { ticket?: string } }
      | undefined;

    if (!payload?.success || !payload.data?.ticket) {
      return { success: false, error: 'Deposit API did not return a ticket.' };
    }

    ticket = payload.data.ticket;
  } catch (error) {
    console.error('Deposit API error:', error);
    return { success: false, error: 'Unable to reach deposit API.' };
  }

  await pool.query(
    `
      UPDATE deposit_receipt_upload
      SET Deal = ?, Status = 'approved', Comment = ?, UpdateTime = CURRENT_TIMESTAMP
      WHERE Receipt_ID = ?
    `,
    [ticket, customComment, receiptId]
  );

  revalidatePath('/operations/deposit');

  return { success: true, ticket, comment: customComment };
}

export async function rejectDepositAction(formData: FormData) {
  const receiptId = Number(formData.get('receiptId'));
  const commentInput = (formData.get('comment')?.toString() || '').trim();
  const customComment = commentInput || 'Rejected';

  if (!receiptId) {
    return { success: false, error: 'Invalid receipt id.' };
  }

  const [rows] = await pool.query<DepositRequestRow[]>(
    `SELECT * FROM deposit_receipt_upload WHERE Receipt_ID = ?`,
    [receiptId]
  );

  if (!rows.length) {
    return { success: false, error: 'Request not found.' };
  }

  const request = rows[0];

  if ((request.Status || '').toLowerCase() === 'approved') {
    return { success: false, error: 'This request is already approved.' };
  }

  if ((request.Status || '').toLowerCase() === 'rejected') {
    return { success: false, error: 'This request is already rejected.' };
  }

  await pool.query(
    `
      UPDATE deposit_receipt_upload
      SET Status = 'rejected', Comment = ?, UpdateTime = CURRENT_TIMESTAMP
      WHERE Receipt_ID = ?
    `,
    [customComment, receiptId]
  );

  revalidatePath('/operations/deposit');

  return { success: true };
}
