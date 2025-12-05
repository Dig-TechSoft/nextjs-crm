import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type DepositRow = {
  Receipt_ID: number;
  Login: string | null;
  Amount: number | string | null;
  Status: string | null;
};

type WithdrawRow = {
  Withdraw_ID: number;
  Login: string | null;
  Amount: number | string | null;
  Status: string | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET() {
  try {
    const [depositRows] = await pool.query<RowDataPacket[]>(
      `
        SELECT Receipt_ID, Login, Amount, Status
        FROM deposit_receipt_upload
        WHERE LOWER(Status) = 'pending'
        ORDER BY UpdateTime DESC
        LIMIT 3
      `
    );

    const [depositCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM deposit_receipt_upload WHERE LOWER(Status) = 'pending'`
    );

    const [withdrawRows] = await pool.query<RowDataPacket[]>(
      `
        SELECT Withdraw_ID, Login, Amount, Status
        FROM withdrawal_request
        WHERE LOWER(Status) = 'pending'
        ORDER BY UpdateTime DESC
        LIMIT 3
      `
    );

    const [withdrawCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM withdrawal_request WHERE LOWER(Status) = 'pending'`
    );

    const deposits = (depositRows as DepositRow[]).map((row) => ({
      id: row.Receipt_ID,
      login: row.Login || "-",
      amount: toNumber(row.Amount),
    }));

    const withdrawals = (withdrawRows as WithdrawRow[]).map((row) => ({
      id: row.Withdraw_ID,
      login: row.Login || "-",
      amount: toNumber(row.Amount),
    }));

    return NextResponse.json({
      deposits: {
        total: Number((depositCountRows as RowDataPacket[])[0]?.total ?? 0),
        items: deposits,
      },
      withdrawals: {
        total: Number((withdrawCountRows as RowDataPacket[])[0]?.total ?? 0),
        items: withdrawals,
      },
    });
  } catch (error) {
    console.error("dashboard pending API error:", error);
    return NextResponse.json(
      { error: "Failed to load pending summaries." },
      { status: 500 }
    );
  }
}
