import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Flame,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import {
  generateTalentDraft,
  overall,
  PITCH_SKILL_LABELS,
  SKILL_LABELS,
  TALENTS,
  TEAMS,
} from './game';
import type { Role, Skills, TalentCard, TalentDraft } from './game';

export type NewPlayer = {
  name: string;
  role: Role;
  position: string;
  team: string;
  school: string;
};
const POSITIONS: Record<Role, [string, string][]> = {
  batter: [
    ['CF', '중견수'],
    ['SS', '유격수'],
    ['1B', '1루수'],
    ['C', '포수'],
  ],
  pitcher: [
    ['SP', '선발투수'],
    ['CP', '마무리투수'],
  ],
};
const ICONS = {
  slugger: Flame,
  defender: Shield,
  runner: Zap,
  balanced: CircleDot,
  fireballer: Flame,
  control: Target,
  breaking: Sparkles,
};

export default function CareerCreation({
  replacing,
  onStart,
}: {
  replacing: boolean;
  onStart: (player: NewPlayer, card: TalentCard, seed: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<NewPlayer>({
    name: '',
    role: 'batter',
    position: 'CF',
    team: TEAMS.KBO[0],
    school: TEAMS.HS[0],
  });
  const [step, setStep] = useState<'basics' | 'cards'>('basics');
  const [draft, setDraft] = useState<TalentDraft | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const selectButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const last = revealed.at(-1);
    if (last) selectButtons.current[last]?.focus({ preventScroll: true });
  }, [revealed]);
  const selectedCard = draft?.cards.find((c) => c.id === selected);
  const ready = revealed.length === 3 && !!selectedCard;
  const labels = player.role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS;
  useEffect(() => {
    root.current
      ?.querySelector<HTMLElement>(step === 'basics' ? 'input' : '.talent-face:not([inert]) button')
      ?.focus({ preventScroll: true });
  }, [step]);

  const deal = () => {
    if (!draft || draft.role !== player.role) {
      setDraft(generateTalentDraft(player.role));
      setRevealed([]);
      setSelected(null);
    }
    setStep('cards');
  };

  return (
    <div
      ref={root}
      className={`career-creation ${step === 'cards' ? 'career-draft' : 'career-basics'}`}
    >
      <div className="creation-steps" aria-label={`선수 생성 ${step === 'basics' ? '1' : '2'}단계`}>
        <span className={step === 'basics' ? 'current' : 'complete'}>
          {step === 'cards' ? <Check size={11} /> : '01'} 기본 설정
        </span>
        <span className="step-line" />
        <span className={step === 'cards' ? 'current' : ''}>02 시작 카드</span>
      </div>
      {step === 'basics' ? (
        <>
          <span className="eyebrow">A NEW BEGINNING</span>
          <h2 id="modal-title">어떤 이름으로 기억될까요?</h2>
          <p>16세, 고교 1학년. 학교 야구부에서 시작해 나만의 진로를 만들어갑니다.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (player.name.trim()) deal();
            }}
          >
            <label>
              선수 이름
              <input
                required
                maxLength={16}
                pattern=".*\S.*"
                title="공백을 제외한 이름을 입력해주세요"
                placeholder="이름을 입력하세요"
                value={player.name}
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              />
            </label>
            <div className="form-two">
              <label>
                선수 유형
                <select
                  aria-label="선수 유형"
                  value={player.role}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setPlayer({ ...player, role, position: role === 'batter' ? 'CF' : 'SP' });
                  }}
                >
                  <option value="batter">타자</option>
                  <option value="pitcher">투수</option>
                </select>
              </label>
              <label>
                포지션
                <select
                  aria-label="포지션"
                  value={player.position}
                  onChange={(e) => setPlayer({ ...player, position: e.target.value })}
                >
                  {POSITIONS[player.role].map(([id, label]) => (
                    <option key={id} value={id}>
                      {label} ({id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              출발할 고등학교
              <select
                aria-label="출발 고등학교"
                value={player.school}
                onChange={(e) => setPlayer({ ...player, school: e.target.value })}
              >
                {TEAMS.HS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              선호 프로 구단 · 지명 구단과는 다를 수 있습니다
              <select
                aria-label="선호 팀"
                value={player.team}
                onChange={(e) => setPlayer({ ...player, team: e.target.value })}
              >
                {TEAMS.KBO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {replacing && (
              <div className="info-bar">
                마지막 카드 선택을 확정하면 현재 커리어를 자동 백업한 뒤 교체합니다. 보관함에서
                복원할 수 있으며, 오래 보관할 기록은 파일로 내려받아주세요.
              </div>
            )}
            <button className="button primary" type="submit">
              시작 카드 확인하기 <ArrowRight size={17} />
            </button>
          </form>
        </>
      ) : (
        draft && (
          <>
            <span className="eyebrow">THREE CARDS. ONE BEGINNING.</span>
            <h2 id="modal-title">당신의 첫 번째 가능성을 펼쳐보세요.</h2>
            <p>
              <b>{player.name.trim()}</b> · {player.school} 고교 1학년 ·{' '}
              {POSITIONS[player.role].find(([id]) => id === player.position)?.[1]}
              <br />
              카드를 한 장씩 뒤집고, 함께 시작할 재능을 골라주세요.
            </p>
            <div className="talent-grid">
              {draft.cards.map((card, i) => {
                const shown = revealed.includes(card.id),
                  chosen = selected === card.id;
                const talent = TALENTS[card.role].find((t) => t.id === card.archetype)!,
                  Icon = ICONS[card.archetype];
                return (
                  <article
                    className={`talent-card ${shown ? 'revealed' : ''} ${chosen ? 'chosen' : ''}`}
                    key={card.id}
                    aria-label={`${i + 1}번 시작 카드`}
                  >
                    <div className="talent-rotator">
                      <div className="talent-back talent-face" aria-hidden={shown} inert={shown}>
                        <button
                          className="talent-reveal"
                          aria-label={`${i + 1}번 카드 뒤집기`}
                          onClick={() =>
                            setRevealed((prev) =>
                              prev.includes(card.id) ? prev : [...prev, card.id],
                            )
                          }
                        >
                          <span className="talent-back-number">0{i + 1}</span>
                          <span className="talent-seal">
                            <CircleDot size={39} strokeWidth={1} />
                            <span>
                              R<span>✦</span>L
                            </span>
                          </span>
                          <b>HIDDEN POTENTIAL</b>
                          <span className="talent-back-tag">어떤 선수가 될 수 있을까?</span>
                          <span className="talent-flip-hint">
                            <Sparkles size={13} />
                            클릭해서 뒤집기
                          </span>
                        </button>
                      </div>
                      <div className="talent-front talent-face" aria-hidden={!shown} inert={!shown}>
                        {shown && (
                          <>
                            <div className="talent-top">
                              <span>ROOKIE TALENT · 0{i + 1}</span>
                              <span className="talent-selection-mark">
                                {chosen ? <Check size={13} /> : '✦'}
                              </span>
                            </div>
                            <div className="talent-concept">
                              <span className={`talent-concept-icon ${card.archetype}`}>
                                <Icon size={25} strokeWidth={1.5} />
                              </span>
                              <div>
                                <span>STARTING ARCHETYPE</span>
                                <h3>{talent.label}</h3>
                              </div>
                              <div className="talent-overall">
                                <span>OVR</span>
                                <b>{overall(card.skills)}</b>
                              </div>
                            </div>
                            <p className="talent-description">{talent.description}</p>
                            <dl className="talent-skills">
                              {(Object.keys(card.skills) as (keyof Skills)[]).map((key) => (
                                <div key={key}>
                                  <dt>{labels[key]}</dt>
                                  <dd>
                                    <span className="talent-stat-track" aria-hidden="true">
                                      <span style={{ width: `${card.skills[key]}%` }} />
                                    </span>
                                    <b data-skill={key}>{card.skills[key]}</b>
                                  </dd>
                                </div>
                              ))}
                            </dl>
                            <button
                              ref={(el) => {
                                selectButtons.current[card.id] = el;
                              }}
                              className={`button ${chosen ? 'primary' : 'secondary'} talent-select`}
                              aria-label={`${i + 1}번 ${talent.label} 카드 선택`}
                              aria-pressed={chosen}
                              onClick={() => setSelected(card.id)}
                            >
                              {chosen ? (
                                <>
                                  <Check size={15} />
                                  선택한 카드
                                </>
                              ) : (
                                <>
                                  이 카드 선택 <ArrowRight size={14} />
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="draft-progress" role="status" aria-live="polite">
              <span>
                {revealed.length === 3 ? <Check size={15} /> : <Sparkles size={15} />}
                {revealed.length} / 3장 공개
              </span>
              <p>
                {revealed.length < 3
                  ? '세 장을 모두 확인한 뒤 시작할 수 있습니다.'
                  : selectedCard
                    ? `${TALENTS[player.role].find((t) => t.id === selectedCard.archetype)!.label}의 능력치로 시작합니다.`
                    : '마음에 드는 카드를 한 장 선택해주세요.'}
              </p>
            </div>
            <div className="draft-actions">
              <button className="button secondary" onClick={() => setStep('basics')}>
                <ArrowLeft size={15} />
                기본 설정
              </button>
              <button
                className="button primary"
                disabled={!ready}
                onClick={() => {
                  if (ready && selectedCard) onStart(player, selectedCard, draft.seed);
                }}
              >
                선택한 카드로 시작 <ArrowRight size={16} />
              </button>
            </div>
            <p className="draft-footnote">
              카드에 표시된 수치가 실제 시작 능력치로 적용됩니다. 컨셉은 출발점이며, 이후 육성은
              자유롭게 선택할 수 있습니다.
            </p>
          </>
        )
      )}
    </div>
  );
}
