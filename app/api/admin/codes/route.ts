import { NextResponse } from "next/server";
import { checkAdmin } from "../../../lib/adminAuth";
import { createLicense, listLicenses } from "../../../lib/licenseStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isStorageError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("UPSTASH_REDIS") ||
    msg.includes("KV_REST_API") ||
    msg.includes("fromEnv") ||
    msg.toLowerCase().includes("missing")
  );
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const licenses = await listLicenses();
    return NextResponse.json({ licenses });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        {
          error:
            "저장소 연결이 안 되어 있어요. Vercel에서 Upstash Redis(또는 KV)를 프로젝트에 연결해주세요.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { senderName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const senderName =
    typeof body.senderName === "string" ? body.senderName.trim() : "";
  if (!senderName) {
    return NextResponse.json(
      { error: "송금자명을 입력해주세요." },
      { status: 400 },
    );
  }
  try {
    const license = await createLicense(senderName);
    return NextResponse.json({ license });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        {
          error:
            "저장소 연결이 안 되어 있어요. Vercel에서 Upstash Redis(또는 KV)를 프로젝트에 연결해주세요.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "코드 생성 실패" },
      { status: 500 },
    );
  }
}
