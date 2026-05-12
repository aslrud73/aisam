import { NextResponse } from "next/server";
import { checkAdmin } from "../../../../lib/adminAuth";
import {
  deleteLicense,
  reactivateLicense,
  resetDevices,
  revokeLicense,
} from "../../../../lib/licenseStore";

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

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } },
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const code = decodeURIComponent(params.code);
  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const action = body.action;
  try {
    let license;
    if (action === "revoke") {
      license = await revokeLicense(code);
    } else if (action === "reactivate") {
      license = await reactivateLicense(code);
    } else if (action === "resetDevices") {
      license = await resetDevices(code);
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 작업이에요." },
        { status: 400 },
      );
    }
    if (!license) {
      return NextResponse.json(
        { error: "코드를 찾을 수 없어요." },
        { status: 404 },
      );
    }
    return NextResponse.json({ license });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        { error: "저장소 연결이 안 되어 있어요." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "작업 실패" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { code: string } },
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const code = decodeURIComponent(params.code);
  try {
    const removed = await deleteLicense(code);
    if (!removed) {
      return NextResponse.json(
        { error: "코드를 찾을 수 없어요." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        { error: "저장소 연결이 안 되어 있어요." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
