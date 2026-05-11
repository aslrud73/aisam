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

export interface License {
  code: string;
  senderName: string;
  createdAt: string;
  devices: string[];
  status: "active" | "revoked";
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
      };
      await redis().hset(LICENSES_KEY, {
        [code]: JSON.stringify(license),
      });
      return license;
    }
  }
  throw new Error("코드 생성 실패 (중복 충돌)");
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
  const raw = await redis().hget(LICENSES_KEY, code);
  return parse(raw);
}

export async function revokeLicense(code: string): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  license.status = "revoked";
  await redis().hset(LICENSES_KEY, { [code]: JSON.stringify(license) });
  return license;
}

export async function resetDevices(code: string): Promise<License | null> {
  const license = await getLicense(code);
  if (!license) return null;
  license.devices = [];
  await redis().hset(LICENSES_KEY, { [code]: JSON.stringify(license) });
  return license;
}
