import { useMemo } from 'react';
import { ArrowRight, Check, Flag, Sparkles, Target, TrendingUp } from 'lucide-react';
import {
  battingRates,
  decimal,
  innings,
  pitchingRates,
  positionRating,
  scoutReport,
  seasonCheckpoint,
  seasonEventDetails,
  seasonGoals,
  SKILL_LABELS,
  PITCH_SKILL_LABELS,
  stageLabel,
} from './game';
import type { EventChoice, GameState, GoalId, Plan, Skills } from './game';

export function coachingFeedback(state: GameState) {
  const h = state.history.at(-1);
  const skills = state.player.skills;
  const labels = state.player.role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS;
  const weakest = (Object.keys(skills) as (keyof Skills)[]).reduce((a, b) =>
    skills[a] < skills[b] ? a : b,
  );
  const focus: Record<keyof Skills, Plan> = {
    contact: 'contact',
    power: 'power',
    speed: 'speed',
    fielding: 'fielding',
    discipline: 'mental',
    mental: 'mental',
  };
  if (!h)
    return {
      title: '첫 시즌은 기본기부터',
      detail: `${labels[weakest]} ${skills[weakest]}가 현재 가장 낮습니다. 집중 훈련으로 강점을 넓혀보세요.`,
      plan: focus[weakest],
    };
  if (state.phase === 'retired')
    return {
      title: '끝까지 써 내려간 나의 야구 인생',
      detail: `${state.history.length}시즌의 여정을 마쳤습니다. 커리어 히스토리에서 목표와 선택, 수상 기록을 돌아보고 백업으로 보관하세요.`,
      plan: 'balanced' as Plan,
    };
  if (state.player.stage !== 'pro') {
    const report = scoutReport(state);
    return {
      title: `스카우트 평가 ${report.score}점`,
      detail: `포지션 기량 ${report.readiness} · 최근 경기력 ${report.performance} · 출장 노출 ${report.exposure}. ${labels[weakest]} ${skills[weakest]}를 보완해보세요. 드래프트는 구단 수요와 확률도 반영됩니다.`,
      plan: focus[weakest],
    };
  }
  const last = h.roster.at(-1);
  if (!last)
    return {
      title: '새 시즌의 경쟁을 준비하세요',
      detail: `${labels[weakest]} ${skills[weakest]}를 보완하고 다음 시즌의 감독 평가를 확인하세요.`,
      plan: focus[weakest],
    };
  if (state.player.fatigue >= 70 || state.player.injuryDays > 0)
    return {
      title: '지금은 회복이 우선입니다',
      detail: `현재 피로 ${state.player.fatigue} · 남은 부상 ${state.player.injuryDays}일. 누적 피로 88 이상이나 장기 부상은 2군 조정으로 이어집니다. 회복 훈련과 컨디셔닝을 고려하세요.`,
      plan: 'recovery' as Plan,
    };
  if (state.player.squad === 'second')
    return {
      title: '1군 콜업까지 무엇이 남았을까요?',
      detail: `마지막 평가 ${last.score}/64 · 경기력 ${last.form}/56. 두 번째 평가부터 두 기준을 충족해야 합니다. 현재 포지션 기량 ${Math.round(positionRating(skills, state.player.role, state.player.position))}, 신뢰 ${last.trust}, 경쟁 ${last.competition}이며 부상·피로도 함께 반영됩니다.`,
      plan: focus[weakest],
    };
  return {
    title: '1군에서의 자리를 이어가세요',
    detail: `1군 등록 ${h.registrationDays}일 · 마지막 평가 ${last.score} · 신뢰 ${last.trust}. ${labels[weakest]} ${skills[weakest]}를 보완하고, 두 구간 연속 부진과 피로 누적을 관리하세요.`,
    plan: focus[weakest],
  };
}

export function GoalPicker({
  state,
  onSelect,
  onAuto,
  disabled = false,
}: {
  disabled?: boolean;
  state: GameState;
  onSelect: (id: GoalId) => void;
  onAuto: (auto: boolean) => void;
}) {
  const locked = disabled || state.phase !== 'preseason' || !!state.seasonEvent;
  return (
    <section className="panel season-goals">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ONE SEASON, ONE GOAL</span>
          <h2>이번 시즌, 이루고 싶은 한 가지</h2>
        </div>
        <Flag size={20} />
      </div>
      <div className="goal-grid" role="group" aria-label="시즌 목표">
        {seasonGoals(state).map((goal) => (
          <button
            key={goal.id}
            className={`goal-card ${(state.seasonGoal ?? 'growth') === goal.id ? 'selected' : ''}`}
            disabled={locked}
            aria-pressed={(state.seasonGoal ?? 'growth') === goal.id}
            onClick={() => onSelect(goal.id)}
          >
            <span className="goal-card-title">
              <Target size={17} />
              <b>{goal.label}</b>
              {(state.seasonGoal ?? 'growth') === goal.id && <Check size={16} />}
            </span>
            <strong>
              {goal.target} <small>{goal.unit}</small>
            </strong>
            <p>{goal.description}</p>
          </button>
        ))}
      </div>
      <label className="auto-events">
        <input
          type="checkbox"
          checked={state.autoEvents ?? false}
          disabled={locked}
          onChange={(e) => onAuto(e.target.checked)}
        />
        주요 사건 자동 선택 <small>기본기·회복을 우선하며 한 번에 시즌을 마칩니다.</small>
      </label>
      {state.seasonEvent && (
        <p className="fine-print">
          시즌이 진행 중입니다. 중간 선택을 완료하면 결산으로 이어집니다.
        </p>
      )}
    </section>
  );
}

export function SeasonEvent({
  state,
  busy,
  onChoose,
}: {
  state: GameState;
  busy: boolean;
  onChoose: (choice: EventChoice) => void;
}) {
  const checkpoint = useMemo(() => seasonCheckpoint(state), [state]);
  const event = seasonEventDetails(state);
  const b = { ...checkpoint.batting },
    p = { ...checkpoint.pitching };
  for (const key of Object.keys(b) as (keyof typeof b)[]) b[key] += checkpoint.minorBatting[key];
  for (const key of Object.keys(p) as (keyof typeof p)[]) p[key] += checkpoint.minorPitching[key];
  return (
    <div className="season-event">
      <span className="eyebrow">{state.year} · MIDSEASON MOMENT</span>
      <h2 id="modal-title">{event.title}</h2>
      <p className="event-intro">{event.description}</p>
      <div className="checkpoint-stats">
        <b>전반기 기록 {state.player.stage === 'pro' && '· 1·2군 합산'}</b>
        <span>
          {state.player.role === 'batter'
            ? `${b.g}경기 · ${b.h}안타 · 타율 ${decimal(battingRates(b).avg)}`
            : `${p.g}등판 · ${innings(p.outs)}이닝 · ERA ${pitchingRates(p).era.toFixed(2)}`}
        </span>
      </div>
      <div className="event-options">
        {event.options.map((option) => (
          <button
            className="event-option"
            disabled={busy}
            key={option.id}
            onClick={() => onChoose(option.id)}
          >
            <span>
              <b>{option.label}</b>
              <ArrowRight size={18} />
            </span>
            <p>{option.effect}</p>
          </button>
        ))}
      </div>
      <p className="fine-print" role="status">
        {busy
          ? '선택을 반영해 후반기를 진행하고 있습니다…'
          : '선택은 한 번만 적용됩니다. 능력치 증가는 개인 잠재력까지 반영되며, 선택 내용은 커리어에 남습니다.'}
      </p>
    </div>
  );
}

export function SeasonReview({
  state,
  onTrain,
}: {
  state: GameState;
  onTrain: (plan: Plan) => void;
}) {
  const h = state.history.at(-1);
  if (!h)
    return (
      <section className="panel">
        <h2>첫 시즌의 이야기를 기다립니다</h2>
        <p>시즌을 완료하면 목표와 성장, 주요 선택을 함께 돌아볼 수 있습니다.</p>
      </section>
    );
  const feedback = coachingFeedback(state);
  const goal = h.goal;
  return (
    <>
      <section className="review-hero">
        <span className="eyebrow">{h.year} SEASON IN REVIEW</span>
        <h2>{state.player.name}의 한 시즌을 돌아봅니다.</h2>
        <p>
          {stageLabel(h)} · {h.team} · {h.notes[0]}
        </p>
        <div className="review-highlights">
          <span>
            <b>{h.overall}</b>종합 능력치
          </span>
          <span>
            <b>{h.war.toFixed(1)}</b>
            {h.stage === 'pro' ? '1군 WAR' : '시즌 WAR'}
          </span>
          <span>
            <b>{h.awards.filter((a) => a.mine).length}</b>개인 수상
          </span>
        </div>
      </section>
      <div className="review-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Flag size={18} /> 시즌 목표
            </h2>
            {goal && (
              <span className={`badge ${goal.achieved ? '' : 'neutral'}`}>
                {goal.achieved ? '달성' : '다음 도전으로'}
              </span>
            )}
          </div>
          {goal ? (
            <>
              <h3>{goal.label}</h3>
              <div className="goal-result">
                <strong>
                  {goal.current}
                  <small>
                    {' '}
                    / {goal.target} {goal.unit}
                  </small>
                </strong>
                <progress
                  aria-label="시즌 목표 달성도"
                  max={goal.target}
                  value={Math.min(goal.current, goal.target)}
                />
              </div>
              <p className="fine-print">
                {goal.achieved
                  ? '시즌 전에 정한 목표를 이뤘습니다. 다음 시즌에는 새로운 도전을 골라보세요.'
                  : '이번 시즌의 기록은 남습니다. 감독 피드백을 보고 다음 훈련을 준비해보세요.'}
              </p>
            </>
          ) : (
            <p>이전 버전의 시즌입니다. 다음 시즌부터 목표 달성 기록을 남길 수 있습니다.</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Sparkles size={18} /> 나의 선택
            </h2>
          </div>
          {h.story ? (
            <>
              <h3>{h.story.title}</h3>
              <p className="story-choice">{h.story.label}</p>
              <p>{h.story.effect}</p>
              <small className="subtle">후반기에 반영된 선택입니다.</small>
            </>
          ) : (
            <p>
              이 시즌에는 선택형 사건 기록이 없습니다. 다음 시즌에 새로운 이야기를 만들어보세요.
            </p>
          )}
        </section>
      </div>
      <section className="panel coaching-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">COACH'S NOTE</span>
            <h2>{feedback.title}</h2>
          </div>
          <TrendingUp size={21} />
        </div>
        <p>{feedback.detail}</p>
        {state.phase === 'preseason' && !state.seasonEvent && (
          <button className="button secondary" onClick={() => onTrain(feedback.plan)}>
            추천 훈련 적용 <ArrowRight size={16} />
          </button>
        )}
        {state.phase === 'offseason' && (
          <p className="fine-print">
            진로·계약을 정하고 다음 시즌을 준비하면 추천 훈련을 적용할 수 있습니다.
          </p>
        )}
      </section>
      <section className="panel review-development">
        <div className="panel-heading">
          <h2>이번 시즌의 성장</h2>
          <span className="subtle">훈련과 주요 선택 합산</span>
        </div>
        <div className="review-growth">
          {(Object.keys(h.growth) as (keyof Skills)[]).map((key) => (
            <div key={key}>
              <span>{(h.role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS)[key]}</span>
              <b>{h.skills[key]}</b>
              <small className={h.growth[key] < 0 ? 'negative' : ''}>
                {h.growth[key] > 0 ? '+' : ''}
                {h.growth[key]}
              </small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
