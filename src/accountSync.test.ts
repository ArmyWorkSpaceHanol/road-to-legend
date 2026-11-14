import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleApi } from '../server/api';
import type { Database } from '../server/api';
import { AccountSync } from './accountSync';
import { accountStorage, captureBundle, emptyBundle, validateBundle } from './cloudSave';
import { makeCareer, SAVE_KEY } from './game';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0000_fast_nemesis.sql', import.meta.url), 'utf8'));
const DB: Database = {
  prepare(sql) {
    let values: unknown[] = [];
    const statement = {
      bind(...args: unknown[]) {
        values = args;
        return statement;
      },
      async first<T>() {
        return (sqlite.prepare(sql).get(...(values as (string | number)[])) || null) as T | null;
      },
      async run() {
        return {
          meta: {
            changes: Number(sqlite.prepare(sql).run(...(values as (string | number)[])).changes),
          },
        };
      },
    };
    return statement;
  },
};
const client =
  (user: string): typeof fetch =>
  async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('origin', 'https://test.chatgpt.site');
    headers.set('oai-authenticated-user-id', user);
    return handleApi(
      new Request(new URL(String(input), 'https://test.chatgpt.site'), { ...init, headers }),
      { DB },
    );
  };
const controllers: AccountSync[] = [];
const sync = (user: string, base = new MemoryStorage(), request = client(user)) => {
  const value = new AccountSync(user, base, request);
  controllers.push(value);
  return value;
};
const raw = (name: string) =>
  JSON.stringify(makeCareer(name, 'pitcher', 'CP', undefined, 7001, undefined, '나의고등학교'));
afterEach(() => {
  controllers.splice(0).forEach((s) => s.stop());
  sqlite.exec('DELETE FROM career_saves');
});
describe('authenticated cloud careers', () => {
  it('calls browser fetch with its global receiver', async () => {
    const request = client('a');
    const mocked = vi.spyOn(globalThis, 'fetch').mockImplementation(function (
      this: unknown,
      ...args
    ) {
      expect(this).toBe(globalThis);
      return request(...args);
    });
    try {
      const account = new AccountSync('a', new MemoryStorage());
      controllers.push(account);
      await account.initialize();
      expect(account.snapshot.status).toBe('saved');
      account.storage.setItem(SAVE_KEY, raw('브라우저 저장'));
      await account.flush();
      expect(account.snapshot.status).toBe('saved');
    } finally {
      mocked.mockRestore();
    }
  });
  it('requires server identity and same-origin writes; ignores client-selected owners', async () => {
    expect(
      (await handleApi(new Request('https://test.chatgpt.site/api/career'), { DB })).status,
    ).toBe(401);
    const response = await handleApi(
      new Request('https://test.chatgpt.site/api/career', {
        method: 'PUT',
        headers: {
          'oai-authenticated-user-id': 'a',
          origin: 'https://evil.test',
          'Content-Type': 'application/json',
        },
        body: '{}',
      }),
      { DB },
    );
    expect(response.status).toBe(403);
    const bundle = { ...emptyBundle(), active: raw('내 선수') };
    expect(
      (
        await client('a')('/api/career', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bundle, revision: 0, userId: 'b' }),
        })
      ).status,
    ).toBe(200);
    expect((await (await client('b')('/api/career')).json()).bundle).toBeNull();
    expect((await (await client('a')('/api/career')).json()).bundle.active).toBe(bundle.active);
  });
  it('compresses saves, rejects malformed games, and protects stale revisions', async () => {
    const request = client('a'),
      bundle = { ...emptyBundle(), active: raw('클로저') };
    const put = (revision: number, value: unknown = bundle) =>
      request('/api/career', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision, bundle: value }),
      });
    const first = await put(0);
    expect(first.status).toBe(200);
    const revision = (await first.json()).revision;
    expect(
      String(sqlite.prepare('SELECT payload FROM career_saves').get()?.payload).startsWith('gz:'),
    ).toBe(true);
    expect((await put(0)).status).toBe(409);
    expect((await put(revision, { ...bundle, active: '{}' })).status).toBe(400);
    expect((await put(revision)).status).toBe(200);
    expect((await put(revision)).status).toBe(409);
    expect((await (await request('/api/career')).json()).revision).toBe(revision + 1);
  });
  it('keeps guests and two accounts separate and restores cloud saves on a new device', async () => {
    const base = new MemoryStorage();
    base.setItem(SAVE_KEY, raw('게스트'));
    const a = sync('a', base),
      b = sync('b', base);
    await a.initialize();
    await b.initialize();
    a.storage.setItem(SAVE_KEY, raw('A 선수'));
    await a.flush();
    b.storage.setItem(SAVE_KEY, raw('B 선수'));
    await b.flush();
    expect(base.getItem(SAVE_KEY)).toContain('게스트');
    expect(a.storage.getItem(SAVE_KEY)).toContain('A 선수');
    expect(b.storage.getItem(SAVE_KEY)).toContain('B 선수');
    const other = sync('a');
    await other.initialize();
    expect(other.storage.getItem(SAVE_KEY)).toBe(a.storage.getItem(SAVE_KEY));
    const changed = { ...captureBundle(other.storage), active: raw('다른 기기') };
    await other.importBundle(changed);
    a.storage.setItem(SAVE_KEY, raw('오래된 기기'));
    await a.flush();
    expect(a.snapshot.status).toBe('conflict');
    expect(a.storage.getItem(SAVE_KEY)).toContain('오래된 기기');
    expect(a.snapshot.remote?.bundle?.active).toContain('다른 기기');
    await a.useDevice(a.snapshot.remote!);
    expect(a.snapshot.status).toBe('saved');
  });
  it('retains pending offline changes across reload and resolves startup conflicts without overwriting', async () => {
    const base = new MemoryStorage();
    let offline = true;
    const request: typeof fetch = (...args) => {
      if (offline) return Promise.reject(new Error('offline'));
      return client('a')(...args);
    };
    const a = sync('a', base, request);
    await a.initialize();
    a.storage.setItem(SAVE_KEY, raw('오프라인'));
    await a.flush();
    expect(a.snapshot.dirty).toBe(true);
    a.stop();
    const other = sync('a');
    await other.initialize();
    other.storage.setItem(SAVE_KEY, raw('클라우드'));
    await other.flush();
    offline = false;
    const reload = sync('a', base, request);
    await reload.initialize();
    expect(reload.snapshot.status).toBe('conflict');
    expect(reload.storage.getItem(SAVE_KEY)).toContain('오프라인');
    reload.useCloud(reload.snapshot.remote!);
    expect(reload.storage.getItem(SAVE_KEY)).toContain('클라우드');
    expect(reload.snapshot.dirty).toBe(false);
  });
  it('retries interrupted requests and keeps changes made while saving', async () => {
    let finish: (() => void) | undefined,
      hold = false;
    const request: typeof fetch = async (...args) => {
      if (hold && args[1]?.method === 'PUT') {
        hold = false;
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      }
      return client('a')(...args);
    };
    const a = sync('a', new MemoryStorage(), request);
    await a.initialize();
    a.storage.setItem(SAVE_KEY, raw('첫 변경'));
    hold = true;
    const pending = a.flush();
    await Promise.resolve();
    a.storage.setItem(SAVE_KEY, raw('두 번째 변경'));
    finish!();
    await pending;
    expect(a.snapshot.dirty).toBe(true);
    await a.flush();
    expect(a.snapshot.dirty).toBe(false);
    expect((await a.read()).bundle?.active).toContain('두 번째 변경');
  });
  it('deletes only the current account and prevents an old client from recreating deleted data', async () => {
    const a = sync('a'),
      b = sync('b');
    await a.initialize();
    await b.initialize();
    a.storage.setItem(SAVE_KEY, raw('A'));
    await a.flush();
    b.storage.setItem(SAVE_KEY, raw('B'));
    await b.flush();
    const old = sync('a');
    await old.initialize();
    await a.deleteData();
    expect(a.storage.getItem(SAVE_KEY)).toBeNull();
    expect((await b.read()).bundle?.active).toContain('B');
    old.storage.setItem(SAVE_KEY, raw('오래된 탭'));
    await old.flush();
    expect(old.snapshot.status).toBe('conflict');
    expect((await old.read()).bundle).toBeNull();
  });
  it('rejects partial bundles and keeps the complete slot collection', () => {
    expect(() => validateBundle({ active: raw('A') })).toThrow();
    const base = new MemoryStorage(),
      storage = accountStorage('a', base, () => {});
    storage.setItem(SAVE_KEY, raw('A'));
    storage.setItem('road-to-legend:slot:3', raw('B'));
    expect(captureBundle(storage).slots['3']).toContain('B');
  });
});
