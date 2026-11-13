import { parseSave, SAVE_KEY } from './game';
import type { GameState } from './game';

export const SLOT_IDS = ['1', '2', '3'] as const;
export type SlotId = (typeof SLOT_IDS)[number];
export const ACTIVE_SLOT_KEY = 'road-to-legend:active-slot';
export const BACKUPS_KEY = 'road-to-legend:backups:v1';
export const slotKey = (id: SlotId) => `road-to-legend:slot:${id}`;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type CareerBackup = { raw: string; savedAt: number; reason: string };
export function activeSlot(storage: StorageLike): SlotId | null {
  const value = storage.getItem(ACTIVE_SLOT_KEY);
  return SLOT_IDS.includes(value as SlotId) ? (value as SlotId) : null;
}
export function readBackups(storage: StorageLike): CareerBackup[] {
  const raw = storage.getItem(BACKUPS_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.length > 2 ||
    data.some(
      (b) =>
        !b ||
        typeof b.raw !== 'string' ||
        b.raw.length > 3_000_000 ||
        !Number.isFinite(b.savedAt) ||
        typeof b.reason !== 'string',
    )
  )
    throw new Error('자동 백업 목록을 읽지 못했습니다. 현재 커리어를 파일로 백업해주세요.');
  return data;
}
export function backupRaw(storage: StorageLike, raw: string | null, reason: string) {
  if (!raw) return;
  if (raw.length > 3_000_000)
    throw new Error(
      '기존 저장 파일이 너무 큽니다. 원본을 파일로 보관한 뒤 새 커리어를 시작해주세요.',
    );
  // Keep even a damaged active save available for downloading; never silently discard it.
  const previous = readBackups(storage);
  if (previous[0]?.raw === raw) return;
  const next = [
    { raw, savedAt: Date.now(), reason },
    ...previous.filter((b) => b.raw !== raw),
  ].slice(0, 2);
  storage.setItem(BACKUPS_KEY, JSON.stringify(next));
}
export function persistCareer(storage: StorageLike, state: GameState) {
  const raw = JSON.stringify(state);
  storage.setItem(SAVE_KEY, raw);
  const slot = activeSlot(storage);
  if (slot) storage.setItem(slotKey(slot), raw);
}
export function replaceCareer(
  storage: StorageLike,
  state: GameState,
  reason: string,
  slot: SlotId | null = null,
) {
  const raw = JSON.stringify(parseSave(JSON.stringify(state)));
  const previousRaw = storage.getItem(SAVE_KEY);
  const previousSlot = activeSlot(storage);
  backupRaw(storage, previousRaw, reason);
  // Detach the outgoing slot before replacing the active save, so later autosaves cannot overwrite it.
  try {
    storage.removeItem(ACTIVE_SLOT_KEY);
    storage.setItem(SAVE_KEY, raw);
    if (slot) storage.setItem(ACTIVE_SLOT_KEY, slot);
  } catch (error) {
    // A backup may fit even when the incoming save does not. Restore both the old save and its slot.
    let restored = false;
    try {
      if (previousRaw === null) storage.removeItem(SAVE_KEY);
      else if (storage.getItem(SAVE_KEY) !== previousRaw) storage.setItem(SAVE_KEY, previousRaw);
      restored = true;
    } catch {
      /* The outgoing original is also protected by the backup above. */
    }
    try {
      if (restored && previousSlot) storage.setItem(ACTIVE_SLOT_KEY, previousSlot);
      else storage.removeItem(ACTIVE_SLOT_KEY);
    } catch {
      /* Leave the caller in the failure path rather than claiming a successful load. */
    }
    throw error;
  }
}
export function saveToSlot(storage: StorageLike, id: SlotId, state: GameState) {
  const raw = JSON.stringify(parseSave(JSON.stringify(state)));
  const previous = storage.getItem(slotKey(id));
  if (previous && previous !== raw) backupRaw(storage, previous, `${id}번 슬롯 교체 전`);
  storage.setItem(slotKey(id), raw);
  storage.setItem(ACTIVE_SLOT_KEY, id);
}
