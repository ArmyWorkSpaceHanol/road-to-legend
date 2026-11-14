import { accountStorage, applyBundle, captureBundle, emptyBundle } from './cloudSave';
import type { CloudRecord, SaveBundle } from './cloudSave';
import type { StorageLike } from './careerStorage';

export type SyncStatus = 'loading' | 'saved' | 'saving' | 'offline' | 'conflict';
export type SyncSnapshot = {
  status: SyncStatus;
  message: string;
  updatedAt: number | null;
  remote: CloudRecord | null;
  dirty: boolean;
};
export class AccountSync {
  readonly storage: StorageLike;
  private revision = 0;
  private silent = false;
  private generation = 0;
  private stopped = false;
  private running = false;
  private epoch = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<() => void>();
  private metaKey: string;
  snapshot: SyncSnapshot = {
    status: 'loading',
    message: '',
    updatedAt: null,
    remote: null,
    dirty: false,
  };
  constructor(
    readonly userId: string,
    private base: StorageLike,
    private request: typeof fetch = (...args) => globalThis.fetch(...args),
  ) {
    this.metaKey = `road-to-legend:sync:${encodeURIComponent(userId)}`;
    let meta;
    try {
      meta = JSON.parse(base.getItem(this.metaKey) || '{}');
    } catch {
      meta = { dirty: true };
    }
    this.revision = Number.isSafeInteger(meta.revision) ? meta.revision : 0;
    this.snapshot.dirty = meta.dirty === true;
    this.storage = accountStorage(userId, base, () => {
      if (this.silent || this.stopped) return;
      this.generation++;
      this.set({
        dirty: true,
        status: this.snapshot.status === 'conflict' ? 'conflict' : 'saving',
      });
      this.remember();
      this.schedule();
    });
    if (
      (!Number.isSafeInteger(meta.revision) || typeof meta.dirty !== 'boolean') &&
      this.storage.getItem('road-to-legend:v1')
    )
      this.snapshot.dirty = true;
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private set(patch: Partial<SyncSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private remember() {
    this.base.setItem(
      this.metaKey,
      JSON.stringify({ revision: this.revision, dirty: this.snapshot.dirty }),
    );
  }
  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush();
    }, 700);
  }
  async read(): Promise<CloudRecord> {
    const response = await this.request('/api/career', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? '로그인이 만료되었습니다. 다시 로그인해주세요.'
          : '클라우드에 연결하지 못했습니다. 기기 저장은 유지됩니다.',
      );
    return response.json();
  }
  async initialize() {
    this.stopped = false;
    const epoch = ++this.epoch;
    try {
      const remote = await this.read();
      if (this.stopped || epoch !== this.epoch) return;
      if (this.snapshot.dirty && remote.revision !== this.revision) {
        this.set({
          status: 'conflict',
          remote,
          message: '이 기기와 클라우드 양쪽에 변경된 기록이 있습니다.',
        });
        return;
      }
      if (this.snapshot.dirty) {
        this.set({ status: 'saving', updatedAt: remote.updatedAt });
        this.schedule();
      } else this.useCloud(remote);
    } catch (error) {
      if (!this.stopped && epoch === this.epoch)
        this.set({
          status: 'offline',
          message: String(error instanceof Error ? error.message : error),
        });
    }
  }
  useCloud(remote: CloudRecord) {
    this.silent = true;
    try {
      applyBundle(this.storage, remote.bundle || emptyBundle());
      this.revision = remote.revision;
      this.set({
        status: 'saved',
        updatedAt: remote.updatedAt,
        dirty: false,
        message: '',
        remote: null,
      });
      this.remember();
    } finally {
      this.silent = false;
    }
  }
  async useDevice(remote: CloudRecord) {
    this.revision = remote.revision;
    this.set({ remote: null, dirty: true, status: 'saving', message: '' });
    this.remember();
    await this.flush();
  }
  async importBundle(bundle: SaveBundle) {
    this.silent = true;
    try {
      applyBundle(this.storage, bundle);
    } finally {
      this.silent = false;
    }
    this.generation++;
    this.set({ dirty: true, status: 'saving' });
    this.remember();
    await this.flush();
  }
  async flush() {
    if (this.stopped || this.running || this.snapshot.status === 'conflict' || !this.snapshot.dirty)
      return;
    this.running = true;
    const generation = this.generation;
    this.set({ status: 'saving', message: '' });
    try {
      const response = await this.request('/api/career', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: this.revision, bundle: captureBundle(this.storage) }),
      });
      if (response.status === 409) {
        this.set({
          status: 'conflict',
          remote: await this.read(),
          message: '다른 기기에서 저장한 기록이 있습니다. 이어갈 기록을 선택해주세요.',
        });
        return;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          response.status === 401
            ? '로그인이 만료되었습니다. 다시 로그인해주세요.'
            : error.error || '클라우드 저장에 실패했습니다. 기기의 기록은 유지됩니다.',
        );
      }
      const result = await response.json();
      this.revision = result.revision;
      this.set({
        status: 'saved',
        updatedAt: result.updatedAt,
        dirty: generation !== this.generation,
      });
      this.remember();
    } catch (error) {
      this.set({
        status: 'offline',
        message: error instanceof Error ? error.message : '연결을 확인해주세요.',
      });
    } finally {
      this.running = false;
      if (this.snapshot.dirty && this.snapshot.status === 'saved') this.schedule();
    }
  }
  async checkForUpdates() {
    if (this.running || this.stopped) return;
    try {
      const remote = await this.read();
      if (remote.revision !== this.revision)
        this.set({
          status: 'conflict',
          remote,
          message: '다른 탭이나 기기에서 저장 내용이 바뀌었습니다. 이어갈 기록을 선택해주세요.',
        });
      else if (this.snapshot.dirty) await this.flush();
    } catch {
      if (this.snapshot.dirty)
        this.set({ status: 'offline', message: '연결이 복구되면 다시 저장합니다.' });
    }
  }
  async deleteData() {
    if (this.running) throw new Error('저장이 끝난 뒤 다시 시도해주세요.');
    const response = await this.request('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    if (!response.ok) throw new Error('삭제하지 못했습니다. 연결 상태를 확인해주세요.');
    this.useCloud({ bundle: null, revision: 0, updatedAt: null });
  }
  stop() {
    this.stopped = true;
    this.epoch++;
    clearTimeout(this.timer);
  }
}
