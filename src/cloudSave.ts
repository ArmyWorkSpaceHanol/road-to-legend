import { z } from 'zod';
import { parseSave, SAVE_KEY } from './game';
import { ACTIVE_SLOT_KEY, BACKUPS_KEY, SLOT_IDS, slotKey } from './careerStorage';
import type { StorageLike } from './careerStorage';

export const CAREER_KEYS = [SAVE_KEY, ACTIVE_SLOT_KEY, BACKUPS_KEY, ...SLOT_IDS.map(slotKey)];
const rawCareer = z
  .string()
  .max(3_000_000)
  .refine((raw) => {
    try {
      parseSave(raw);
      return true;
    } catch {
      return false;
    }
  }, '유효한 커리어 파일이 아닙니다.');
const bundleSchema = z
  .object({
    version: z.literal(1),
    active: rawCareer.nullable(),
    activeSlot: z.enum(SLOT_IDS).nullable(),
    slots: z
      .object({ '1': rawCareer.nullable(), '2': rawCareer.nullable(), '3': rawCareer.nullable() })
      .strict(),
    backups: z
      .array(
        z
          .object({
            raw: z.string().max(3_000_000),
            savedAt: z.number().finite().nonnegative(),
            reason: z.string().max(200),
          })
          .strict(),
      )
      .max(2),
  })
  .strict();
export type SaveBundle = z.infer<typeof bundleSchema>;
export type CloudRecord = { bundle: SaveBundle | null; revision: number; updatedAt: number | null };
export function validateBundle(value: unknown): SaveBundle {
  return bundleSchema.parse(value);
}
export function captureBundle(storage: StorageLike): SaveBundle {
  return validateBundle({
    version: 1,
    active: storage.getItem(SAVE_KEY),
    activeSlot: storage.getItem(ACTIVE_SLOT_KEY),
    slots: Object.fromEntries(SLOT_IDS.map((id) => [id, storage.getItem(slotKey(id))])),
    backups: JSON.parse(storage.getItem(BACKUPS_KEY) || '[]'),
  });
}
export const emptyBundle = (): SaveBundle => ({
  version: 1,
  active: null,
  activeSlot: null,
  slots: { '1': null, '2': null, '3': null },
  backups: [],
});
export function applyBundle(storage: StorageLike, value: SaveBundle) {
  const bundle = validateBundle(value);
  const entries: [string, string | null][] = [
    [SAVE_KEY, bundle.active],
    [ACTIVE_SLOT_KEY, bundle.activeSlot],
    [BACKUPS_KEY, JSON.stringify(bundle.backups)],
    ...SLOT_IDS.map((id): [string, string | null] => [slotKey(id), bundle.slots[id]]),
  ];
  const previous = entries.map(([key]) => [key, storage.getItem(key)] as const);
  try {
    for (const [key, raw] of entries) {
      if (raw === null) storage.removeItem(key);
      else storage.setItem(key, raw);
    }
  } catch (error) {
    for (const [key, raw] of previous) {
      try {
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
      } catch {
        /* Original bundle remains available in the cloud. */
      }
    }
    throw error;
  }
}
export function accountStorage(
  userId: string,
  base: StorageLike,
  changed: () => void,
): StorageLike {
  const prefix = `road-to-legend:account:${encodeURIComponent(userId)}:`;
  return {
    getItem: (key) => base.getItem(prefix + key),
    setItem(key, value) {
      if (base.getItem(prefix + key) === value) return;
      base.setItem(prefix + key, value);
      changed();
    },
    removeItem(key) {
      if (base.getItem(prefix + key) === null) return;
      base.removeItem(prefix + key);
      changed();
    },
  };
}
export function exportBundle(bundle: SaveBundle) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `road-to-legend-account-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const SERVICE_URL = 'https://road-to-legend-clubhouse.smp6340.chatgpt.site';
export const hostedService = () => location.hostname.endsWith('.chatgpt.site');
