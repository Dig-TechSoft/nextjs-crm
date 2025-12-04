import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const cwd = process.cwd();
const projectRootGuess = path.resolve(cwd, "..", ".."); // works when running from .next/standalone
const siblingGuess = path.resolve(projectRootGuess, "nextjs-crm-client", "deposit_receipt");
const siblingFromCwd = path.resolve(cwd, "..", "nextjs-crm-client", "deposit_receipt");

// Look in an env-provided directory first, then project-level fallbacks (handles standalone builds).
const RECEIPT_DIRS = [
  process.env.DEPOSIT_RECEIPT_DIR,
  path.join(cwd, "deposit_receipt"),
  path.join(cwd, "public", "deposit_receipt"),
  siblingFromCwd,
  path.join(projectRootGuess, "deposit_receipt"),
  path.join(projectRootGuess, "public", "deposit_receipt"),
  siblingGuess,
]
  .filter(Boolean)
  .map((dir) => path.resolve(dir as string));

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function buildCandidateList(code: string) {
  const sanitized = code.replace(/[^a-zA-Z0-9._-]/g, "");
  const hasExt = path.extname(sanitized);

  if (hasExt) {
    return [path.basename(sanitized)];
  }

  const baseName = path.basename(sanitized);
  return [`${baseName}.png`, `${baseName}.jpg`, `${baseName}.jpeg`, `${baseName}.webp`];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const candidates = buildCandidateList(code);

  for (const baseDir of RECEIPT_DIRS) {
    for (const candidate of candidates) {
      const fullPath = path.join(baseDir, candidate);
      try {
        const file = await fs.readFile(fullPath);
        const ext = path.extname(candidate).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(file, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=300",
          },
        });
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
}
