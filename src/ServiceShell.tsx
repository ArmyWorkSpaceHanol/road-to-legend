import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import {
  Check,
  Cloud,
  CloudOff,
  Download,
  Fingerprint,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import ServiceLanding from './ServiceLanding';
import { AccountSync } from './accountSync';
import type { SyncSnapshot } from './accountSync';
import {
  captureBundle,
  exportBundle,
  hostedService,
  SERVICE_URL,
  validateBundle,
} from './cloudSave';
import { parseSave, SAVE_KEY } from './game';

type User = { id: string; name: string; email: string | null };
const App = lazy(() => import('./App'));
const statusLabels = {
  loading: '저장소 연결 중',
  saved: '클라우드 저장됨',
  saving: '클라우드 저장 중',
  offline: '기기에 저장됨',
  conflict: '저장 기록 확인',
};
function safeHasCareer() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}
function timestamp(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
    : '아직 저장된 기록이 없습니다';
}
function careerName(raw: string | null | undefined) {
  try {
    const s = raw ? parseSave(raw) : null;
    return s ? `${s.player.name} · ${s.year}년 · ${s.player.position}` : '새로운 커리어';
  } catch {
    return '기록 확인 필요';
  }
}

function ServiceDialog({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="service-dialog"
      aria-labelledby="account-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <span className="service-kicker">MY CLUBHOUSE ACCOUNT</span>
        <button className="icon-button" aria-label="계정 창 닫기" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 id="account-title">{title}</h2>
      </header>
      {children}
    </dialog>
  );
}
export class ServiceErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="service-loading">
        <ShieldCheck size={40} />
        <h1>클럽하우스를 다시 열어주세요.</h1>
        <p>화면을 불러오지 못했습니다. 저장된 커리어는 삭제되지 않았습니다.</p>
        <button className="primary-button" onClick={() => location.reload()}>
          새로고침
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}

function GuestExperience({ warning = '' }: { warning?: string }) {
  const [started, setStarted] = useState(safeHasCareer),
    [account, setAccount] = useState(false);
  const login = hostedService() ? '/signin-with-chatgpt?return_to=%2F' : SERVICE_URL;
  return (
    <>
      {started ? (
        <App
          accountControl={
            <button className="account-chip" onClick={() => setAccount(true)}>
              <Fingerprint size={17} />
              <span>게스트 · 로그인</span>
            </button>
          }
        />
      ) : (
        <ServiceLanding onStart={() => setStarted(true)} />
      )}
      {warning && (
        <div className="service-connection-note" role="status">
          <CloudOff size={16} />
          {warning}
        </div>
      )}
      {account && (
        <ServiceDialog title="어디서든, 나의 커리어" onClose={() => setAccount(false)}>
          <div className="account-welcome-icon">
            <Cloud size={32} />
          </div>
          <p>ChatGPT 계정으로 로그인하고 커리어와 보관함을 클라우드에 저장하세요.</p>
          <p className="account-note">
            현재 플레이는 이 브라우저에 저장됩니다. 다른 주소의 서비스로 이동할 때는 커리어
            보관함에서 저장 파일을 내려받아 로그인 후 불러오세요.
          </p>
          <a className="service-primary" href={login} target="_top">
            <Fingerprint size={18} />
            ChatGPT로 로그인
            <LogOut size={17} />
          </a>
          <div className="account-trust">
            <ShieldCheck size={15} />
            비밀번호를 따로 만들거나 보관하지 않습니다.
          </div>
        </ServiceDialog>
      )}
    </>
  );
}

function AccountExperience({ user }: { user: User }) {
  const [sync] = useState(() => new AccountSync(user.id, localStorage));
  const snapshot = useSyncExternalStore(sync.subscribe, sync.getSnapshot);
  const [started, setStarted] = useState(false),
    [account, setAccount] = useState(false),
    [mount, setMount] = useState(0);
  const [message, setMessage] = useState(''),
    [working, setWorking] = useState(false),
    [deleteText, setDeleteText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void sync.initialize();
    const reconnect = () => {
      void sync.checkForUpdates();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') reconnect();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (sync.snapshot.dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('online', reconnect);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('beforeunload', beforeUnload);
    // Revision checks also protect edits from a second tab on the same device.
    const storageChanged = (event: StorageEvent) => {
      if (event.key?.startsWith(`road-to-legend:sync:${encodeURIComponent(user.id)}`)) reconnect();
    };
    window.addEventListener('storage', storageChanged);
    return () => {
      sync.stop();
      window.removeEventListener('online', reconnect);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('storage', storageChanged);
    };
  }, [sync, user.id]);
  const act = async (task: () => Promise<void>) => {
    setWorking(true);
    setMessage('');
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '작업을 완료하지 못했습니다.');
    } finally {
      setWorking(false);
    }
  };
  const replace = async (cloud: boolean) => {
    const remote = snapshot.remote;
    if (!remote) return;
    if (cloud) {
      exportBundle(captureBundle(sync.storage));
      sync.useCloud(remote);
    } else await sync.useDevice(remote);
    setMount((n) => n + 1);
  };
  if (snapshot.status === 'loading') return <Loading text="나의 클럽하우스를 불러오는 중" />;
  const hasCareer = !!sync.storage.getItem(SAVE_KEY);
  const openAccount = () => setAccount(true);
  const control = (
    <button
      className={`account-chip ${snapshot.status}`}
      onClick={openAccount}
      aria-label={`계정 관리 · ${statusLabels[snapshot.status]}`}
    >
      <SyncIcon snapshot={snapshot} />
      <span>{snapshot.status === 'saved' ? user.name : statusLabels[snapshot.status]}</span>
    </button>
  );
  return (
    <>
      {started || hasCareer ? (
        <App key={mount} storage={sync.storage} accountControl={control} />
      ) : (
        <ServiceLanding
          name={user.name}
          onAccount={openAccount}
          onStart={() => {
            if (safeHasCareer()) setAccount(true);
            else setStarted(true);
          }}
        />
      )}
      {(snapshot.status === 'offline' || snapshot.status === 'conflict') && (
        <button className="sync-alert" onClick={openAccount}>
          <SyncIcon snapshot={snapshot} />
          <span>
            {snapshot.status === 'conflict'
              ? '다른 기기의 기록이 있습니다. 이어갈 기록을 선택해주세요.'
              : snapshot.message || '기기에 저장했습니다. 클라우드 연결을 확인해주세요.'}
          </span>
          <RefreshCw size={15} />
        </button>
      )}
      {(account || snapshot.status === 'conflict') && (
        <ServiceDialog
          title="나의 계정과 저장"
          onClose={() => {
            if (snapshot.status !== 'conflict') setAccount(false);
          }}
        >
          <div className="account-identity">
            <span className="account-avatar">{user.name.slice(0, 1)}</span>
            <div>
              <b>{user.name}</b>
              <span>{user.email || 'ChatGPT 계정으로 로그인됨'}</span>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className={`cloud-status-card ${snapshot.status}`} role="status">
            <SyncIcon snapshot={snapshot} />
            <div>
              <b>{statusLabels[snapshot.status]}</b>
              <span>{timestamp(snapshot.updatedAt)}</span>
              {snapshot.message && <p>{snapshot.message}</p>}
            </div>
          </div>
          {snapshot.status === 'conflict' && snapshot.remote ? (
            <div className="conflict-choices">
              <p>
                두 기록을 합칠 수 없습니다. 클라우드 기록을 선택하면 현재 기기 기록은 파일로 먼저
                내려받습니다.
              </p>
              <button disabled={working} onClick={() => void act(() => replace(true))}>
                <Cloud size={20} />
                <div>
                  <b>클라우드 기록 이어하기</b>
                  <span>{careerName(snapshot.remote.bundle?.active)}</span>
                  <small>{timestamp(snapshot.remote.updatedAt)}</small>
                </div>
              </button>
              <button disabled={working} onClick={() => void act(() => replace(false))}>
                <Upload size={20} />
                <div>
                  <b>이 기기 기록을 클라우드에 저장</b>
                  <span>{careerName(sync.storage.getItem(SAVE_KEY))}</span>
                </div>
              </button>
            </div>
          ) : (
            <>
              {snapshot.dirty && (
                <button
                  className="service-primary"
                  disabled={working || snapshot.status === 'saving'}
                  onClick={() => void act(() => sync.flush())}
                >
                  <RefreshCw size={17} />
                  클라우드 저장 다시 시도
                </button>
              )}
              <div className="account-actions">
                <button
                  disabled={working}
                  onClick={() => {
                    try {
                      exportBundle(captureBundle(sync.storage));
                    } catch {
                      setMessage(
                        '저장 파일을 내보내지 못했습니다. 커리어 보관함에서 원본을 내려받아주세요.',
                      );
                    }
                  }}
                >
                  <Download size={18} />
                  계정 기록 전체 내보내기
                </button>
                <button
                  disabled={working || snapshot.status === 'saving'}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={18} />
                  저장 파일 가져오기
                </button>
              </div>
              <input
                ref={fileRef}
                className="sr-only"
                type="file"
                accept=".json,application/json"
                aria-label="계정 저장 파일 선택"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  void act(async () => {
                    if (file.size > 8_000_000) throw new Error('8MB 이하의 파일을 선택해주세요.');
                    const raw = await file.text();
                    let bundle;
                    try {
                      bundle = validateBundle(JSON.parse(raw));
                    } catch {
                      const state = parseSave(raw);
                      bundle = captureBundle(sync.storage);
                      bundle.active = JSON.stringify(state);
                      bundle.activeSlot = null;
                    }
                    if (
                      hasCareer &&
                      !confirm('현재 계정 기록을 파일로 보관하고 가져온 기록으로 바꿀까요?')
                    )
                      return;
                    exportBundle(captureBundle(sync.storage));
                    await sync.importBundle(bundle);
                    setMount((n) => n + 1);
                    setStarted(true);
                    setMessage('저장 파일을 가져왔습니다.');
                  });
                }}
              />
              {safeHasCareer() && (
                <div className="guest-migration">
                  <b>이 브라우저의 게스트 커리어가 있습니다</b>
                  <span>{careerName(localStorage.getItem(SAVE_KEY))}</span>
                  <button
                    disabled={working || snapshot.status === 'saving'}
                    onClick={() =>
                      void act(async () => {
                        if (
                          hasCareer &&
                          !confirm('현재 계정 기록을 파일로 보관하고 게스트 커리어를 가져올까요?')
                        )
                          return;
                        const guest = captureBundle(localStorage);
                        exportBundle(captureBundle(sync.storage));
                        await sync.importBundle(guest);
                        setMount((n) => n + 1);
                        setStarted(true);
                        setAccount(false);
                      })
                    }
                  >
                    게스트 기록을 계정으로 가져오기
                  </button>
                  {!hasCareer && (
                    <button
                      onClick={() => {
                        setStarted(true);
                        setAccount(false);
                      }}
                    >
                      새 커리어로 시작
                    </button>
                  )}
                  <small>게스트 원본은 이 브라우저에 그대로 남습니다.</small>
                </div>
              )}
              <a className="account-reauth" href="/signin-with-chatgpt?return_to=%2F" target="_top">
                로그인 연결 다시 확인
              </a>
              <p className="account-note">
                커리어·슬롯 3개·자동 백업을 계정별로 저장합니다. 네트워크가 끊겨도 기기에 보관하고
                연결 후 다시 저장합니다.
              </p>
              <details className="account-delete">
                <summary>계정의 게임 데이터 삭제</summary>
                <p>
                  클라우드와 이 기기의 계정 기록을 삭제합니다. ChatGPT 계정과 게스트 기록은
                  유지됩니다.
                </p>
                <label>
                  삭제하려면 DELETE를 입력하세요
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <button
                  disabled={deleteText !== 'DELETE' || working || snapshot.status === 'saving'}
                  onClick={() =>
                    void act(async () => {
                      await sync.deleteData();
                      setMount((n) => n + 1);
                      setStarted(false);
                      setDeleteText('');
                      setAccount(false);
                    })
                  }
                >
                  게임 데이터 영구 삭제
                </button>
              </details>
            </>
          )}
          {message && (
            <p className="account-message" role="status">
              {message}
            </p>
          )}
          <div className="account-session">
            <span>인증: ChatGPT · 저장: 계정 전용</span>
            {snapshot.dirty ? (
              <span>클라우드 저장 후 로그아웃할 수 있습니다.</span>
            ) : (
              <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
                <LogOut size={15} />
                로그아웃
              </a>
            )}
          </div>
        </ServiceDialog>
      )}
    </>
  );
}
function SyncIcon({ snapshot }: { snapshot: SyncSnapshot }) {
  return snapshot.status === 'saving' || snapshot.status === 'loading' ? (
    <LoaderCircle size={17} className="spin" />
  ) : snapshot.status === 'offline' ? (
    <CloudOff size={17} />
  ) : snapshot.status === 'conflict' ? (
    <RefreshCw size={17} />
  ) : (
    <Check size={17} />
  );
}
function Loading({ text }: { text: string }) {
  return (
    <main className="service-loading" aria-busy="true">
      <span className="loading-monogram">R/L</span>
      <LoaderCircle className="spin" />
      <p role="status">{text}</p>
    </main>
  );
}
export default function ServiceShell() {
  const [session, setSession] = useState<{ loading: boolean; user: User | null; error?: string }>({
    loading: hostedService(),
    user: null,
  });
  useEffect(() => {
    if (!hostedService()) return;
    const abort = new AbortController();
    fetch('/api/session', { credentials: 'same-origin', cache: 'no-store', signal: abort.signal })
      .then(async (res) => {
        if (res.status === 401) {
          setSession({ loading: false, user: null });
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSession({ loading: false, user: data.user });
      })
      .catch((e) => {
        if (e.name !== 'AbortError')
          setSession({
            loading: false,
            user: null,
            error: '계정 연결을 확인하지 못했습니다. 게스트로 플레이할 수 있습니다.',
          });
      });
    return () => abort.abort();
  }, []);
  return (
    <Suspense fallback={<Loading text="플레이 준비 중" />}>
      {session.loading ? (
        <Loading text="클럽하우스에 입장하는 중" />
      ) : session.user ? (
        <AccountExperience user={session.user} />
      ) : (
        <GuestExperience warning={session.error} />
      )}
    </Suspense>
  );
}
