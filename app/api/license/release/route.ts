import { NextResponse } from "next/server";
import { effectiveLimit, releaseDevice } from "../../../lib/licenseStore";

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

export async function POST(req: Request) {
  let body: { code?: string; deviceId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const deviceId =
    typeof body.deviceId === "string" ? body.deviceId.trim() : "";

  if (!code || !deviceId) {
    return NextResponse.json(
      { error: "코드와 기기 정보가 필요해요." },
      { status: 400 },
    );
  }

  try {
    const license = await releaseDevice(code, deviceId);
    if (!license) {
      return NextResponse.json(
        { error: "코드를 찾을 수 없어요." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      license: {
        code: license.code,
        kind: license.kind ?? "personal",
        deviceLimit: effectiveLimit(license),
        devices: license.devices,
      },
    });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        { error: "저장소 연결이 안 되어 있어요. 잠시 후 다시 시도해주세요." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "해제 실패" },
      { status: 500 },
    );
  }
}
