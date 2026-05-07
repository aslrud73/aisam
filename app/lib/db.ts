"use client";

import Dexie, { type Table } from "dexie";

export const DB_VERSION = 1;

export interface DailyEntryRecord {
  id?: number;
  kidId: string;
  kidName: string;
  className?: string;
  date: string; // YYYY-MM-DD
  todayActivity?: string;
  meal?: string;
  mood?: string;
  nap?: string;
  memo?: string;
  docType: "alrim" | "gwanchal";
  text: string;
  provider: string;
  model: string;
  createdAt: number;
}

export interface ParentReplyRecord {
  id?: number;
  date: string;
  childName?: string;
  parentMessage: string;
  extraContext?: string;
  situation: string;
  tone: string;
  draft: string;
  provider: string;
  model: string;
  createdAt: number;
}

export interface PlayJournalRecord {
  id?: number;
  date: string;
  activityName?: string;
  ageBand: string;
  note?: string;
  theme: string;
  flow: string;
  reactions: string;
  learning: string;
  support: string;
  extension: string;
  homeConnection: string;
  photoThumbs?: string[]; // base64 thumbs (optional, may be omitted on export)
  provider: string;
  model: string;
  createdAt: number;
}

class OneulDB extends Dexie {
  dailyEntries!: Table<DailyEntryRecord, number>;
  parentReplies!: Table<ParentReplyRecord, number>;
  playJournals!: Table<PlayJournalRecord, number>;

  constructor() {
    super("oneul-db");
    this.version(1).stores({
      dailyEntries: "++id, kidId, kidName, date, docType, createdAt, [kidId+date]",
      parentReplies: "++id, date, childName, situation, createdAt",
      playJournals: "++id, date, ageBand, createdAt",
    });
  }
}

let _db: OneulDB | null = null;

function getDb(): OneulDB {
  if (typeof window === "undefined") {
    throw new Error("DB is only available in the browser");
  }
  if (!_db) _db = new OneulDB();
  return _db;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function saveDailyEntries(records: DailyEntryRecord[]) {
  if (!records.length) return;
  await getDb().dailyEntries.bulkAdd(records);
}

export async function saveParentReply(record: ParentReplyRecord) {
  await getDb().parentReplies.add(record);
}

export async function savePlayJournal(record: PlayJournalRecord) {
  await getDb().playJournals.add(record);
}

export interface KidSummary {
  kidId: string;
  kidName: string;
  entryCount: number;
  firstDate: string;
  lastDate: string;
}

export async function listKidsWithEntries(): Promise<KidSummary[]> {
  const all = await getDb().dailyEntries.toArray();
  const map = new Map<string, KidSummary>();
  for (const e of all) {
    const existing = map.get(e.kidId);
    if (!existing) {
      map.set(e.kidId, {
        kidId: e.kidId,
        kidName: e.kidName,
        entryCount: 1,
        firstDate: e.date,
        lastDate: e.date,
      });
    } else {
      existing.entryCount += 1;
      if (e.date < existing.firstDate) existing.firstDate = e.date;
      if (e.date > existing.lastDate) existing.lastDate = e.date;
      // Keep the most recent name (in case it changed)
      existing.kidName = e.kidName;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.kidName.localeCompare(b.kidName, "ko"),
  );
}

export async function getEntriesInRange(
  kidId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyEntryRecord[]> {
  return getDb()
    .dailyEntries.where("[kidId+date]")
    .between([kidId, fromDate], [kidId, toDate], true, true)
    .toArray();
}

export interface CountSummary {
  dailyEntries: number;
  parentReplies: number;
  playJournals: number;
}

export async function getCounts(): Promise<CountSummary> {
  const db = getDb();
  const [d, p, pl] = await Promise.all([
    db.dailyEntries.count(),
    db.parentReplies.count(),
    db.playJournals.count(),
  ]);
  return { dailyEntries: d, parentReplies: p, playJournals: pl };
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    [db.dailyEntries, db.parentReplies, db.playJournals],
    async () => {
      await Promise.all([
        db.dailyEntries.clear(),
        db.parentReplies.clear(),
        db.playJournals.clear(),
      ]);
    },
  );
}

export interface BackupBundle {
  appVersion: number;
  exportedAt: string;
  localState: {
    notification: string | null;
  };
  dbContent: {
    dailyEntries: DailyEntryRecord[];
    parentReplies: ParentReplyRecord[];
    playJournals: PlayJournalRecord[];
  };
}

const NOTIFICATION_KEY = "oneul-notification-state-v2";

export async function exportAll(opts?: {
  includePhotos?: boolean;
}): Promise<BackupBundle> {
  const db = getDb();
  const [dailyEntries, parentReplies, playJournalsRaw] = await Promise.all([
    db.dailyEntries.toArray(),
    db.parentReplies.toArray(),
    db.playJournals.toArray(),
  ]);
  const playJournals = opts?.includePhotos
    ? playJournalsRaw
    : playJournalsRaw.map(({ photoThumbs: _omit, ...rest }) => rest);

  return {
    appVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    localState: {
      notification: localStorage.getItem(NOTIFICATION_KEY),
    },
    dbContent: {
      dailyEntries,
      parentReplies,
      playJournals,
    },
  };
}

export async function importAll(
  bundle: unknown,
  mode: "replace" | "merge",
): Promise<{ imported: CountSummary }> {
  if (!bundle || typeof bundle !== "object") {
    throw new Error("백업 파일이 올바르지 않습니다.");
  }
  const b = bundle as Partial<BackupBundle>;
  if (b.appVersion !== DB_VERSION) {
    throw new Error(
      `지원하지 않는 백업 버전입니다 (파일: ${b.appVersion ?? "?"}, 앱: ${DB_VERSION})`,
    );
  }
  const db = getDb();

  const cleanRecord = <T extends { id?: number }>(r: T): Omit<T, "id"> => {
    const { id: _omit, ...rest } = r;
    return rest;
  };

  const dailyEntries = (b.dbContent?.dailyEntries ?? []).map(cleanRecord);
  const parentReplies = (b.dbContent?.parentReplies ?? []).map(cleanRecord);
  const playJournals = (b.dbContent?.playJournals ?? []).map(cleanRecord);

  await db.transaction(
    "rw",
    [db.dailyEntries, db.parentReplies, db.playJournals],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.dailyEntries.clear(),
          db.parentReplies.clear(),
          db.playJournals.clear(),
        ]);
      }
      await db.dailyEntries.bulkAdd(dailyEntries as DailyEntryRecord[]);
      await db.parentReplies.bulkAdd(parentReplies as ParentReplyRecord[]);
      await db.playJournals.bulkAdd(playJournals as PlayJournalRecord[]);
    },
  );

  if (mode === "replace" && b.localState?.notification != null) {
    localStorage.setItem(NOTIFICATION_KEY, b.localState.notification);
  }

  return {
    imported: {
      dailyEntries: dailyEntries.length,
      parentReplies: parentReplies.length,
      playJournals: playJournals.length,
    },
  };
}

export function downloadBundle(bundle: BackupBundle, filename?: string) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = bundle.exportedAt.replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = filename || `oneul-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
