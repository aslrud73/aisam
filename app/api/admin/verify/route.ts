import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET 환경변수가 설정되어 있지 않습니다." },
      { status: 500 },
    );
  }

  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  if (mismatch !== 0) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
