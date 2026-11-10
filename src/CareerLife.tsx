import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {
  battingRates,
  chooseCareerPath,
  decimal,
  innings,
  LEAGUE_LABELS,
  money,
  needsCareerDecision,
  pitchingRates,
  scoutReport,
  stageLabel,
  TEAMS,
} from './game';
import type { GameState, Season } from './game';

export function LifeOverview({ state, onOpen }: { state: GameState; onOpen: () => void }) {
  const p = state.player,
    latest = state.history.at(-1),
    pending = needsCareerDecision(state);
  return (
    <section className={`life-overview ${pending ? 'life-pending' : ''}`}>
      <div className="life-overview-top">
        <div className="life-stage-icon">
          {p.stage === 'pro' ? <Users size={22} /> : <GraduationCap size={24} />}
        </div>
        <div>
          <span className="eyebrow">YOUR BASEBALL JOURNEY</span>
          <h2>
            {stageLabel(p)}
            <small>
              {p.age}세 · {p.team}
            </small>
          </h2>
        </div>
        <button className="button secondary small" onClick={onOpen}>
          {pending ? '진로 결정하기' : p.stage === 'pro' ? '감독 평가 · 계약' : '나의 진로'}
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="life-metrics">
        {p.stage === 'pro' ? (
          <>
            <div>
              <span>시즌 종료 등록</span>
              <b>{p.squad === 'first' ? '1군' : '2군'}</b>
            </div>
            <div>
              <span>감독 신뢰</span>
              <b>
                {p.trust}
                <small>/ 100</small>
              </b>
            </div>
            <div>
              <span>누적 피로</span>
              <b>
                {p.fatigue}
                <small>/ 100</small>
              </b>
            </div>
            <div>
              <span>최근 1군 등록</span>
              <b>
                {latest?.stage === 'pro' ? latest.registrationDays : 0}
                <small>일</small>
              </b>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>현재 무대</span>
              <b>{LEAGUE_LABELS[p.league]}</b>
            </div>
            <div>
              <span>다음 갈림길</span>
              <b>
                {p.stage === 'highschool'
                  ? '고3 시즌 종료'
                  : p.stage === 'college' && p.grade <= 2
                    ? '대학 2학년 종료'
                    : p.stage === 'college'
                      ? '졸업 드래프트'
                      : '테스트 입단'}
              </b>
            </div>
            <div>
              <span>선호 구단</span>
              <b>{p.preferredTeam}</b>
            </div>
          </>
        )}
      </div>
      {pending && (
        <p className="life-attention">
          <Sparkles size={14} />
          성적표를 받았습니다. 다음 시즌으로 넘어가기 전에 진로를 결정해주세요.
        </p>
      )}
      {latest?.draft && (
        <p className="life-attention">
          <CheckCircle2 size={14} />
          {latest.draft.outcome === 'selected'
            ? `${latest.draft.team} ${latest.draft.round}라운드 지명! 프로 생활은 2군에서 시작합니다.`
            : latest.draft.reason}
        </p>
      )}
    </section>
  );
}

export function CareerPath({
  state,
  onChange,
  onAdvance,
}: {
  state: GameState;
  onChange: (next: GameState) => void;
  onAdvance: () => void;
}) {
  const p = state.player,
    h = state.history.at(-1),
    report = scoutReport(state),
    pending = needsCareerDecision(state);
  const [college, setCollege] = useState(state.collegeTeam);
  const [error, setError] = useState('');
  const choose = (choice: 'draft' | 'college' | 'continue' | 'tryout') => {
    try {
      onChange(chooseCareerPath(state, choice, college));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '진로를 선택하지 못했습니다.');
    }
  };
  return (
    <>
      <section className="path-hero">
        <GraduationCap size={38} strokeWidth={1.4} />
        <div>
          <span className="eyebrow">EVERY PATH IS A CAREER</span>
          <h2>지금의 선택이, 다음 무대를 만듭니다.</h2>
          <p>
            {stageLabel(p)} · {p.team} · {p.age}세
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CAREER CROSSROADS</span>
            <h2>
              {pending
                ? p.stage === 'highschool'
                  ? '프로에 도전할까요, 대학에서 더 성장할까요?'
                  : p.stage === 'college' && p.grade === 2
                    ? '얼리 드래프트에 도전할 시간'
                    : p.stage === 'college'
                      ? '졸업, 그리고 프로를 향한 도전'
                      : '다시 프로의 문을 두드립니다'
                : h?.draft && state.phase === 'offseason'
                  ? '진로 결과'
                  : '나의 다음 단계'}
            </h2>
          </div>
        </div>
        {pending ? (
          <div className="path-choices">
            {p.stage === 'highschool' && (
              <label className="college-select">
                진학할 대학 · 미지명 시 진학할 대학
                <select
                  aria-label="진학 대학"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                >
                  {TEAMS.COLLEGE.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="path-choice-grid">
              <div className="path-option">
                <span className="path-option-icon">
                  <Trophy size={25} />
                </span>
                <h3>
                  {p.stage === 'highschool'
                    ? '고교 드래프트 지원'
                    : p.stage === 'college' && p.grade === 2
                      ? '얼리 드래프트 지원'
                      : p.stage === 'college'
                        ? '졸업 드래프트 지원'
                        : '프로 테스트 입단'}
                </h3>
                <p>
                  기량, 실제 시즌 성적, 출장 기회와 구단의 포지션 수요로 평가합니다. 지명은 보장되지
                  않습니다.
                </p>
                <span className="path-condition">
                  {p.stage === 'highschool'
                    ? '미지명 → 선택한 대학 1학년'
                    : p.stage === 'college' && p.grade === 2
                      ? '미지명 → 대학 3학년 복귀'
                      : '미지명 → 독립리그에서 재도전'}
                </span>
                <button
                  className="button primary"
                  onClick={() => choose(p.stage === 'independent' ? 'tryout' : 'draft')}
                >
                  {p.stage === 'highschool'
                    ? '드래프트 지원 확정'
                    : p.stage === 'college' && p.grade === 2
                      ? '얼리 드래프트 지원 확정'
                      : p.stage === 'college'
                        ? '졸업 드래프트 지원 확정'
                        : '테스트 입단 지원'}
                  <ArrowRight size={15} />
                </button>
              </div>
              {(p.stage === 'highschool' || (p.stage === 'college' && p.grade === 2)) && (
                <div className="path-option">
                  <span className="path-option-icon">
                    <GraduationCap size={27} />
                  </span>
                  <h3>{p.stage === 'highschool' ? '대학 진학' : '대학 잔류'}</h3>
                  <p>
                    {p.stage === 'highschool'
                      ? '대학에서 훈련과 실전을 이어갑니다. 대학 2학년 시즌을 마치면 얼리 드래프트 지원 기회가 열립니다.'
                      : '지원을 미루고 대학 3학년으로 진급합니다. 대학 4학년을 마치면 졸업 드래프트에 도전합니다.'}
                  </p>
                  <span className="path-condition">
                    {p.stage === 'highschool'
                      ? `${college} · 1학년 입학`
                      : `${p.team} · 3학년 진급`}
                  </span>
                  <button
                    className="button secondary"
                    onClick={() => choose(p.stage === 'highschool' ? 'college' : 'continue')}
                  >
                    {p.stage === 'highschool' ? '대학 진학 확정' : '대학 잔류 확정'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
            <p className="fine-print">
              확정 후에는 해당 시즌의 선택을 바꿀 수 없습니다. 드래프트 결과는 이력에 남습니다. 선호
              구단이 지명을 보장하지는 않습니다.
            </p>
          </div>
        ) : (
          <div className="path-result">
            {state.phase === 'offseason' && h?.draft ? (
              <>
                <span
                  className={`draft-result-badge ${h.draft.outcome === 'selected' ? 'selected' : ''}`}
                >
                  {h.draft.outcome === 'selected'
                    ? 'DRAFTED'
                    : h.draft.outcome === 'undrafted'
                      ? 'UNDRAFTED'
                      : 'NEXT CHAPTER'}
                </span>
                <h3>
                  {h.draft.outcome === 'selected'
                    ? `${h.draft.team} · ${h.draft.round}라운드 지명`
                    : h.draft.outcome === 'undrafted'
                      ? '이번 드래프트에서는 이름이 불리지 않았습니다.'
                      : h.draft.outcome === 'college'
                        ? `${state.collegeTeam} 진학 확정`
                        : '대학에 남아 한 번 더 성장합니다.'}
                </h3>
                <p>{h.draft.reason}</p>
                {h.draft.outcome === 'selected' && (
                  <div className="draft-signing">
                    계약금 <b>{money(h.draft.bonus)}원</b> · 프로 첫 연봉 <b>3,000만원</b>
                    <small>
                      다음 시즌 준비를 누르면 계약과 계약금이 한 번 적용됩니다. 2군 합류 후 감독의
                      평가를 받습니다.
                    </small>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="path-option-icon">
                  <GraduationCap size={30} />
                </span>
                <h3>
                  {state.phase === 'retired'
                    ? '기록으로 남은 나의 여정'
                    : state.phase === 'preseason'
                      ? '먼저 올해의 그라운드를 경험하세요.'
                      : `${p.stage === 'highschool' ? '고교' : '대학'} ${p.grade + 1}학년이 기다립니다.`}
                </h3>
                <p>
                  {state.phase === 'preseason'
                    ? '시즌 진행 한 번에 모든 경기를 치릅니다. 성적표를 받은 뒤 해당 학년의 진로를 선택할 수 있습니다.'
                    : state.phase === 'retired'
                      ? '커리어 히스토리에서 모든 시즌을 돌아볼 수 있습니다.'
                      : '이번 시즌의 성적과 성장 기록을 확인하고 다음 학년을 준비하세요.'}
                </p>
              </>
            )}
            {state.phase === 'offseason' && (
              <button className="button primary" onClick={onAdvance}>
                다음 시즌 준비
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SCOUTING REPORT</span>
            <h2>스카우트의 시선</h2>
          </div>
          <span className="profile-position">{p.position}</span>
        </div>
        <div className="scout-metrics">
          {[
            ['포지션 기량', report.readiness],
            ['최근 경기력', report.performance],
            ['출장 노출', report.exposure],
            ['종합 평가', report.score],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                {value}
                <small>/ 100</small>
              </strong>
            </div>
          ))}
        </div>
        <p className="fine-print">
          예상 지명 가능성 {Math.round(report.probability * 100)}%. 마지막 시즌 기록과 현재 기량
          기준이며 구단별 포지션 수요가 최종 결과에 반영됩니다. 아마추어 성적은 프로 통산이나 해외
          진출 경력에 합산하지 않습니다.
        </p>
      </section>
      <section className="path-map">
        <h3>하나로 정해지지 않은 야구 인생</h3>
        <div>
          <span>고교 1 → 2 → 3학년</span>
          <ArrowRight size={14} />
          <span>드래프트 / 대학 진학</span>
          <ArrowRight size={14} />
          <span>대학 2학년 얼리 / 4학년 졸업</span>
          <ArrowRight size={14} />
          <span>프로 2군 ⇄ 1군</span>
        </div>
        <p>
          고교 미지명은 대학으로, 대학 졸업 후 미지명은 독립리그로 이어집니다. 프로에서도 콜업과
          강등은 시즌 안에서 반복될 수 있습니다.
        </p>
      </section>
    </>
  );
}

export function RosterReport({ season }: { season?: Season }) {
  const [expanded, setExpanded] = useState(false);
  if (!season || season.stage !== 'pro') return null;
  const rows = expanded ? season.roster : season.roster.slice(-6);
  return (
    <section className="panel roster-report">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MANAGER'S DECISIONS · {season.year}</span>
          <h2>1·2군 이동과 감독 평가</h2>
        </div>
        <span className="subtle">1군 등록 {season.registrationDays}일</span>
      </div>
      <div className="roster-summary">
        <div>
          <span>1군 출장</span>
          <strong>
            {season.role === 'batter' ? season.batting.g : season.pitching.g}
            <small>경기</small>
          </strong>
        </div>
        <div>
          <span>2군 출장</span>
          <strong>
            {season.role === 'batter' ? season.minorBatting.g : season.minorPitching.g}
            <small>경기</small>
          </strong>
        </div>
        <div>
          <span>콜업 / 강등</span>
          <strong>
            {season.roster.filter((r) => r.decision === 'promoted').length}
            <small>/</small>
            {season.roster.filter((r) => r.decision === 'demoted').length}
          </strong>
        </div>
      </div>
      {season.roster.length ? (
        <>
          <div className="roster-log">
            {rows.map((r) => (
              <article key={r.period} className={`roster-entry ${r.decision}`}>
                <div className="roster-period">
                  <span>{r.period}차</span>
                  <b>{r.squad === 'first' ? '1군' : '2군'}</b>
                </div>
                <div className="roster-entry-main">
                  <div>
                    <span className={`roster-decision ${r.decision}`}>
                      {r.decision === 'promoted'
                        ? '1군 콜업'
                        : r.decision === 'demoted'
                          ? '2군 조정'
                          : r.decision === 'injured'
                            ? '부상 재활'
                            : '등록 유지'}
                    </span>
                    <b>평가 {r.score}</b>
                  </div>
                  <p>{r.reason}</p>
                  <small>
                    {season.role === 'batter'
                      ? `${r.batting.g}경기 · 타율 ${decimal(battingRates(r.batting).avg)} · OPS ${decimal(battingRates(r.batting).ops)}`
                      : `${r.pitching.g}등판 · ${innings(r.pitching.outs)}이닝 · ERA ${pitchingRates(r.pitching).era.toFixed(2)}`}
                    <br />
                    경기력 {r.form} · 신뢰 {r.trust} · 피로 {r.fatigue} · 경쟁 {r.competition}
                    {r.opportunity ? ' · 주전 공백 발생' : ''}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <button className="roster-expand" onClick={() => setExpanded(!expanded)}>
            {expanded ? '최근 평가만 보기' : '24개 평가 구간 전체 보기'}
            <ChevronDown size={14} />
          </button>
        </>
      ) : (
        <p className="fine-print">
          이전 버전의 시즌입니다. 기존 성적은 유지되며 감독의 구간별 평가는 업데이트 이후 시즌부터
          기록됩니다.
        </p>
      )}
      <p className="fine-print">
        <Shield size={12} /> 성적은 각 구간의 실제 소속에만 합산됩니다. 2군 성적은 1군
        수상·통산·해외 진출 경력에 포함되지 않습니다.
      </p>
    </section>
  );
}

export function CareerHealth({ state }: { state: GameState }) {
  if (state.player.stage !== 'pro') return null;
  return (
    <div className="info-bar">
      <Activity size={16} />
      {state.player.injuryDays
        ? `회복까지 약 ${state.player.injuryDays}일. 훈련과 출장이 제한되고 재활 평가를 받습니다.`
        : '현재 큰 부상은 없습니다. 누적 피로와 포지션 경쟁에 따라 출장 기회가 달라집니다.'}
    </div>
  );
}
