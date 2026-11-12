import { useState } from 'react';
import { ArrowRight, Flag, Shield, Wallet } from 'lucide-react';
import {
  applyForSelection,
  battingRates,
  decimal,
  money,
  negotiateSalary,
  pitchingRates,
  requestPosting,
} from './game';
import {
  kboEligibility,
  postingReport,
  salaryNegotiationReport,
  selectionReport,
} from './careerRules';
import type { GameState } from './game';

export function SelectionCenter({
  state,
  busy,
  onChange,
}: {
  state: GameState;
  busy: boolean;
  onChange: (s: GameState) => void;
}) {
  const [error, setError] = useState('');
  const apply = (kind: 'national' | 'sangmu') => {
    if (busy) return;
    try {
      onChange(applyForSelection(state, kind));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '지원에 실패했습니다.');
    }
  };
  return (
    <section className="panel opportunity-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">A CHANCE TO REPRESENT</span>
          <h2>대표팀 · 상무 선발</h2>
        </div>
        <Flag size={21} />
      </div>
      <div className="opportunity-grid">
        {(['national', 'sangmu'] as const).map((kind) => {
          const r = selectionReport(state, kind),
            result = state.history.at(-1)?.selections?.find((x) => x.kind === kind);
          return (
            <article className="opportunity-card" key={kind}>
              <h3>{r.label}</h3>
              <strong>
                {result ? Math.round(result.probability * 100) : Math.round(r.probability * 100)}
                <small>% 선발 예상</small>
              </strong>
              <p>
                {kind === 'sangmu'
                  ? '다음 시즌 입대 나이 18~27세의 KBO 미필 선수 대상입니다. 선발되면 원소속 구단을 유지하고 18개월간 상무에서 2군 경기에 출전합니다.'
                  : '이번 시즌 성적과 기량, 포지션 경쟁을 반영합니다. 선발 이력은 매년 커리어에 남습니다.'}
              </p>
              {result ? (
                <div
                  className={`selection-result ${result.selected ? 'success' : ''}`}
                  role="status"
                >
                  <b>{result.selected ? '선발 확정' : '이번 선발 탈락'}</b>
                  <p>{result.reason}</p>
                </div>
              ) : (
                <>
                  <p className="eligibility-reason">
                    {r.reason ||
                      `기량 ${r.rating} · 시즌 평가 ${r.performance}. 시즌당 한 번 심사합니다.`}
                  </p>
                  <button
                    className="button secondary"
                    disabled={busy || !r.eligible}
                    onClick={() => apply(kind)}
                  >
                    {kind === 'national' ? '대표팀 선발 심사' : '상무 지원'}
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
      {state.player.military && state.player.military.status !== 'unserved' && (
        <p className="service-status">
          <Shield size={17} />
          {state.player.military.status === 'scheduled'
            ? '다음 시즌 상무 입대 예정 · 다른 구단 이적 및 연봉 협상은 보류됩니다.'
            : state.player.military.status === 'serving'
              ? `상무 복무 중 · 남은 기간 ${state.player.military.months}개월. 1군 등록일은 적립되지 않습니다.`
              : state.player.military.status === 'completed'
                ? '군 복무를 마쳤습니다. 원소속 구단에서 커리어를 이어갑니다.'
                : '병역 의무 이행 상태입니다.'}
        </p>
      )}
      <p className="fine-print">
        표시 확률과 지원 조건은 게임 내 선발 모형입니다. 실제 대표팀·상무의 공고, 신체검사·서류·실기
        심사를 재현하는 값이 아닙니다.
      </p>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export function SalaryNegotiation({
  state,
  busy,
  onChange,
}: {
  state: GameState;
  busy: boolean;
  onChange: (s: GameState) => void;
}) {
  const offer = state.offers.find((o) => o.id === 'renew');
  const [requested, setRequested] = useState(
    Math.round((state.negotiation?.originalOffer ?? offer?.salary ?? 3000) * 1.1),
  );
  const [error, setError] = useState('');
  if (
    state.phase !== 'offseason' ||
    !offer ||
    ['scheduled', 'serving'].includes(state.player.military?.status ?? '')
  )
    return null;
  const report = salaryNegotiationReport(state, requested),
    h = state.history.at(-1)!;
  const result = state.negotiation;
  const submit = () => {
    if (busy) return;
    try {
      onChange(negotiateSalary(state, requested));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '협상에 실패했습니다.');
    }
  };
  return (
    <section className="panel negotiation-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">THE CLUB MAKES THE FIRST OFFER</span>
          <h2>구단 연봉 제안 · 1회 재협상</h2>
        </div>
        <Wallet size={21} />
      </div>
      <div className="negotiation-body">
        <div className="salary-comparison">
          <div>
            <span>이번 시즌 연봉</span>
            <strong>{money(state.player.salary)}원</strong>
          </div>
          <div>
            <span>구단의 첫 제안</span>
            <strong>{money(result?.originalOffer ?? offer.salary)}원</strong>
          </div>
        </div>
        <p>
          {state.player.role === 'batter'
            ? `${h.batting.g}경기 · 타율 ${decimal(battingRates(h.batting).avg)} · ${h.batting.hr}홈런`
            : `${h.pitching.g}등판 · ERA ${pitchingRates(h.pitching).era.toFixed(2)} · ${h.pitching.so}삼진`}{' '}
          · WAR {h.war.toFixed(1)} · 1군 등록 {h.registrationDays}일을 반영한 제안입니다.
        </p>
        {result ? (
          <div className={`selection-result ${result.accepted ? 'success' : ''}`} role="status">
            <b>{result.accepted ? '재협상 수락' : '재협상 거절'} · 이번 시즌 협상 완료</b>
            <p>
              요청 {money(result.requested)}원 · 수락 확률 {Math.round(result.probability * 100)}%.{' '}
              {result.accepted
                ? '재계약 제안에 합의한 연봉을 반영했습니다.'
                : '구단의 첫 제안이 유지됩니다.'}
            </p>
          </div>
        ) : (
          <>
            <label className="salary-request">
              희망 연봉 (만원)
              <input
                type="number"
                min={report.base + 1}
                max={report.base * 2}
                step="1"
                value={Number.isFinite(requested) ? requested : ''}
                onChange={(e) => setRequested(e.target.value === '' ? NaN : Number(e.target.value))}
                disabled={busy}
              />
            </label>
            <div className="raise-options">
              {[5, 10, 20, 30].map((n) => (
                <button
                  disabled={busy}
                  key={n}
                  onClick={() => setRequested(Math.round(report.base * (1 + n / 100)))}
                >
                  제안 대비 +{n}%
                </button>
              ))}
            </div>
            <div className="negotiation-odds">
              <b>
                {Number.isFinite(requested) ? Math.round(report.probability * 100) : '—'}%{' '}
                <small>수락 예상 확률</small>
              </b>
              <p>
                시즌 평가 {report.performance} · 구단 제안 대비 +
                {Number.isFinite(report.demand) ? report.demand.toFixed(1) : '—'}% · 전년 연봉 대비{' '}
                {Number.isFinite(report.annualRaise)
                  ? `${report.annualRaise >= 0 ? '+' : ''}${report.annualRaise.toFixed(1)}`
                  : '—'}
                %
              </p>
            </div>
            <button
              className="button primary"
              disabled={
                busy ||
                !Number.isSafeInteger(requested) ||
                requested <= report.base ||
                requested > report.base * 2
              }
              onClick={submit}
            >
              연봉 재협상 요청 (1회)
              <ArrowRight size={16} />
            </button>
            <p className="fine-print">
              요청 후 다시 협상할 수 없습니다. 성적이 좋을수록, 추가 인상 요구가 작을수록 수락
              가능성이 높아집니다. 협상 확률은 게임 내 계산값입니다.
            </p>
          </>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export function KboContractRules({
  state,
  busy,
  onChange,
}: {
  state: GameState;
  busy: boolean;
  onChange: (s: GameState) => void;
}) {
  const e = kboEligibility(state),
    [error, setError] = useState('');
  const request = () => {
    if (busy) return;
    try {
      onChange(requestPosting(state));
      setError('');
    } catch (x) {
      setError(x instanceof Error ? x.message : '허가 요청에 실패했습니다.');
    }
  };
  return (
    <section className="panel rules-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FREE AGENCY & POSTING</span>
          <h2>FA · 해외 진출 자격</h2>
        </div>
      </div>
      <div className="opportunity-grid">
        <article className="opportunity-card">
          <h3>{e.repeat ? 'FA 재취득' : '첫 FA 자격'}</h3>
          <strong>
            {e.faService}
            <small>
              {' '}
              / {e.faRequired}시즌 · 잔여 {e.faDays}일
            </small>
          </strong>
          <p>
            첫 자격은 8시즌, 4년제 대학 졸업 입단은 7시즌입니다. FA 계약을 맺은 뒤 재취득에는 다시
            4시즌이 필요합니다. 권리를 행사하지 않으면 자격을 유지합니다.
          </p>
          <span className="badge neutral">{e.fa ? 'FA 계약 선택 가능' : '등록 경력 적립 중'}</span>
        </article>
        <article className="opportunity-card">
          <h3>NPB · MLB 포스팅</h3>
          <strong>
            {e.serviceYears}
            <small> / 7시즌 · 잔여 {e.serviceDays}일</small>
          </strong>
          <p>
            두 리그 모두 7시즌의 KBO 등록 경력과 소속 구단의 승인이 필요합니다. 종합 능력치는 법적
            자격 조건으로 사용하지 않습니다. FA 해외 진출은 포스팅 승인 없이 가능합니다.
          </p>
          {state.postingDecision ? (
            <div className="selection-result" role="status">
              <b>
                {state.postingDecision.approved
                  ? '구단이 포스팅을 승인했습니다.'
                  : '구단이 이번 포스팅 요청을 보류했습니다.'}
              </b>
              <p>
                요청 당시 승인 확률 {Math.round(state.postingDecision.probability * 100)}% · 시즌당
                1회
              </p>
            </div>
          ) : (
            <>
              <p className="eligibility-reason">
                {e.fa
                  ? 'FA 해외 진출 제안을 확인하세요.'
                  : e.posting
                    ? `구단 승인 예상 ${Math.round(postingReport(state).probability * 100)}%`
                    : '7시즌 자격을 채우면 승인 요청이 열립니다.'}
              </p>
              <button
                className="button secondary"
                disabled={busy || state.phase !== 'offseason' || !e.posting || e.fa}
                onClick={request}
              >
                포스팅 허가 요청
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </article>
      </div>
      <p className="fine-print">
        1군 등록 145일 이상은 1시즌, 미달 시즌의 등록일은 합산해 145일당 1시즌으로 계산합니다.
        상무·2군·아마추어 기간은 제외합니다. 국가대표 보상 등록일과 부상 예외 등 세부 특례는
        적용하지 않습니다.
      </p>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
