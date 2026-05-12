import { NextResponse } from "next/server";
import {
  effectiveLimit,
  registerDevice,
  getLicense,
} from "../../../lib/licenseStore";

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
  let body: { code?: string; deviceId?: string; checkOnly?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const deviceId =
    typeof body.deviceId === "string" ? body.deviceId.trim() : "";

  if (!code) {
    return NextResponse.json(
      { error: "코드를 입력해주세요." },
      { status: 400 },
    );
  }
  if (!deviceId) {
    return NextResponse.json(
      { error: "기기 정보가 없어요." },
      { status: 400 },
    );
  }

  try {
    if (body.checkOnly) {
      const license = await getLicense(code);
      if (!license) {
        return NextResponse.json(
          { ok: false, reason: "not_found", message: "코드를 찾을 수 없어요." },
          { status: 404 },
        );
      }
      if (license.status === "revoked") {
        return NextResponse.json(
          { ok: false, reason: "revoked", message: "정지된 코드예요." },
          { status: 403 },
        );
      }
      const registered = license.devices.includes(deviceId);
      return NextResponse.json({
        ok: registered,
        reason: registered ? undefined : "device_not_registered",
        license: {
          code: license.code,
          kind: license.kind ?? "personal",
          deviceLimit: effectiveLimit(license),
          devices: license.devices,
        },
      });
    }

    const result = await registerDevice(code, deviceId);
    if (!result.ok) {
      const messages = {
        not_found: "코드를 찾을 수 없어요. 다시 확인해주세요.",
        revoked: "정지된 코드예요. 별쫑님에게 문의해주세요.",
        device_limit:
          "이 코드는 등록 가능한 기기 수를 초과했어요. 옛 기기에서 해제하거나 별쫑님에게 문의해주세요.",
      } as const;
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          message: messages[result.reason],
        },
        { status: result.reason === "not_found" ? 404 : 403 },
      );
    }
    return NextResponse.json({
      ok: true,
      alreadyRegistered: result.alreadyRegistered,
      license: {
        code: result.license.code,
        kind: result.license.kind ?? "personal",
        deviceLimit: effectiveLimit(result.license),
        devices: result.license.devices,
      },
    });
  } catch (e) {
    if (isStorageError(e)) {
      return NextResponse.json(
        {
          error:
            "저장소 연결이 안 되어 있어요. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "검증 실패" },
      { status: 500 },
    );
  }
}
