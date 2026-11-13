import { describe, expect, it } from 'vitest';
import {
  ACTIVE_SLOT_KEY,
  BACKUPS_KEY,
  activeSlot,
  backupRaw,
  persistCareer,
  readBackups,
  replaceCareer,
  saveToSlot,
  slotKey,
} from './careerStorage';
import { makeCareer, parseSave, playSeason, SAVE_KEY } from './game';

class MemoryStorage {
  data = new Map<string, string>();
  fail = '';
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.fail) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
describe('career slots and replacement backups', () => {
  it('keeps existing single-save careers and autosaves only the active slot', () => {
    const storage = new MemoryStorage(),
      batter = makeCareer('타자'),
      pitcher = makeCareer('투수', 'pitcher');
    persistCareer(storage, batter);
    expect(activeSlot(storage)).toBeNull();
    expect(parseSave(storage.getItem(SAVE_KEY)!)).toEqual(batter);
    saveToSlot(storage, '1', batter);
    const played = playSeason(batter);
    persistCareer(storage, played);
    expect(parseSave(storage.getItem(slotKey('1'))!)).toEqual(played);
    replaceCareer(storage, pitcher, '새 선수');
    saveToSlot(storage, '2', pitcher);
    persistCareer(storage, playSeason(pitcher));
    expect(parseSave(storage.getItem(slotKey('1'))!)).toEqual(played);
    expect(parseSave(storage.getItem(slotKey('2'))!).player.role).toBe('pitcher');
    expect(activeSlot(storage)).toBe('2');
  });
  it('preserves outgoing careers and isolates subsequent saves after loading a slot', () => {
    const storage = new MemoryStorage(),
      one = makeCareer('첫 선수'),
      two = makeCareer('둘째 선수');
    persistCareer(storage, one);
    saveToSlot(storage, '1', one);
    replaceCareer(storage, two, '새 커리어');
    saveToSlot(storage, '2', two);
    replaceCareer(storage, one, '슬롯 불러오기', '1');
    persistCareer(storage, playSeason(one));
    expect(readBackups(storage)[0].raw).toBe(JSON.stringify(two));
    expect(storage.getItem(slotKey('2'))).toBe(JSON.stringify(two));
    expect(activeSlot(storage)).toBe('1');
  });
  it('backs up overwritten slots and keeps the latest two distinct snapshots', () => {
    const storage = new MemoryStorage(),
      one = makeCareer('첫 선수'),
      two = makeCareer('둘째 선수'),
      three = makeCareer('셋째 선수');
    saveToSlot(storage, '1', one);
    saveToSlot(storage, '1', two);
    expect(parseSave(readBackups(storage)[0].raw).player.name).toBe('첫 선수');
    backupRaw(storage, JSON.stringify(two), '교체');
    backupRaw(storage, JSON.stringify(two), '중복');
    expect(readBackups(storage)).toHaveLength(2);
    backupRaw(storage, JSON.stringify(three), '교체');
    expect(readBackups(storage).map((b) => parseSave(b.raw).player.name)).toEqual([
      '셋째 선수',
      '둘째 선수',
    ]);
  });
  it('does not replace a career if backup storage fails', () => {
    const storage = new MemoryStorage(),
      one = makeCareer('보호할 선수');
    persistCareer(storage, one);
    saveToSlot(storage, '1', one);
    storage.fail = BACKUPS_KEY;
    expect(() => replaceCareer(storage, makeCareer('새 선수'), '새 커리어')).toThrow();
    expect(storage.getItem(SAVE_KEY)).toBe(JSON.stringify(one));
    expect(activeSlot(storage)).toBe('1');
    expect(storage.getItem(slotKey('1'))).toBe(JSON.stringify(one));
  });
  it('keeps the active slot attached when the replacement save itself cannot be written', () => {
    const storage = new MemoryStorage(),
      original = makeCareer('보호할 선수');
    persistCareer(storage, original);
    saveToSlot(storage, '1', original);
    storage.fail = SAVE_KEY;
    expect(() => replaceCareer(storage, makeCareer('새 선수'), '교체')).toThrow();
    expect(storage.getItem(SAVE_KEY)).toBe(JSON.stringify(original));
    expect(activeSlot(storage)).toBe('1');
    expect(parseSave(readBackups(storage)[0].raw)).toEqual(original);
  });
  it('preserves damaged save originals and blocks replacement if the backup list is unreadable', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{"broken":true}');
    replaceCareer(storage, makeCareer('복구 선수'), '복구 전');
    expect(readBackups(storage)[0].raw).toBe('{"broken":true}');
    const before = storage.getItem(SAVE_KEY);
    storage.setItem(BACKUPS_KEY, 'invalid');
    expect(() => replaceCareer(storage, makeCareer('교체 선수'), '교체')).toThrow();
    expect(storage.getItem(SAVE_KEY)).toBe(before);
  });
  it('validates incoming data before writing backups or changing the active pointer', () => {
    const storage = new MemoryStorage(),
      one = makeCareer('기존 선수');
    persistCareer(storage, one);
    storage.setItem(ACTIVE_SLOT_KEY, '1');
    const before = [...storage.data];
    expect(() => replaceCareer(storage, { ...one, year: -1 }, '잘못된 파일')).toThrow();
    expect([...storage.data]).toEqual(before);
  });
});
