import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const RECEIPT_DIR =
  process.env.DEPOSIT_RECEIPT_DIR ||
  'D:\\Workspace\\nextjs-crm-client\\deposit_receipt';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function buildCandidateList(code: string) {
  const sanitized = code.replace(/[^a-zA-Z0-9._-]/g, '');
  const hasExt = path.extname(sanitized);

  if (hasExt) {
    return [path.basename(sanitized)];
  }

  const baseName = path.basename(sanitized);
  return [`${baseName}.png`, `${baseName}.jpg`, `${baseName}.jpeg`, `${baseName}.webp`];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const candidates = buildCandidateList(code);

  for (const candidate of candidates) {
    const fullPath = path.join(RECEIPT_DIR, candidate);
    try {
      const file = await fs.readFile(fullPath);
      const ext = path.extname(candidate).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(file, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=300',
        },
      });
    } catch (error) {
      // Try next candidate
      continue;
    }
  }

  return NextResponse.json(
    { error: 'Receipt not found' },
    { status: 404 }
  );
}
