'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function getTotalUsers() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(Login) as count 
      FROM mt5_users 
      WHERE \`group\` NOT LIKE 'managers%' 
      AND \`group\` NOT LIKE 'demo%'
    `);

        return rows[0].count;
    } catch (error) {
        console.error('Failed to fetch total users:', error);
        return 0;
    }
}
