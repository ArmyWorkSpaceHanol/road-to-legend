import { useState } from 'react';
import { Download, FolderOpen, Save } from 'lucide-react';
import { activeSlot, readBackups, saveToSlot, SLOT_IDS, slotKey } from './careerStorage';
import type { SlotId } from './careerStorage';
import { parseSave, stageLabel } from './game';
import type { GameState } from './game';

function readCareer(raw: string | null) {
  if (!raw) return null;
  try {
    return parseSave(raw);
  } catch {
    return null;
  }
}
function download(raw: string, name: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
export default function CareerLibrary({
  state,
  disabled,
  canSave = true,
  onLoad,
}: {
  state: GameState;
  disabled: boolean;
  canSave?: boolean;
  onLoad: (state: GameState, slot: SlotId | null) => void;
}) {
  const [revision, refresh] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  let active: SlotId | null = null;
  let slots: { id: SlotId; raw: string | null; career: GameState | null }[] = [];
  let backups: ReturnType<typeof readBackups> = [];
  let readError = '';
  try {
    active = activeSlot(localStorage);
    slots = SLOT_IDS.map((id) => {
      const raw = localStorage.getItem(slotKey(id));
      return { id, raw, career: readCareer(raw) };
    });
    backups = readBackups(localStorage);
  } catch (e) {
    readError = e instanceof Error ? e.message : '보관함을 읽지 못했습니다.';
  }
  const store = (id: SlotId) => {
    try {
      saveToSlot(localStorage, id, state);
      refresh(revision + 1);
      setError('');
      setMessage(`${id}번 슬롯에 저장했습니다. 앞으로 진행 내용도 자동 저장됩니다.`);
    } catch {
      setError('슬롯 저장에 실패했습니다. 저장 공간을 확인하고 현재 커리어를 파일로 백업해주세요.');
    }
  };
  const restore = (career: GameState, id: SlotId | null) => {
    try {
      onLoad(career, id);
      refresh(revision + 1);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기에 실패했습니다.');
    }
  };
  return (
    <>
      <section className="panel library-intro">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR CAREER COLLECTION</span>
            <h2>세 개의 슬롯, 서로 다른 야구 인생</h2>
          </div>
          <FolderOpen size={24} />
        </div>
        <p>
          {canSave ? (
            <>
              현재 선수: <b>{state.player.name}</b> ·{' '}
              {active ? `${active}번 슬롯에 자동 저장 중` : '현재 커리어에 자동 저장 중'}. 슬롯을
              불러와도 다른 슬롯의 선수는 보존됩니다.
            </>
          ) : (
            '저장된 슬롯이나 자동 백업을 불러와 커리어를 이어가세요.'
          )}
        </p>
        <button
          className="button secondary"
          disabled={!canSave}
          onClick={() =>
            download(
              JSON.stringify(state),
              `road-to-legend-${state.player.name}-${state.year}.json`,
            )
          }
        >
          <Download size={16} />
          현재 커리어 파일 백업
        </button>
      </section>
      {(error || readError) && (
        <p className="alert" role="alert">
          {error || readError}
        </p>
      )}
      {message && (
        <p className="info-bar" role="status">
          {message}
        </p>
      )}
      <div className="save-slot-grid">
        {slots.map(({ id, raw, career }) => (
          <section className="panel save-slot" key={id} aria-label={`${id}번 커리어 슬롯`}>
            <div className="panel-heading">
              <h2>{id}번 슬롯</h2>
              {active === id && <span className="badge neutral">플레이 중</span>}
            </div>
            <div className="save-slot-body">
              {career ? (
                <>
                  <h3>{career.player.name}</h3>
                  <p>
                    {career.player.role === 'batter' ? '타자' : '투수'} · {career.year}년 ·{' '}
                    {stageLabel(career.player)}
                  </p>
                  <p>
                    {career.player.team} · {career.history.length}시즌
                  </p>
                </>
              ) : (
                <p>
                  {raw
                    ? '저장 파일을 읽지 못했습니다. 원본을 내려받아 보관해주세요.'
                    : '아직 저장된 커리어가 없습니다.'}
                </p>
              )}
              <button
                className="button primary"
                disabled={disabled || !canSave}
                onClick={() => store(id)}
              >
                <Save size={16} />
                {active === id ? '현재 진행 저장' : `${id}번 슬롯에 현재 선수 저장`}
              </button>
              {career && (
                <button
                  className="button secondary"
                  disabled={disabled || active === id}
                  onClick={() => restore(career, id)}
                >
                  {id}번 슬롯 불러오기
                </button>
              )}
              {raw && (
                <button
                  className="button secondary"
                  onClick={() => download(raw, `road-to-legend-slot-${id}.json`)}
                >
                  슬롯 파일 내려받기
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">BEFORE YOUR NEXT BEGINNING</span>
            <h2>교체 전 자동 백업</h2>
          </div>
        </div>
        <p className="record-scope">
          새 커리어·파일·슬롯을 불러오기 전 현재 선수를 보관합니다. 최근 2개를 유지하며, 오래 보관할
          기록은 파일로 내려받으세요.
        </p>
        {backups.length ? (
          backups.map((backup, i) => {
            const career = readCareer(backup.raw);
            return (
              <article className="backup-row" key={`${backup.savedAt}-${i}`}>
                <div>
                  <h3>{career ? `${career.player.name} · ${career.year}년` : '복구용 원본'}</h3>
                  <p>
                    {backup.reason} · {new Date(backup.savedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                {career && (
                  <button
                    className="button secondary"
                    disabled={disabled}
                    onClick={() => restore(career, null)}
                  >
                    {i + 1}번 자동 백업 복원
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={() => download(backup.raw, `road-to-legend-auto-backup-${i + 1}.json`)}
                >
                  <Download size={16} />
                  백업 내려받기
                </button>
              </article>
            );
          })
        ) : (
          <p className="record-scope">
            아직 자동 백업이 없습니다. 현재 커리어를 교체하기 전에 생성됩니다.
          </p>
        )}
      </section>
    </>
  );
}
