import { getDeviceId } from "./deviceId";

const LICENSE_KEY = "ssaem-license-v1";
const LAST_CHECK_KEY = "ssaem-license-last-check-v1";

const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface StoredLicense {
  code: string;
  kind: "personal" | "beta";
  deviceLimit: number | null;
  devices: string[];
  savedAt: string;
}

export type VerifyError =
  | "not_found"
  | "revoked"
  | "device_limit"
  | "network";

export interface VerifyResult {
  ok: boolean;
  reason?: VerifyError;
  message?: string;
  license?: StoredLicense;
}

export function loadLicense(): StoredLicense | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LICENSE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLicense;
  } catch {
    return null;
  }
}

export function saveLicense(license: StoredLicense): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LICENSE_KEY, JSON.stringify(license));
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
}

export function clearLicense(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LICENSE_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
}

export function shouldRecheck(): boolean {
  if (typeof window === "undefined") return false;
  const last = localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return true;
  const t = Date.parse(last);
  if (Number.isNaN(t)) return true;
  return Date.now() - t > RECHECK_INTERVAL_MS;
}

export function isLicensed(): boolean {
  return loadLicense() !== null;
}

export async function verifyAndRegister(code: string): Promise<VerifyResult> {
  const deviceId = getDeviceId();
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, deviceId }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        reason: (data?.reason as VerifyError) ?? "network",
        message:
          data?.message ??
          data?.error ??
          "확인에 실패했어요. 잠시 후 다시 시도해주세요.",
      };
    }
    const license: StoredLicense = {
      code: data.license.code,
      kind: data.license.kind,
      deviceLimit: data.license.deviceLimit,
      devices: data.license.devices,
      savedAt: new Date().toISOString(),
    };
    saveLicense(license);
    return { ok: true, license };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "연결에 문제가 있어요. 잠시 후 다시 시도해주세요.",
    };
  }
}

export async function recheckLicense(): Promise<VerifyResult> {
  const current = loadLicense();
  if (!current) {
    return { ok: false, reason: "not_found", message: "코드가 없어요." };
  }
  const deviceId = getDeviceId();
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: current.code, deviceId, checkOnly: true }),
    });
    const data = await res.json();
    if (res.ok && data?.ok) {
      const updated: StoredLicense = {
        ...current,
        devices: data.license.devices,
        deviceLimit: data.license.deviceLimit,
        kind: data.license.kind,
        savedAt: new Date().toISOString(),
      };
      saveLicense(updated);
      return { ok: true, license: updated };
    }
    if (data?.reason === "revoked" || data?.reason === "not_found") {
      clearLicense();
    }
    return {
      ok: false,
      reason: data?.reason ?? "network",
      message: data?.message ?? "확인 실패",
    };
  } catch {
    return { ok: false, reason: "network", message: "네트워크 오류" };
  }
}

export async function releaseThisDevice(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const current = loadLicense();
  if (!current) return { ok: true };
  const deviceId = getDeviceId();
  try {
    const res = await fetch("/api/license/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: current.code, deviceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error ?? "해제 실패" };
    }
    clearLicense();
    return { ok: true };
  } catch {
    return { ok: false, error: "연결에 문제가 있어요." };
  }
}
