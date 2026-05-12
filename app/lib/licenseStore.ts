import { Redis } from "@upstash/redis";

const LICENSES_KEY = "ssaem:licenses";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

let _redis: Redis | null = null;
function redis(): Redis {
  if (_redis) return _redis;
  _redis = Redis.fromEnv();
  return _redis;
}

function part(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

export function generateCode(): string {
  return `SSAEM-${part(4)}-${part(4)}`;
}

export type LicenseKind = "personal" | "beta";

export interface License {
  code: string;
  senderName: string;
  createdAt: string;
  devices: string[];
  status: "active" | "revoked";
  kind?: LicenseKind;
  deviceLimit?: number | null;
}

const DEFAULT_PERSONAL_LIMIT = 2;

export function effectiveLimit(license: License): number | null {
  if (license.deviceLimit === null) return null;
  if (typeof license.deviceLimit === "number") return license.deviceLimit;
  return DEFAULT_PERSONAL_LIMIT;
}

function parse(raw: unknown): License | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as License;
    } catch {
      return null;
    }
  }
  return raw as License;
}

function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

async function save(license: License): Promise<void> {
  await redis().hset(LICENSES_KEY, {
    [license.code]: JSON.stringify(license),
  });
}

export async function createLicense(senderName: string): Promise<License> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const exists = await redis().hexists(LICENSES_KEY, code);
    if (!exists) {
      const license: License = {
        code,
        senderName,
        createdAt: new Date().toISOString(),
        devices: [],
        status: "active",
        kind: "personal",
        deviceLimit: DEFAULT_PERSONAL_LIMIT,
      };
      await save(license);
      return license;
    }
  }
  throw new Error("코드 생성 실패 (중복 충돌)");
}

export async function createBetaLicense(
  code: string,
  senderName: string,
): Promise<License> {
  const normalized = normalizeCode(code);
  if (!normalized || normalized.length < 4) {
    throw new Error("코드는 4자 이상이어야 해요.");
  }
  const exists = await redis().hexists(LICENSES_KEY, normalized);
  if (exists) {
    throw new Error("이미 존재하는 코드예요.");
  }
  const license: License = {
    code: normalized,
    senderName,
    createdAt: new Date().toISOString(),
    devices: [],
    status: "active",
    kind: "beta",
    deviceLimit: null,
  };
  await save(license);
  return license;
}

export async function listLicenses(): Promise<License[]> {
  const all = await redis().hgetall<Record<string, unknown>>(LICENSES_KEY);
  if (!all) return [];
  return Object.values(all)
    .map(parse)
    .filter((x): x is License => x !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLicense(code: string): Promise<License | null> {
  const raw = await redis().hget(LICENSES_KEY, normalizeCode(code));
  return parse(raw);
}

export async function revokeLicense(code: string): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  license.status = "revoked";
  await save(license);
  return license;
}

export async function reactivateLicense(code: string): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  license.status = "active";
  await save(license);
  return license;
}

export async function resetDevices(code: string): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  license.devices = [];
  await save(license);
  return license;
}

export type RegisterResult =
  | { ok: true; license: License; alreadyRegistered: boolean }
  | { ok: false; reason: "not_found" | "revoked" | "device_limit" };

export async function registerDevice(
  code: string,
  deviceId: string,
): Promise<RegisterResult> {
  const license = await getLicense(code);
  if (!license) return { ok: false, reason: "not_found" };
  if (license.status === "revoked") return { ok: false, reason: "revoked" };
  if (license.devices.includes(deviceId)) {
    return { ok: true, license, alreadyRegistered: true };
  }
  const limit = effectiveLimit(license);
  if (limit !== null && license.devices.length >= limit) {
    return { ok: false, reason: "device_limit" };
  }
  license.devices.push(deviceId);
  await save(license);
  return { ok: true, license, alreadyRegistered: false };
}

export async function releaseDevice(
  code: string,
  deviceId: string,
): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  const idx = license.devices.indexOf(deviceId);
  if (idx === -1) return license;
  license.devices.splice(idx, 1);
  await save(license);
  return license;
}
