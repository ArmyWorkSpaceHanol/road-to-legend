import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import CareerCreation from './CareerCreation';
import CareerRecords from './CareerRecords';
import type { NewPlayer } from './CareerCreation';
import Pagination, { usePagination } from './Pagination';
import { SelectionCenter, SalaryNegotiation, KboContractRules } from './CareerOpportunities';
import { GoalPicker, SeasonEvent, SeasonReview, coachingFeedback } from './SeasonJourney';
import { CareerHealth, CareerPath, LifeOverview, RosterReport } from './CareerLife';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CircleDot,
  Download,
  Dumbbell,
  Flame,
  Globe2,
  GraduationCap,
  History,
  LayoutDashboard,
  Menu,
  Play,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  battingRates,
  beginSeason,
  resolveSeasonEvent,
  decimal,
  emptyBat,
  emptyPitch,
  innings,
  LEAGUE_LABELS,
  makeCareer,
  money,
  nextSeason,
  needsCareerDecision,
  overall,
  parseSave,
  PITCHER_LABELS,
  PITCH_SKILL_LABELS,
  pitchingRates,
  PLANS,
  SAVE_KEY,
  SEASON_GAMES,
  SKILL_LABELS,
  SUPPORTS,
  stageLabel,
  trainingCost,
  TALENTS,
  totals,
} from './game';
import type {
  Batting,
  EventChoice,
  GameState,
  Leader,
  Pitching,
  Role,
  Season,
  Skills,
  TalentCard,
} from './game';

type Page = 'review' | 'home' | 'training' | 'records' | 'leaders' | 'awards' | 'market' | 'career';
const NAV: { id: Page; label: string; english: string; icon: typeof Trophy }[] = [
  { id: 'home', label: '클럽하우스', english: 'CLUBHOUSE', icon: LayoutDashboard },
  { id: 'review', label: '시즌 결산', english: 'SEASON REVIEW', icon: CalendarDays },
  { id: 'training', label: '선수 육성', english: 'TRAINING', icon: Dumbbell },
  { id: 'records', label: '나의 기록실', english: 'MY STATS', icon: BarChart3 },
  { id: 'leaders', label: '리그 순위', english: 'LEAGUE', icon: Users },
  { id: 'awards', label: '시상식', english: 'AWARDS', icon: Trophy },
  { id: 'market', label: '진로 · 계약', english: 'CAREER PATH', icon: Globe2 },
  { id: 'career', label: '커리어 히스토리', english: 'CAREER', icon: History },
];
const REVIEW_STEPS: { page: Page; label: string }[] = [
  { page: 'review', label: '시즌 결산' },
  { page: 'records', label: '기록 확인' },
  { page: 'awards', label: '시상식' },
  { page: 'market', label: '진로 · 계약' },
];
const POSITION: Record<string, string> = {
  CF: '중견수',
  SS: '유격수',
  '1B': '1루수',
  C: '포수',
  SP: '선발투수',
  CP: '마무리투수',
};
const TRAIN_ICONS = [Target, CircleDot, Flame, Zap, Shield, Brain, Activity];
const planLabel = (s: GameState) =>
  s.player.role === 'pitcher' && PITCHER_LABELS[s.plan]
    ? PITCHER_LABELS[s.plan]![0]
    : PLANS.find((p) => p.id === s.plan)!.label;
function load(): { state: GameState; error: string | null; exists: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return { state: raw ? parseSave(raw) : makeCareer(), error: null, exists: !!raw };
  } catch {
    return {
      state: makeCareer(),
      exists: true,
      error:
        '저장 데이터를 읽지 못했습니다. 기존 데이터는 덮어쓰지 않았습니다. 백업을 불러오거나 새 커리어를 만들어주세요.',
    };
  }
}

function Baseball({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="currentColor" />
      <path
        d="M8 8c16 7 16 17 0 24M32 8c-16 7-16 17 0 24"
        stroke="var(--ball-seam, #173c2e)"
        strokeWidth="1.6"
        strokeDasharray="2.6 2"
      />
    </svg>
  );
}
function Ballpark() {
  return (
    <svg className="ballpark" viewBox="0 0 510 360" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="grass" x2="0" y2="1">
          <stop stopColor="#6c9b67" stopOpacity=".35" />
          <stop offset="1" stopColor="#6c9b67" stopOpacity=".05" />
        </linearGradient>
        <pattern
          id="stripe"
          width="42"
          height="42"
          patternTransform="rotate(-35)"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 0h21v42H0z" fill="#c6ddaf" fillOpacity=".04" />
        </pattern>
      </defs>
      <path d="M255 326 31 133C120-42 389-42 479 133Z" fill="url(#grass)" />
      <path d="M255 326 31 133C120-42 389-42 479 133Z" fill="url(#stripe)" />
      <path d="M255 326 31 133C120-42 389-42 479 133Z" stroke="#9dbb8d" strokeOpacity=".4" />
      <path
        d="m255 306-95-95 95-95 95 95z"
        fill="#b7a17c"
        fillOpacity=".3"
        stroke="#dfddba"
        strokeOpacity=".55"
      />
      <path d="m255 278-66-67 66-66 67 66z" fill="#59875b" fillOpacity=".75" />
      <path
        d="M255 326V211m0 0L31 133m224 78 224-78"
        stroke="#f5f1d9"
        strokeOpacity=".15"
        strokeDasharray="4 8"
      />
      <circle cx="255" cy="211" r="11" fill="#ccb991" fillOpacity=".6" />
      <path
        d="m255 308 7-7-7-7-7 7zm-95-97 6-6-6-6-6 6zm95-95 6 6-6 6-6-6zm95 95-6-6 6-6 6 6z"
        fill="#f8f4db"
      />
      <circle cx="255" cy="211" r="47" stroke="#e3e6cb" strokeOpacity=".1" />
      <path d="M61 123a216 216 0 0 1 388 0" stroke="#a5c494" strokeOpacity=".17" strokeWidth="15" />
      <text
        x="255"
        y="58"
        textAnchor="middle"
        fill="#cce0b8"
        fillOpacity=".5"
        fontSize="10"
        letterSpacing="5"
      >
        THE FIELD IS YOURS
      </text>
    </svg>
  );
}
function Panel({
  title,
  eyebrow,
  children,
  action,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Empty({
  title,
  description,
  icon: Icon = BarChart3,
}: {
  title: string;
  description: string;
  icon?: typeof Trophy;
}) {
  return (
    <div className="empty">
      <span>
        <Icon size={28} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
function Radar({ skills, role }: { skills: Skills; role: Role }) {
  const keys = Object.keys(skills) as (keyof Skills)[],
    labels = role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS;
  const point = (i: number, r: number) => {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    return `${130 + Math.cos(a) * r},${118 + Math.sin(a) * r}`;
  };
  return (
    <svg
      className="radar"
      viewBox="0 0 260 235"
      role="img"
      aria-label={`능력치: ${keys.map((k) => `${labels[k]} ${skills[k]}`).join(', ')}`}
    >
      {[22, 44, 66, 88].map((r) => (
        <polygon
          key={r}
          points={keys.map((_, i) => point(i, r)).join(' ')}
          fill="none"
          stroke="#e5e8df"
        />
      ))}
      {keys.map((_, i) => (
        <line
          key={i}
          x1="130"
          y1="118"
          x2={point(i, 88).split(',')[0]}
          y2={point(i, 88).split(',')[1]}
          stroke="#e5e8df"
        />
      ))}
      <polygon
        points={keys.map((k, i) => point(i, skills[k] * 0.88)).join(' ')}
        fill="#91b690"
        fillOpacity=".35"
        stroke="#548265"
        strokeWidth="2"
      />
      {keys.map((k, i) => {
        const [x, y] = point(i, 110).split(',').map(Number);
        return (
          <text
            key={k}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#757d72"
            fontSize="10"
          >
            {labels[k]}{' '}
            <tspan fontWeight="700" fill="#31533c">
              {skills[k]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
function StatCards({
  batting,
  pitching,
  role,
  war,
  empty = false,
}: {
  batting: Batting;
  pitching: Pitching;
  role: Role;
  war: number;
  empty?: boolean;
}) {
  const br = battingRates(batting),
    pr = pitchingRates(pitching);
  const values =
    role === 'batter'
      ? [
          ['타율', 'AVG', decimal(br.avg)],
          ['홈런', 'HR', batting.hr],
          ['타점', 'RBI', batting.rbi],
          ['출루 + 장타율', 'OPS', decimal(br.ops)],
        ]
      : [
          ['평균자책점', 'ERA', pr.era.toFixed(2)],
          ['승리', 'W', pitching.w],
          ['탈삼진', 'SO', pitching.so],
          ['이닝당 출루', 'WHIP', pr.whip.toFixed(2)],
        ];
  return (
    <div className="stat-grid">
      {values.map(([label, abbr, value], i) => (
        <div className="stat-card" key={abbr}>
          <div className="stat-top">
            <span>{label}</span>
            <span>{abbr}</span>
          </div>
          <strong>{empty ? '—' : value}</strong>
          <div className="stat-foot">
            {i === 3 ? (
              <>
                WAR <b>{empty ? '—' : war.toFixed(1)}</b>
              </>
            ) : (
              <>
                <span className="little-dot" />
                {empty
                  ? '시즌 시작을 기다리는 중'
                  : i === 0
                    ? `${role === 'batter' ? batting.g : pitching.g}경기 출장`
                    : '정규시즌 최종 기록'}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function Standings({
  season,
  team,
  compact = false,
}: {
  season?: Season;
  team: string;
  compact?: boolean;
}) {
  if (!season)
    return (
      <Empty
        title="새 시즌이 기다리고 있습니다"
        description="시즌을 진행하면 구단 순위가 표시됩니다."
        icon={Users}
      />
    );
  const rows = compact ? season.standings.slice(0, 5) : season.standings;
  const first = season.standings[0].w;
  return (
    <div className="table-scroll">
      <table className="standings-table">
        <thead>
          <tr>
            <th>순위</th>
            <th>구단</th>
            <th>승</th>
            <th>패</th>
            <th>승률</th>
            <th>승차</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={r.team === team ? 'my-row' : ''}>
              <td>
                <span className={i === 0 ? 'rank first' : 'rank'}>{i + 1}</span>
              </td>
              <td>
                <span className="team-mini">{r.team.split(' ')[0].slice(0, 1)}</span>
                {r.team} {r.team === team && <span className="you">MY</span>}
              </td>
              <td>{r.w}</td>
              <td>{r.l}</td>
              <td>{decimal(r.w / (r.w + r.l))}</td>
              <td>{i === 0 ? '—' : first - r.w}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {compact && !rows.some((r) => r.team === team) && (
        <div className="standings-mine">
          내 구단 <b>{season.standings.findIndex((r) => r.team === team) + 1}위</b> · {team}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [initial] = useState(load),
    [state, setState] = useState(initial.state),
    [page, setPage] = useState<Page>(
      initial.state.seasonEvent ? 'home' : initial.state.phase !== 'preseason' ? 'review' : 'home',
    );
  const [saveError, setSaveError] = useState(initial.error),
    [toast, setToast] = useState(''),
    [busy, setBusy] = useState(false);
  const [hasCareer, setHasCareer] = useState(initial.exists);
  const [modal, setModal] = useState<'new' | 'help' | 'event' | null>(
      initial.state.seasonEvent ? 'event' : initial.exists ? null : 'new',
    ),
    [mobileNav, setMobileNav] = useState(false);
  const [recordYear, setRecordYear] = useState('latest'),
    [leagueTab, setLeagueTab] = useState<'standings' | 'batting' | 'pitching'>('standings');
  const [recordView, setRecordView] = useState<'stats' | 'milestones'>('stats');
  const [recordLevel, setRecordLevel] = useState<'first' | 'second' | 'amateur'>(
    initial.state.player.stage === 'pro' ? 'first' : 'amateur',
  );
  const inputRef = useRef<HTMLInputElement>(null),
    latest = state.history.at(-1),
    player = state.player;
  const simulationId = useRef(0);
  const rating = overall(player.skills),
    total = totals(state.history);
  const recordSeason =
    recordYear === 'latest' ? latest : state.history.find((h) => String(h.year) === recordYear);
  const recordStats =
    recordYear === 'all'
      ? totals(state.history, recordLevel)
      : recordSeason &&
          (recordLevel === 'amateur' ? recordSeason.stage !== 'pro' : recordSeason.stage === 'pro')
        ? recordLevel === 'second'
          ? { batting: recordSeason.minorBatting, pitching: recordSeason.minorPitching, war: 0 }
          : recordSeason
        : { batting: emptyBat(), pitching: emptyPitch(), war: 0 };
  const preseason = state.phase === 'preseason';
  const trainingOpen = preseason && !state.seasonEvent && !busy && !saveError;
  const reviewIndex = REVIEW_STEPS.findIndex((step) => step.page === page);
  const reviewing = state.phase !== 'preseason' && !!latest && reviewIndex >= 0;
  const nextLabel = needsCareerDecision(state) ? '진로 선택하기' : `${state.year + 1} 시즌 준비`;
  const reviewNavigate = (to: Page) => {
    if (to === 'records') {
      setRecordView('stats');
      setRecordYear('latest');
      setRecordLevel(latest?.stage === 'pro' ? 'first' : 'amateur');
    }
    navigate(to);
  };
  const navigate = (to: Page) => {
    setPage(to);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [page]);

  useEffect(() => {
    if (!hasCareer) return;
    if (initial.error && saveError === initial.error) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setSaveError(null);
    } catch {
      setSaveError('자동 저장이 실패했습니다. 저장 공간을 확인하고 백업 파일을 내려받아주세요.');
    }
  }, [state, initial.error, saveError, hasCareer]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasCareer && !busy) setModal(null);
      if (e.key === 'Tab') {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>('.modal button, .modal input, .modal select'),
        ).filter(
          (node) =>
            !node.matches(':disabled') &&
            !node.closest('[inert]') &&
            node.getClientRects().length > 0,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLElement>('.modal button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [modal, hasCareer, busy]);

  const showSeasonResult = (next: GameState) => {
    setState(next);
    setRecordLevel(next.player.stage === 'pro' ? 'first' : 'amateur');
    setRecordYear('latest');
    setModal(null);
    navigate('review');
    notify(`${next.year} 시즌이 끝났습니다. 목표와 나의 선택을 돌아보세요.`);
  };
  const finishEvent = (choice: EventChoice) => {
    if (busy || saveError) return;
    setBusy(true);
    const run = ++simulationId.current;
    window.setTimeout(() => {
      if (run !== simulationId.current) return;
      try {
        showSeasonResult(resolveSeasonEvent(state, choice));
      } catch (e) {
        notify(e instanceof Error ? e.message : '시즌 진행에 실패했습니다.');
      }
      setBusy(false);
    }, 200);
  };
  const advance = () => {
    if (!hasCareer || busy || saveError || state.phase === 'retired') return;
    if (state.seasonEvent) {
      setModal('event');
      return;
    }
    if (needsCareerDecision(state)) {
      navigate('market');
      notify('진로를 결정한 뒤 다음 시즌을 준비해주세요.');
      return;
    }
    setBusy(true);
    const run = ++simulationId.current;
    window.setTimeout(
      () => {
        if (run !== simulationId.current) return;
        try {
          if (preseason) {
            const started = beginSeason(state);
            if (state.autoEvents) showSeasonResult(resolveSeasonEvent(started, 'steady'));
            else {
              setState(started);
              navigate('home');
              setModal('event');
            }
          } else {
            setState(nextSeason(state));
            navigate('training');
            notify('새 시즌입니다. 목표와 육성 계획을 선택해주세요.');
          }
          setRecordYear('latest');
        } catch (e) {
          notify(e instanceof Error ? e.message : '진행 중 문제가 발생했습니다.');
        }
        setBusy(false);
      },
      preseason ? 350 : 150,
    );
  };
  const backup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `road-to-legend-${player.name}-${state.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('커리어 백업을 내려받았습니다.');
  };
  const importSave = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 3_000_000) throw new Error();
      const imported = parseSave(await file.text());
      if (
        !window.confirm(
          `현재 커리어를 ${imported.player.name}의 ${imported.year}년 저장 기록으로 교체할까요? 현재 기록은 먼저 백업해두세요.`,
        )
      )
        return;
      setSaveError(null);
      setHasCareer(true);
      simulationId.current++;
      setBusy(false);
      setState(imported);
      setRecordLevel(imported.player.stage === 'pro' ? 'first' : 'amateur');
      setModal(null);
      setPage('home');
      setRecordYear('latest');
      setRecordView('stats');
      notify('저장한 커리어를 불러왔습니다.');
    } catch {
      notify('올바른 저장 파일이 아닙니다. 기존 커리어는 유지됩니다.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  const newCareer = (newPlayer: NewPlayer, card: TalentCard, seed: number) => {
    simulationId.current++;
    setBusy(false);
    setState(
      makeCareer(
        newPlayer.name,
        newPlayer.role,
        newPlayer.position,
        newPlayer.team,
        seed,
        card,
        newPlayer.school,
      ),
    );
    setHasCareer(true);
    setRecordLevel('amateur');
    setRecordView('stats');
    setSaveError(null);
    setModal(null);
    setPage('home');
    setRecordYear('latest');
    notify('새로운 야구 인생이 시작됩니다.');
  };
  const actionButton = (
    <button
      className="button primary season-button"
      onClick={advance}
      disabled={
        !hasCareer ||
        busy ||
        state.phase === 'retired' ||
        !!saveError ||
        (preseason && !state.seasonEvent && player.money < trainingCost(state))
      }
    >
      {busy ? (
        <span className="spinner" />
      ) : preseason ? (
        <Play size={15} fill="currentColor" />
      ) : (
        <ArrowRight size={17} />
      )}
      {busy
        ? '시즌 시뮬레이션 중…'
        : state.phase === 'retired'
          ? '완성된 나의 야구 인생'
          : needsCareerDecision(state)
            ? '진로 선택하기'
            : state.seasonEvent
              ? `${state.year} 시즌 이어하기`
              : preseason
                ? `${state.year} 시즌 진행`
                : `${state.year + 1} 시즌 준비`}{' '}
      {!busy && <span>{preseason ? 'PLAY SEASON' : 'NEXT SEASON'}</span>}
    </button>
  );

  return (
    <div
      className={`app-shell ${(page === 'home' || page === 'training') && state.phase !== 'retired' ? 'has-season-dock' : ''}`}
    >
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`} inert={modal ? true : undefined}>
        <button className="brand" onClick={() => navigate('home')} aria-label="Road to Legend 홈">
          <Baseball />
          <span>
            ROAD TO
            <br />
            <b>
              LEGEND<span className="brand-period">.</span>
            </b>
          </span>
        </button>
        <div className="sidebar-label">YOUR BASEBALL LIFE</div>
        <nav aria-label="주 메뉴">
          {NAV.map((item) => (
            <button
              key={item.id}
              aria-label={item.label}
              aria-current={page === item.id ? 'page' : undefined}
              disabled={busy}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.id === 'market' &&
              state.phase === 'offseason' &&
              (state.offers.length > 0 || needsCareerDecision(state)) ? (
                <span className="nav-count">
                  {needsCareerDecision(state) ? '!' : state.offers.length}
                </span>
              ) : page === item.id ? (
                <span className="nav-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="league-stamp">
            <div className="stamp-top">
              <span className="live-dot" />
              SINGLE PLAYER
            </div>
            <p>
              누구와도 비교할 필요 없는,
              <br />
              <b>나만의 야구 인생.</b>
            </p>
            <div className="stamp-line" />
            <span>WRITE YOUR OWN LEGACY</span>
          </div>
          <button className="help-button" onClick={() => setModal('help')}>
            <CircleHelp size={16} /> 플레이 가이드 <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-version">
            ROAD TO LEGEND <span>v0.4</span>
          </div>
        </div>
      </aside>
      <div className="workspace" inert={modal ? true : undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="메뉴 열기"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span>MY BASEBALL LIFE</span>
            <ChevronRight size={13} />
            <b>{NAV.find((n) => n.id === page)?.label}</b>
          </div>
          <div className="topbar-right">
            <span className={`save-status ${saveError ? 'error' : ''}`}>
              <span className="live-dot" />
              {saveError ? '저장 확인 필요' : '자동 저장됨'}
            </span>
            <span className="topbar-divider" />
            <span className="mini-avatar">{player.name.slice(0, 1)}</span>
            <b>{player.name}</b>
            <span className="topbar-position">{player.position}</span>
          </div>
        </header>
        <main id="main-content" aria-busy={busy}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="season-dot" />
                {state.year} SEASON <span className="eyebrow-divider">/</span>{' '}
                {LEAGUE_LABELS[player.league]} · {stageLabel(player)}
              </div>
              <h1 tabIndex={-1}>
                {page === 'home' ? '나의 야구 인생' : NAV.find((n) => n.id === page)?.label}
                <span className="heading-period">.</span>
              </h1>
              <p>
                {page === 'home'
                  ? '위대한 기록도, 작은 선택 하나에서 시작됩니다.'
                  : page === 'review'
                    ? '목표와 성장, 나의 선택을 돌아보고 다음 무대를 준비하세요.'
                    : page === 'training'
                      ? '어떤 선수가 될 것인가. 다음 시즌의 방향을 정해보세요.'
                      : page === 'records'
                        ? '숫자로 남은 땀과 시간. 당신의 모든 시즌을 기록합니다.'
                        : page === 'leaders'
                          ? '같은 그라운드, 서로 다른 이야기. 리그의 흐름을 읽어보세요.'
                          : page === 'awards'
                            ? '빛나는 한 시즌을 보낸 선수들에게 박수를.'
                            : page === 'market'
                              ? '더 넓은 무대로. 커리어의 다음 장을 선택하세요.'
                              : '첫 타석부터 마지막 경기까지, 나만의 발자취.'}
              </p>
            </div>
            <div className="heading-actions">
              <button
                disabled={busy}
                className="button secondary new-career"
                onClick={() => setModal('new')}
              >
                <Plus size={15} />새 커리어
              </button>
              {page === 'home' && (
                <span className="phase-pill">
                  <span className="little-dot" />
                  {state.seasonEvent
                    ? '시즌 중 · 선택 대기'
                    : preseason
                      ? '프리시즌'
                      : state.phase === 'offseason'
                        ? '시즌 결산'
                        : '은퇴'}
                </span>
              )}
            </div>
          </div>
          {saveError && (
            <div role="alert" className="alert">
              <Shield size={18} />
              <span>{saveError}</span>
              <button onClick={() => inputRef.current?.click()}>백업 불러오기</button>
            </div>
          )}

          {reviewing && (
            <nav className="review-steps" aria-label="시즌 종료 후 단계">
              {REVIEW_STEPS.map((step, index) => (
                <button
                  key={step.page}
                  aria-current={step.page === page ? 'step' : undefined}
                  disabled={busy}
                  onClick={() => reviewNavigate(step.page)}
                >
                  <span>{index + 1}</span>
                  <b>{step.label}</b>
                </button>
              ))}
            </nav>
          )}
          {page === 'review' && (
            <SeasonReview
              state={state}
              onTrain={(plan) => {
                setState({ ...state, plan });
                navigate('training');
              }}
            />
          )}

          {page === 'home' && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-kicker">
                    <span className="gold-line" />
                    {state.history.length === 0
                      ? 'EVERY LEGEND HAS A BEGINNING'
                      : state.phase === 'retired'
                        ? 'A LEGACY THAT LIVES FOREVER'
                        : 'THE NEXT CHAPTER IS YOURS'}
                  </div>
                  <h2>
                    {state.history.length === 0 ? (
                      <>
                        이제, 당신의 야구가
                        <br />
                        시작됩니다<span>.</span>
                      </>
                    ) : preseason ? (
                      <>
                        다시 그라운드로,
                        <br />더 높은 곳을 향해<span>.</span>
                      </>
                    ) : state.phase === 'retired' ? (
                      <>
                        당신의 이름은
                        <br />
                        기록으로 남습니다<span>.</span>
                      </>
                    ) : (
                      <>
                        한 시즌의 끝,
                        <br />
                        새로운 전설의 시작<span>.</span>
                      </>
                    )}
                  </h2>
                  <p>
                    {preseason
                      ? '훈련을 선택하고, 한 번의 클릭으로 한 시즌을 살아보세요.'
                      : state.phase === 'retired'
                        ? `${state.history.length}시즌의 여정. 기록실에서 모든 순간을 돌아보세요.`
                        : `${state.year}년의 모든 순간이 기록되었습니다. 당신의 다음 무대는 어디인가요?`}
                  </p>
                  <div className="hero-bottom">
                    <div>
                      <span>PLAYER</span>
                      <b>
                        {player.name}
                        <small>#{player.role === 'batter' ? '27' : '18'}</small>
                      </b>
                    </div>
                    <div>
                      <span>TEAM</span>
                      <b>{player.team}</b>
                    </div>
                    <div>
                      <span>CAREER STAGE</span>
                      <b>{stageLabel(player)}</b>
                    </div>
                  </div>
                </div>
                <Ballpark />
                <span className="hero-corner">
                  EST. 2026 <span>✦</span> YOUR OWN LEGACY
                </span>
              </section>
              <LifeOverview state={state} onOpen={() => navigate('market')} />
              <CareerHealth state={state} />
              {preseason && (
                <GoalPicker
                  disabled={busy || !!saveError}
                  state={state}
                  onSelect={(seasonGoal) => setState({ ...state, seasonGoal })}
                  onAuto={(autoEvents) => setState({ ...state, autoEvents })}
                />
              )}
              {!preseason && (
                <button className="review-callout" onClick={() => navigate('review')}>
                  <Sparkles size={20} />
                  <span>
                    <b>{latest?.year} 시즌 결산 보기</b>
                    <small>목표 달성 · 주요 선택 · 감독 피드백</small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
              <div className="section-label">
                <h2>
                  {latest
                    ? `${latest.year} ${latest.stage === 'pro' ? '1군' : LEAGUE_LABELS[latest.league]} 주요 기록`
                    : '시즌 주요 기록'}
                </h2>
                <button className="text-link" onClick={() => navigate('records')}>
                  상세 기록 보기 <ArrowRight size={14} />
                </button>
              </div>
              <StatCards
                batting={latest?.batting ?? emptyBat()}
                pitching={latest?.pitching ?? emptyPitch()}
                role={player.role}
                war={latest?.war ?? 0}
                empty={!latest}
              />
              <div className="dashboard-grid">
                <div className="dashboard-main">
                  <Panel
                    title={
                      preseason
                        ? '올해는 어떤 선수로 성장할까요?'
                        : state.phase === 'retired'
                          ? '그라운드에 남긴 발자취'
                          : '다음 이야기를 준비할 시간'
                    }
                    eyebrow={preseason ? 'YOUR SEASON PLAN' : 'THE NEXT CHAPTER'}
                    action={
                      <span className="number-tag">
                        {preseason ? '01 — PREPARE' : '02 — REVIEW'}
                      </span>
                    }
                  >
                    {preseason ? (
                      <>
                        <div className="selected-training">
                          <span className="training-symbol">
                            <Dumbbell size={24} />
                          </span>
                          <div>
                            <span className="micro-label">선택한 육성 방향</span>
                            <h3>{planLabel(state)}</h3>
                            <p>
                              {SUPPORTS.find((x) => x.id === state.support)?.label} ·{' '}
                              {trainingCost(state)
                                ? `${money(trainingCost(state))}원 투자`
                                : '추가 비용 없음'}
                            </p>
                          </div>
                          <button
                            className="button secondary small"
                            onClick={() => navigate('training')}
                          >
                            변경 <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="season-plan-info">
                          <div>
                            <CalendarDays size={15} />
                            <span>{SEASON_GAMES[player.league]}경기 정규시즌</span>
                          </div>
                          <div>
                            <CheckCircle2 size={15} />
                            <span>선택한 훈련 자동 적용</span>
                          </div>
                        </div>
                      </>
                    ) : state.phase === 'retired' ? (
                      <div className="retirement-summary">
                        <Trophy size={32} />
                        <p>
                          통산 <b>WAR {total.war.toFixed(1)}</b> · 개인 수상{' '}
                          <b>
                            {state.history.flatMap((h) => h.awards.filter((a) => a.mine)).length}회
                          </b>
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="review-note">
                          <CheckCircle2 size={22} />
                          <div>
                            <h3>{latest?.year} 시즌 완료</h3>
                            <p>{latest?.notes[0]}</p>
                          </div>
                        </div>
                        <div className="review-links">
                          <button onClick={() => navigate('awards')}>
                            <Trophy size={17} />
                            시상식 <ChevronRight size={14} />
                          </button>
                          <button onClick={() => navigate('market')}>
                            <Globe2 size={17} />
                            진로 · 계약 <ChevronRight size={14} />
                          </button>
                        </div>
                        <p className="contract-note">
                          {player.stage !== 'pro' ? (
                            <>
                              {needsCareerDecision(state)
                                ? '다음 시즌을 준비하려면 진로를 선택해주세요.'
                                : (latest?.draft?.reason ??
                                  '학년과 소속 단계에 맞춰 다음 시즌으로 이어집니다.')}
                            </>
                          ) : (
                            <>
                              다음 계약:{' '}
                              <b>{state.offers.find((o) => o.id === state.selectedOffer)?.team}</b>{' '}
                              ·{' '}
                              {money(
                                state.offers.find((o) => o.id === state.selectedOffer)?.salary ?? 0,
                              )}
                              원
                            </>
                          )}
                        </p>
                      </>
                    )}
                    <div className="season-action">
                      {actionButton}
                      <p>
                        {preseason
                          ? state.seasonEvent
                            ? '시즌 중 선택을 완료하면 후반기를 이어갑니다.'
                            : state.autoEvents
                              ? '주요 사건은 기본기·회복 우선으로 자동 선택합니다.'
                              : '전반기 후 주요 사건을 선택하고 후반기를 이어갑니다.'
                          : state.phase === 'retired'
                            ? '새 커리어로 또 다른 야구 인생을 시작할 수 있습니다.'
                            : '진로·계약에 맞춰 다음 학년 또는 다음 시즌을 준비합니다.'}
                      </p>
                    </div>
                  </Panel>
                  <Panel
                    title="리그 스탠딩"
                    eyebrow={
                      latest
                        ? `${latest.league} · ${latest.year} FINAL STANDINGS`
                        : `${player.league} · STANDINGS`
                    }
                    action={
                      <button className="text-link" onClick={() => navigate('leaders')}>
                        전체 보기 <ArrowRight size={14} />
                      </button>
                    }
                  >
                    <Standings season={latest} team={latest?.team ?? player.team} compact />
                  </Panel>
                </div>
                <div className="dashboard-side">
                  <Panel
                    title="내 선수"
                    eyebrow="PLAYER PROFILE"
                    action={<span className="profile-position">{player.position}</span>}
                  >
                    <div className="player-summary">
                      <div className="jersey-avatar">
                        <span>{player.role === 'batter' ? '27' : '18'}</span>
                      </div>
                      <div>
                        <h3>{player.name}</h3>
                        <p>{player.team}</p>
                        <span>
                          {player.age}세 <i />
                          {POSITION[player.position]} <i />
                          {player.role === 'batter' ? '우투우타' : '우완'}
                        </span>
                      </div>
                      <div className="overall">
                        <span>OVR</span>
                        <strong>{rating}</strong>
                      </div>
                    </div>
                    {player.origin && (
                      <div className="player-origin">
                        <Sparkles size={12} />
                        <span>데뷔 컨셉</span>
                        <b>
                          {
                            TALENTS[player.role].find((t) => t.id === player.origin!.archetype)
                              ?.label
                          }
                        </b>
                      </div>
                    )}
                    <Radar skills={player.skills} role={player.role} />
                    <div className="player-wallet">
                      <div>
                        <span>{player.stage === 'pro' ? '시즌 연봉' : '시즌 지원금'}</span>
                        <b>
                          {money(player.stage === 'pro' ? player.salary : 150)}
                          <small>원</small>
                        </b>
                      </div>
                      <div>
                        <span>보유 자금</span>
                        <b>
                          {money(player.money)}
                          <small>원</small>
                        </b>
                      </div>
                    </div>
                  </Panel>
                  <section className="scout-note">
                    <div>
                      <Sparkles size={17} />
                      <span>SCOUT'S NOTE</span>
                    </div>
                    <h3>
                      {rating < 65
                        ? '아직 쓰이지 않은 가능성'
                        : rating < 80
                          ? '리그가 주목하는 이름'
                          : '세계로 향하는 재능'}
                    </h3>
                    <p>
                      {rating < 65
                        ? '기본기를 쌓기에 가장 좋은 시간입니다. 꾸준한 훈련이 당신의 잠재력을 깨웁니다.'
                        : rating < 80
                          ? '성장이 기록으로 증명되고 있습니다. 자신만의 강점을 더 날카롭게 다듬어보세요.'
                          : '해외 스카우트들의 시선이 모입니다. 계약 페이지에서 새로운 무대를 확인해보세요.'}
                    </p>
                    <button onClick={() => navigate('market')}>
                      나의 진출 조건 <ArrowUpRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
              <RosterReport key={latest?.year} season={latest} />
            </>
          )}

          {page === 'training' && (
            <>
              <GoalPicker
                disabled={busy || !!saveError}
                state={state}
                onSelect={(seasonGoal) => setState({ ...state, seasonGoal })}
                onAuto={(autoEvents) => setState({ ...state, autoEvents })}
              />
              <section className="coaching-tip">
                <Target size={19} />
                <div>
                  <b>{coachingFeedback(state).title}</b>
                  <p>{coachingFeedback(state).detail}</p>
                </div>
                {trainingOpen && (
                  <button
                    className="button secondary small"
                    onClick={() => {
                      setState({ ...state, plan: coachingFeedback(state).plan });
                      notify('추천 훈련을 적용했습니다.');
                    }}
                  >
                    추천 훈련 적용
                  </button>
                )}
              </section>
              <div className="training-intro">
                <div>
                  <span className="eyebrow">OFFSEASON DEVELOPMENT</span>
                  <h2>나의 강점을 만드는 시간</h2>
                  <p>
                    육성 방향 1개와 지원 방식 1개를 선택하세요.
                    <br />
                    시즌 진행 시 성장과 비용이 한 번 적용됩니다.
                  </p>
                </div>
                <div className="budget">
                  <Wallet size={22} />
                  <span>
                    사용 가능한 예산
                    <strong>
                      {money(player.money)}
                      <small>원</small>
                    </strong>
                  </span>
                </div>
              </div>
              {!preseason && (
                <div className="info-bar">
                  <CircleHelp size={16} />
                  {state.phase === 'retired'
                    ? '은퇴한 선수는 훈련할 수 없습니다.'
                    : '시즌이 끝났습니다. 다음 시즌 준비 후 훈련을 선택할 수 있습니다.'}
                </div>
              )}
              <Panel
                title="육성 방향"
                eyebrow="01 · CHOOSE YOUR FOCUS"
                action={<span className="subtle">시즌당 1개 선택</span>}
              >
                <div className="training-grid">
                  {PLANS.map((p, i) => {
                    const labels = player.role === 'pitcher' ? PITCHER_LABELS[p.id] : undefined,
                      Icon = TRAIN_ICONS[i];
                    return (
                      <button
                        key={p.id}
                        className={`training-card ${state.plan === p.id ? 'selected' : ''}`}
                        disabled={!trainingOpen}
                        aria-pressed={state.plan === p.id}
                        onClick={() => setState({ ...state, plan: p.id })}
                      >
                        <div className="training-card-top">
                          <span>
                            <Icon size={23} strokeWidth={1.6} />
                          </span>
                          <span className="radio-mark">
                            {state.plan === p.id && <Check size={12} />}
                          </span>
                        </div>
                        <h3>{labels?.[0] ?? p.label}</h3>
                        <p>{labels?.[1] ?? p.description}</p>
                        <span className="effect-tag">{labels?.[2] ?? p.effect}</span>
                      </button>
                    );
                  })}
                </div>
              </Panel>
              <Panel title="훈련 지원" eyebrow="02 · INVEST IN YOURSELF">
                <div className="support-grid">
                  {SUPPORTS.map((s) => (
                    <button
                      key={s.id}
                      className={`support-card ${state.support === s.id ? 'selected' : ''}`}
                      disabled={!trainingOpen || player.money < trainingCost(state, s.id)}
                      aria-pressed={state.support === s.id}
                      onClick={() => setState({ ...state, support: s.id })}
                    >
                      <div>
                        <span className="radio-mark">
                          {state.support === s.id && <Check size={12} />}
                        </span>
                        <b>{s.label}</b>
                      </div>
                      <p>{s.description}</p>
                      <strong>
                        {trainingCost(state, s.id)
                          ? `${money(trainingCost(state, s.id))}원`
                          : '무료'}
                      </strong>
                      {player.money < trainingCost(state, s.id) && <small>예산 부족</small>}
                    </button>
                  ))}
                </div>
              </Panel>
              <div className="training-footer">
                <div>
                  <CheckCircle2 size={20} />
                  <span>
                    <b>{planLabel(state)}</b> ·{' '}
                    {SUPPORTS.find((s) => s.id === state.support)?.label}
                    <small>선택은 자동 저장됩니다. 시즌을 진행하면 적용됩니다.</small>
                  </span>
                </div>
                {actionButton}
              </div>
              <Panel title="능력치 리포트" eyebrow="PLAYER DEVELOPMENT">
                <div className="skill-report">
                  {(Object.keys(player.skills) as (keyof Skills)[]).map((k) => (
                    <div className="skill-row" key={k}>
                      <span>
                        {(player.role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS)[k]}
                      </span>
                      <div className="skill-track">
                        <div style={{ width: `${player.skills[k]}%` }} />
                      </div>
                      <b>{player.skills[k]}</b>
                      {latest && (
                        <span className="growth">
                          {latest.growth[k] > 0
                            ? `+${latest.growth[k]}`
                            : latest.growth[k] < 0
                              ? String(latest.growth[k])
                              : '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="fine-print">
                  선수마다 성장 잠재력이 다릅니다. 학년·나이·육성 방향에 따라 성장폭이 달라지고,
                  32세부터 노화가 반영됩니다.
                </p>
              </Panel>
            </>
          )}

          {page === 'records' && (
            <>
              <div className="page-toolbar">
                <div className="segmented">
                  <button
                    className={recordView === 'stats' && recordYear !== 'all' ? 'active' : ''}
                    aria-pressed={recordView === 'stats' && recordYear !== 'all'}
                    onClick={() => {
                      setRecordView('stats');
                      setRecordYear('latest');
                      setRecordLevel(latest?.stage === 'pro' ? 'first' : 'amateur');
                    }}
                  >
                    시즌 기록
                  </button>
                  <button
                    className={recordView === 'stats' && recordYear === 'all' ? 'active' : ''}
                    aria-pressed={recordView === 'stats' && recordYear === 'all'}
                    onClick={() => {
                      setRecordView('stats');
                      setRecordYear('all');
                    }}
                  >
                    통산 기록
                  </button>
                  <button
                    className={recordView === 'milestones' ? 'active' : ''}
                    aria-pressed={recordView === 'milestones'}
                    onClick={() => setRecordView('milestones')}
                  >
                    커리어 도전
                  </button>
                </div>
                <select
                  aria-label="기록 구분"
                  value={recordLevel}
                  onChange={(e) => setRecordLevel(e.target.value as typeof recordLevel)}
                >
                  <option value="amateur">아마추어 기록</option>
                  <option value="first">프로 1군 기록</option>
                  <option value="second">프로 2군 기록</option>
                </select>
                {recordView === 'stats' && (
                  <select
                    aria-label="기록 시즌 선택"
                    value={recordYear}
                    onChange={(e) => {
                      const year = e.target.value;
                      setRecordYear(year);
                      const season =
                        year === 'latest'
                          ? latest
                          : state.history.find((h) => String(h.year) === year);
                      if (year !== 'all' && season)
                        setRecordLevel(
                          season.stage === 'pro'
                            ? recordLevel === 'second'
                              ? 'second'
                              : 'first'
                            : 'amateur',
                        );
                    }}
                  >
                    <option value="latest">최근 시즌</option>
                    <option value="all">통산 전체</option>
                    {[...state.history].reverse().map((h) => (
                      <option key={h.year} value={h.year}>
                        {h.year} · {stageLabel(h)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {recordView === 'milestones' ? (
                <CareerRecords
                  key={recordLevel}
                  history={state.history}
                  role={player.role}
                  level={recordLevel}
                />
              ) : (
                <>
                  <StatCards {...recordStats} role={player.role} empty={!state.history.length} />
                  <Panel
                    title={
                      recordYear === 'all'
                        ? '통산 상세 기록'
                        : `${recordSeason?.year ?? state.year} 상세 기록`
                    }
                    eyebrow={
                      player.role === 'batter' ? 'BATTING STATISTICS' : 'PITCHING STATISTICS'
                    }
                    action={
                      <span className="subtle">
                        {recordYear === 'all'
                          ? `${recordLevel === 'first' ? '1군' : recordLevel === 'second' ? '2군' : '아마추어'} 합산`
                          : (recordSeason?.team ?? '시즌 진행 전')}
                      </span>
                    }
                  >
                    {state.history.length ? (
                      <DetailedStats
                        batting={recordStats.batting}
                        pitching={recordStats.pitching}
                        role={player.role}
                      />
                    ) : (
                      <Empty
                        title="첫 기록을 기다리고 있어요"
                        description="클럽하우스에서 시즌을 진행하면 상세 기록이 쌓입니다."
                      />
                    )}
                  </Panel>
                  <Panel title="연도별 기록" eyebrow="SEASON BY SEASON">
                    <HistoryTable
                      key={recordLevel}
                      history={state.history
                        .filter((h) =>
                          recordLevel === 'amateur' ? h.stage !== 'pro' : h.stage === 'pro',
                        )
                        .map((h) =>
                          recordLevel === 'second'
                            ? { ...h, batting: h.minorBatting, pitching: h.minorPitching, war: 0 }
                            : h,
                        )}
                      role={player.role}
                    />
                  </Panel>
                  <div className="info-bar">
                    <CircleHelp size={16} />
                    <span>
                      타율·OPS 등 비율 기록은 합산한 원시 기록으로 다시 계산합니다. WAR·wRC+·FIP는
                      이 게임의 간이 지표입니다.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {page === 'leaders' && (
            <>
              <div className="page-toolbar">
                <div className="segmented">
                  {(['standings', 'batting', 'pitching'] as const).map((t, i) => (
                    <button
                      key={t}
                      className={leagueTab === t ? 'active' : ''}
                      onClick={() => setLeagueTab(t)}
                    >
                      {['구단 순위', '타자 순위', '투수 순위'][i]}
                    </button>
                  ))}
                </div>
                <span className="subtle">
                  {latest
                    ? `${latest.year} ${latest.league} · 최종 결과`
                    : '아직 진행한 시즌이 없습니다'}
                </span>
              </div>
              <Panel
                title={
                  leagueTab === 'standings'
                    ? '정규시즌 구단 순위'
                    : leagueTab === 'batting'
                      ? '타자 리더보드'
                      : '투수 리더보드'
                }
                eyebrow="LEAGUE LEADERS"
              >
                {leagueTab === 'standings' ? (
                  <Standings season={latest} team={latest?.team ?? player.team} />
                ) : latest ? (
                  <LeaderTable
                    leaders={latest.leaders}
                    role={leagueTab === 'batting' ? 'batter' : 'pitcher'}
                    games={SEASON_GAMES[latest.league]}
                  />
                ) : (
                  <Empty
                    title="리그의 첫 페이지"
                    description="시즌을 완료하면 가상 선수들과 나의 순위를 확인할 수 있습니다."
                  />
                )}
              </Panel>
              <p className="fine-print">
                가상 리그 시뮬레이션입니다. 구단은 전체, 개인 순위는 팀별 대표 선수 표본입니다.
                MVP·골든글러브는 WAR, 타격왕·ERA 타이틀은 규정 출장 기준으로 선정합니다.
              </p>
            </>
          )}

          {page === 'awards' && (
            <>
              {latest ? (
                <>
                  <section className="awards-banner">
                    <Trophy size={46} strokeWidth={1.2} />
                    <div>
                      <span className="eyebrow">
                        {latest.year} {latest.league} ANNUAL AWARDS
                      </span>
                      <h2>한 해의 가장 빛나는 이름들</h2>
                      <p>
                        올해의 나의 수상 <b>{latest.awards.filter((a) => a.mine).length}개</b> ·
                        통산{' '}
                        <b>
                          {state.history.flatMap((h) => h.awards.filter((a) => a.mine)).length}개
                        </b>
                      </p>
                    </div>
                    <span className="award-year">{latest.year}</span>
                  </section>
                  <div className="award-grid">
                    {latest.awards.map((a) => (
                      <section className={`award-card ${a.mine ? 'mine' : ''}`} key={a.title}>
                        <div>
                          <Trophy size={25} strokeWidth={1.3} />
                          {a.mine && <span className="badge">MY AWARD</span>}
                        </div>
                        <span className="award-title">{a.title}</span>
                        <h3>{a.winner}</h3>
                        <p>{a.team}</p>
                        <strong>{a.detail}</strong>
                      </section>
                    ))}
                  </div>
                  <Panel title="나의 트로피 캐비닛" eyebrow="MY TROPHY CABINET">
                    {state.history.some((h) => h.awards.some((a) => a.mine)) ? (
                      <div className="trophy-list">
                        {[...state.history].reverse().flatMap((h) =>
                          h.awards
                            .filter((a) => a.mine)
                            .map((a) => (
                              <div key={`${h.year}-${a.title}`}>
                                <span className="trophy-icon">
                                  <Trophy size={19} />
                                </span>
                                <div>
                                  <b>{a.title}</b>
                                  <p>
                                    {h.year} · {stageLabel(h)} · {a.detail}
                                  </p>
                                </div>
                              </div>
                            )),
                        )}
                      </div>
                    ) : (
                      <Empty
                        title="트로피를 위한 자리를 비워뒀습니다"
                        description="꾸준한 성장 끝에, 당신의 이름이 불리는 날이 올 거예요."
                        icon={Trophy}
                      />
                    )}
                  </Panel>
                </>
              ) : (
                <Panel title="시즌 시상식" eyebrow="ANNUAL AWARDS">
                  <Empty
                    title="스포트라이트는 시즌이 끝나면 켜집니다"
                    description="첫 시즌을 완료하고 리그를 빛낸 선수들을 만나보세요."
                    icon={Trophy}
                  />
                </Panel>
              )}
            </>
          )}

          {page === 'market' && (
            <SelectionCenter
              key={`selection-${state.year}`}
              state={state}
              busy={busy || !!saveError}
              onChange={setState}
            />
          )}
          {page === 'market' &&
            (player.stage === 'pro' ? (
              <>
                <LifeOverview
                  state={state}
                  onOpen={() =>
                    document.querySelector('.roster-report')?.scrollIntoView({ behavior: 'smooth' })
                  }
                />
                <KboContractRules state={state} busy={busy || !!saveError} onChange={setState} />
                <SalaryNegotiation
                  key={state.year}
                  state={state}
                  busy={busy || !!saveError}
                  onChange={setState}
                />
                <Market
                  busy={busy || !!saveError}
                  state={state}
                  onSelect={(id) => setState({ ...state, selectedOffer: id })}
                />
                <RosterReport key={latest?.year} season={latest} />
              </>
            ) : (
              <CareerPath
                busy={busy || !!saveError}
                key={state.year}
                state={state}
                onChange={setState}
              />
            ))}

          {page === 'career' && (
            <>
              <div className="career-summary">
                <div>
                  <span>PRO SEASONS</span>
                  <strong>
                    {state.history.filter((h) => h.stage === 'pro').length}
                    <small>시즌</small>
                  </strong>
                </div>
                <div>
                  <span>CAREER WAR</span>
                  <strong>{total.war.toFixed(1)}</strong>
                </div>
                <div>
                  <span>TROPHIES</span>
                  <strong>
                    {state.history.flatMap((h) => h.awards.filter((a) => a.mine)).length}
                    <small>개</small>
                  </strong>
                </div>
                <div>
                  <span>LEAGUES PLAYED</span>
                  <strong>
                    {
                      new Set(state.history.filter((h) => h.stage === 'pro').map((h) => h.league))
                        .size
                    }
                    <small>/ 3</small>
                  </strong>
                </div>
              </div>
              <Panel title="나의 야구 연대기" eyebrow="THE STORY SO FAR">
                {state.history.length ? (
                  <div className="timeline">
                    {[...state.history].reverse().map((h, i) => (
                      <div className="timeline-item" key={h.year}>
                        <div className="timeline-year">
                          <span>{h.year}</span>
                          <small>{h.age}세</small>
                        </div>
                        <span className="timeline-dot" />
                        <div className="timeline-content">
                          <div>
                            <span className="badge neutral">
                              {LEAGUE_LABELS[h.league]} · {stageLabel(h)}
                            </span>
                            {state.history[state.history.length - i - 2]?.league !== h.league && (
                              <span className="timeline-debut">
                                {i === state.history.length - 1
                                  ? '야구 인생 시작'
                                  : h.stage === 'pro'
                                    ? '프로 무대 진입'
                                    : '새로운 무대 도전'}
                              </span>
                            )}
                          </div>
                          <h3>
                            {h.team}
                            <span>OVR {h.overall}</span>
                          </h3>
                          <p>
                            {h.stage === 'pro' && '1군 · '}
                            {h.role === 'batter'
                              ? `${h.batting.g}경기 · 타율 ${decimal(battingRates(h.batting).avg)} · ${h.batting.hr}홈런 · ${h.batting.rbi}타점`
                              : `${h.pitching.w}승 ${h.pitching.l}패 · ERA ${pitchingRates(h.pitching).era.toFixed(2)} · ${h.pitching.so}K`}{' '}
                            · WAR {h.war.toFixed(1)}
                          </p>
                          {h.stage === 'pro' && (
                            <small>
                              {h.role === 'batter'
                                ? `2군 · ${h.minorBatting.g}경기 · 타율 ${decimal(battingRates(h.minorBatting).avg)} · ${h.minorBatting.hr}홈런`
                                : `2군 · ${h.minorPitching.g}등판 · ${innings(h.minorPitching.outs)}이닝 · ERA ${pitchingRates(h.minorPitching).era.toFixed(2)}`}
                            </small>
                          )}
                          {h.awards.some((a) => a.mine) && (
                            <div className="timeline-awards">
                              <Trophy size={13} />
                              {h.awards
                                .filter((a) => a.mine)
                                .map((a) => a.title)
                                .join(' · ')}
                            </div>
                          )}
                          <small>{h.notes[1]}</small>
                          {h.selections?.map((r) => (
                            <div className="timeline-story" key={r.kind}>
                              <b>
                                {r.label} · {r.selected ? '선발' : '탈락'}
                              </b>
                              <span>선발 확률 {Math.round(r.probability * 100)}%</span>
                            </div>
                          ))}
                          {h.negotiation && (
                            <div className="timeline-story">
                              <b>연봉 재협상 {h.negotiation.accepted ? '수락' : '거절'}</b>
                              <span>
                                {money(h.negotiation.originalOffer)}원 → 요청{' '}
                                {money(h.negotiation.requested)}원 · 수락 확률{' '}
                                {Math.round(h.negotiation.probability * 100)}%
                              </span>
                            </div>
                          )}
                          {!!h.militaryMonths && (
                            <div className="timeline-story">
                              상무 복무 {h.militaryMonths}개월 · 복무 중 1군 등록 제외
                            </div>
                          )}
                          {(h.goal || h.story) && (
                            <div className="timeline-story">
                              {h.goal && (
                                <b>
                                  {h.goal.achieved ? '목표 달성' : '시즌 목표'} · {h.goal.label} (
                                  {h.goal.current}/{h.goal.target} {h.goal.unit})
                                </b>
                              )}
                              {h.story && (
                                <span>
                                  {h.story.title} → {h.story.label}
                                </span>
                              )}
                            </div>
                          )}
                          {h.draft && (
                            <div className="timeline-draft">
                              <GraduationCap size={14} />
                              <span>
                                {h.draft.outcome === 'selected'
                                  ? `${h.draft.team} ${h.draft.round}라운드 지명 · 계약금 ${money(h.draft.bonus)}원`
                                  : h.draft.reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="모든 전설은 신인에서 시작하니까"
                    description="당신의 첫 시즌이 이곳에 기록될 거예요."
                    icon={History}
                  />
                )}
              </Panel>
              <Panel title="커리어 데이터 관리" eyebrow="KEEP YOUR LEGACY">
                <div className="data-management">
                  <div>
                    <h3>소중한 기록을 안전하게</h3>
                    <p>
                      기록은 이 브라우저에 저장됩니다. 브라우저 데이터를 지우기 전에 백업해주세요.
                    </p>
                  </div>
                  <div>
                    <button className="button secondary" onClick={backup}>
                      <Download size={16} />
                      백업 다운로드
                    </button>
                    <button className="button secondary" onClick={() => inputRef.current?.click()}>
                      <Upload size={16} />
                      백업 불러오기
                    </button>
                  </div>
                </div>
              </Panel>
            </>
          )}
          {reviewing && (
            <nav className="review-pagination" aria-label="시즌 결산 페이지 이동">
              <button
                className="button secondary"
                disabled={reviewIndex === 0 || busy}
                onClick={() => reviewNavigate(REVIEW_STEPS[reviewIndex - 1].page)}
              >
                이전 단계
              </button>
              <span aria-live="polite">
                {reviewIndex + 1} / {REVIEW_STEPS.length}
                <small>{REVIEW_STEPS[reviewIndex].label}</small>
              </span>
              {reviewIndex < REVIEW_STEPS.length - 1 ? (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => reviewNavigate(REVIEW_STEPS[reviewIndex + 1].page)}
                >
                  {REVIEW_STEPS[reviewIndex + 1].label} <ArrowRight size={16} />
                </button>
              ) : state.phase === 'retired' ? (
                <button className="button primary" onClick={() => navigate('career')}>
                  커리어 돌아보기 <ArrowRight size={16} />
                </button>
              ) : (
                <button className="button primary" disabled={busy || !!saveError} onClick={advance}>
                  {nextLabel} <ArrowRight size={16} />
                </button>
              )}
            </nav>
          )}
          {(page === 'home' || page === 'training') && state.phase !== 'retired' && !mobileNav && (
            <div className="mobile-season-action" aria-label="시즌 진행 빠른 실행">
              {actionButton}
            </div>
          )}
          <footer className="footer">
            <span>한 시즌, 한 걸음, 하나의 전설.</span>
            <div>
              <button onClick={backup}>
                <Download size={13} />
                백업
              </button>
              <span>ROAD TO LEGEND © 2026</span>
              <Baseball />
            </div>
          </footer>
        </main>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="저장 파일 선택"
        onChange={(e) => void importSave(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button aria-label="알림 닫기" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (hasCareer && !busy) setModal(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {hasCareer && (
              <button
                className="modal-close icon-button"
                aria-label="대화상자 닫기"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                <X size={22} />
              </button>
            )}
            {modal === 'event' && state.seasonEvent ? (
              <SeasonEvent state={state} busy={busy} onChoose={finishEvent} />
            ) : modal === 'new' ? (
              <>
                <CareerCreation replacing={hasCareer} onStart={newCareer} />
                {!hasCareer && (
                  <div className="creation-import">
                    <button onClick={() => inputRef.current?.click()}>
                      <Upload size={13} />
                      저장한 커리어 불러오기
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="eyebrow">HOW TO PLAY</span>
                <h2 id="modal-title">당신의 야구 인생을 즐기는 법</h2>
                <div className="guide-steps">
                  {[
                    [
                      '01',
                      '세 장의 카드에서 출발점을 고르세요',
                      '이름과 선호 팀을 정한 뒤 카드 3장을 한 장씩 뒤집으세요. 컨셉과 무작위 능력치를 비교해 1장을 선택하고, 시즌 전 육성 방향을 정하세요.',
                    ],
                    [
                      '02',
                      '한 번의 클릭, 한 시즌',
                      '시즌 목표와 훈련을 정하고 진행하세요. 전반기 후 중요한 사건을 선택하면 후반기에 반영됩니다. 자동 선택으로 한 번에 진행할 수도 있습니다.',
                    ],
                    [
                      '03',
                      '결산부터 다음 무대까지',
                      '시즌 결산 → 기록 → 시상식 → 진로·계약 순서로 돌아보세요. 진로를 정한 뒤 다음 시즌을 준비하면 목표와 훈련을 다시 선택할 수 있습니다.',
                    ],
                    [
                      '04',
                      '나만의 전설을 남기세요',
                      '고교·대학·2군 기록과 1군 기록은 따로 보관합니다. 해외 진출에는 1군 등록 경력이 필요하며, 40세 시즌 후 은퇴합니다.',
                    ],
                  ].map(([num, title, text]) => (
                    <div key={num}>
                      <span>{num}</span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="fine-print">
                  개인용 초기 버전입니다. 리그·구단·선수는 시뮬레이션용이며 일정·계약·수상 조건은
                  게임 규칙으로 단순화되어 있습니다. 투타겸업, 포스트시즌, FA 보상, 실제 구단
                  로스터는 아직 지원하지 않습니다.
                </p>
                <button className="button primary" onClick={() => setModal(null)}>
                  그라운드로 돌아가기 <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function DetailedStats({
  batting: b,
  pitching: p,
  role,
}: {
  batting: Batting;
  pitching: Pitching;
  role: Role;
}) {
  const br = battingRates(b),
    pr = pitchingRates(p);
  const groups: { label: string; stats: [string, string | number, string][] }[] =
    role === 'batter'
      ? [
          {
            label: '출장 · 타격',
            stats: [
              ['G', b.g, '경기'],
              ['PA', b.pa, '타석'],
              ['AB', b.ab, '타수'],
              ['H', b.h, '안타'],
              ['2B', b.doubles, '2루타'],
              ['3B', b.triples, '3루타'],
              ['HR', b.hr, '홈런'],
              ['TB', b.h + b.doubles + 2 * b.triples + 3 * b.hr, '총루타'],
            ],
          },
          {
            label: '생산력 · 주루',
            stats: [
              ['R', b.r, '득점'],
              ['RBI', b.rbi, '타점'],
              ['BB', b.bb, '볼넷'],
              ['HBP', b.hbp, '사구'],
              ['SO', b.so, '삼진'],
              ['SB', b.sb, '도루'],
              ['CS', b.cs, '도루 실패'],
              ['GDP', b.gdp, '병살타'],
            ],
          },
          {
            label: '세부 지표',
            stats: [
              ['AVG', decimal(br.avg), '타율'],
              ['OBP', decimal(br.obp), '출루율'],
              ['SLG', decimal(br.slg), '장타율'],
              ['OPS', decimal(br.ops), '출루 + 장타'],
              ['ISO', decimal(br.iso), '순장타율'],
              ['BABIP', decimal(br.babip), '인플레이 타율'],
              ['wRC+', br.wrc, '조정 득점 생산력 · 간이'],
              ['SF / SH', `${b.sf} / ${b.sh}`, '희생플라이 / 번트'],
            ],
          },
        ]
      : [
          {
            label: '출장 · 결과',
            stats: [
              ['G', p.g, '등판'],
              ['GS', p.gs, '선발'],
              ['IP', innings(p.outs), '투구 이닝'],
              ['W', p.w, '승리'],
              ['L', p.l, '패배'],
              ['SV', p.sv, '세이브'],
              ['HLD', p.hld, '홀드'],
              ['BF', p.bf, '상대 타자'],
            ],
          },
          {
            label: '투구 내용',
            stats: [
              ['H', p.h, '피안타'],
              ['HR', p.hr, '피홈런'],
              ['R', p.r, '실점'],
              ['ER', p.er, '자책점'],
              ['BB', p.bb, '볼넷'],
              ['SO', p.so, '탈삼진'],
              ['HBP', p.hbp, '사구'],
              ['WP', p.wp, '폭투'],
            ],
          },
          {
            label: '세부 지표',
            stats: [
              ['ERA', pr.era.toFixed(2), '평균자책점'],
              ['WHIP', pr.whip.toFixed(2), '이닝당 출루'],
              ['K/9', pr.k9.toFixed(2), '9이닝당 삼진'],
              ['BB/9', pr.bb9.toFixed(2), '9이닝당 볼넷'],
              ['K/BB', p.bb ? (p.so / p.bb).toFixed(2) : '—', '삼진 / 볼넷'],
              ['FIP', pr.fip.toFixed(2), '수비 무관 투구 · 간이'],
            ],
          },
        ];
  return (
    <div className="detailed-stats">
      {groups.map((g) => (
        <div className="stat-group" key={g.label}>
          <h3>{g.label}</h3>
          <div>
            {g.stats.map(([key, value, desc]) => (
              <div key={key} className="detail-stat">
                <span title={desc}>{key}</span>
                <strong>{value}</strong>
                <small>{desc}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function HistoryTable({ history, role }: { history: Season[]; role: Role }) {
  const pager = usePagination(history.length, `${role}-${history.length}`);

  if (!history.length)
    return (
      <Empty
        title="아직 작성되지 않은 기록표"
        description="첫 시즌부터 은퇴까지, 모든 기록이 이곳에 남습니다."
      />
    );
  return (
    <>
      <div className="table-scroll">
        <table className="records-table">
          <thead>
            <tr>
              {[
                '시즌',
                '나이',
                '리그',
                '구단',
                ...(role === 'batter'
                  ? ['G', 'AVG', 'OBP', 'SLG', 'OPS', 'H', 'HR', 'RBI', 'SB']
                  : ['G', 'IP', 'W', 'L', 'SV', 'ERA', 'WHIP', 'SO', 'BB']),
                'WAR',
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history]
              .reverse()
              .slice(pager.start, pager.start + pager.size)
              .map((h) => {
                const b = battingRates(h.batting),
                  p = pitchingRates(h.pitching);
                return (
                  <tr key={h.year}>
                    <td>
                      <b>{h.year}</b>
                    </td>
                    <td>{h.age}</td>
                    <td>
                      <span className="league-label">{h.league}</span>
                    </td>
                    <td>{h.team}</td>
                    {(role === 'batter'
                      ? [
                          h.batting.g,
                          decimal(b.avg),
                          decimal(b.obp),
                          decimal(b.slg),
                          decimal(b.ops),
                          h.batting.h,
                          h.batting.hr,
                          h.batting.rbi,
                          h.batting.sb,
                        ]
                      : [
                          h.pitching.g,
                          innings(h.pitching.outs),
                          h.pitching.w,
                          h.pitching.l,
                          h.pitching.sv,
                          p.era.toFixed(2),
                          p.whip.toFixed(2),
                          h.pitching.so,
                          h.pitching.bb,
                        ]
                    ).map((v, i) => (
                      <td key={i}>{v}</td>
                    ))}
                    <td>
                      <b>{h.war.toFixed(1)}</b>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <Pagination {...pager} total={history.length} onChange={pager.setPage} label="연도별 기록" />
    </>
  );
}
function LeaderTable({ leaders, role, games }: { leaders: Leader[]; role: Role; games: number }) {
  const [sort, setSort] = useState('war');
  const keys =
    role === 'batter'
      ? ['war', 'avg', 'hr', 'rbi', 'ops', 'sb']
      : ['war', 'era', 'w', 'so', 'whip', 'sv'];
  const effectiveSort = keys.includes(sort) ? sort : 'war';
  const value = (p: Leader, k: string): number =>
    k === 'war'
      ? p.war
      : role === 'batter'
        ? k in battingRates(p.batting)
          ? battingRates(p.batting)[k as keyof ReturnType<typeof battingRates>]
          : p.batting[k as keyof Batting]
        : k in pitchingRates(p.pitching)
          ? pitchingRates(p.pitching)[k as keyof ReturnType<typeof pitchingRates>]
          : p.pitching[k as keyof Pitching];
  const [qualified, setQualified] = useState(false);
  const rows = leaders
    .filter(
      (p) =>
        p.role === role &&
        (!qualified ||
          (role === 'batter' ? p.batting.pa >= games * 3.1 : p.pitching.outs >= games * 3)),
    )
    .sort(
      (a, b) =>
        (['era', 'whip'].includes(effectiveSort) ? 1 : -1) *
        (value(a, effectiveSort) - value(b, effectiveSort)),
    );
  const pager = usePagination(rows.length, `${role}-${effectiveSort}-${qualified}-${games}`);
  const lower = ['avg', 'ops'];
  return (
    <>
      <div className="leader-toolbar">
        <label>
          <input
            type="checkbox"
            checked={qualified}
            onChange={(e) => setQualified(e.target.checked)}
          />
          규정 {role === 'batter' ? '타석' : '이닝'} 충족 선수만
        </label>
        <span>열 이름을 누르면 정렬됩니다</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>선수</th>
              <th>구단</th>
              {keys.map((k) => (
                <th
                  key={k}
                  aria-sort={
                    effectiveSort === k
                      ? ['era', 'whip'].includes(k)
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    className={effectiveSort === k ? 'sorted' : ''}
                    onClick={() => setSort(k)}
                  >
                    {k.toUpperCase()}
                    {effectiveSort === k &&
                      (['era', 'whip'].includes(k) ? (
                        <ArrowUp size={11} />
                      ) : (
                        <ArrowDown size={11} />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(pager.start, pager.start + pager.size).map((p, i) => (
              <tr className={p.mine ? 'my-row' : ''} key={`${p.team}-${p.name}-${p.position}`}>
                <td>
                  <span className={`rank ${pager.start + i === 0 ? 'first' : ''}`}>
                    {pager.start + i + 1}
                  </span>
                </td>
                <td>
                  <b>{p.name}</b> {p.mine && <span className="you">MY</span>}
                </td>
                <td>{p.team}</td>
                {keys.map((k) => (
                  <td key={k}>
                    {lower.includes(k)
                      ? decimal(value(p, k))
                      : ['era', 'whip'].includes(k)
                        ? value(p, k).toFixed(2)
                        : k === 'war'
                          ? value(p, k).toFixed(1)
                          : value(p, k)}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3 + keys.length} className="empty-table">
                  조건을 충족한 선수가 없습니다. 규정 출장 필터를 해제해보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...pager} total={rows.length} onChange={pager.setPage} label="개인 순위" />
      <p className="fine-print">
        규정 타석: 팀 경기 수 × 3.1 · 규정 이닝: 팀 경기 수 × 1. 리더보드는 가상 대표 선수 표본을
        비교합니다.
      </p>
    </>
  );
}
function Market({
  busy,
  state,
  onSelect,
}: {
  state: GameState;
  busy: boolean;
  onSelect: (id: string) => void;
}) {
  const p = state.player;
  return (
    <>
      <section className="market-contract">
        <div className="contract-icon">
          <Globe2 size={32} strokeWidth={1.2} />
        </div>
        <div>
          <span className="eyebrow">CURRENT CONTRACT</span>
          <h2>
            {p.team}
            <span className="league-label">{p.league}</span>
          </h2>
          <p>
            {p.name} · {POSITION[p.position]} · 1년 단위 계약
          </p>
        </div>
        <div className="contract-salary">
          <span>시즌 연봉</span>
          <strong>
            {money(p.salary)}
            <small>원</small>
          </strong>
        </div>
      </section>
      <Panel
        title="다음 시즌 계약 제안"
        eyebrow="YOUR NEXT DESTINATION"
        action={
          <span className="subtle">
            {state.phase === 'offseason'
              ? `${state.offers.length}개 제안 도착`
              : '시즌 종료 후 오픈'}
          </span>
        }
      >
        {state.phase === 'offseason' ? (
          <>
            <div className="offer-grid">
              {state.offers.map((o) => (
                <button
                  key={o.id}
                  className={`offer-card ${state.selectedOffer === o.id ? 'selected' : ''}`}
                  disabled={busy}
                  aria-pressed={state.selectedOffer === o.id}
                  onClick={() => onSelect(o.id)}
                >
                  <div>
                    <span className="league-label">{o.league}</span>
                    <span className="radio-mark">
                      {state.selectedOffer === o.id && <Check size={12} />}
                    </span>
                  </div>
                  <span className="offer-route">{o.route}</span>
                  <h3>{o.team}</h3>
                  <strong>
                    {money(o.salary)}
                    <small>원 / 년</small>
                  </strong>
                  <p>
                    {o.league !== p.league
                      ? '새로운 리그에서의 도전'
                      : o.team === p.team
                        ? '익숙한 그라운드에서 이어가는 이야기'
                        : '새로운 유니폼으로 시작하는 다음 장'}
                  </p>
                </button>
              ))}
            </div>
            <div className="market-confirm">
              <p>
                선택한 계약은 <b>다음 시즌 준비</b>를 누르면 적용됩니다.
              </p>
            </div>
          </>
        ) : (
          <Empty
            title={
              state.phase === 'retired'
                ? '모든 계약을 마친 전설'
                : '좋은 기록이 좋은 제안을 만듭니다'
            }
            description={
              state.phase === 'retired'
                ? '은퇴한 선수는 새로운 계약을 맺지 않습니다.'
                : '이번 시즌을 완료하면 재계약과 이적 제안이 도착합니다.'
            }
            icon={Globe2}
          />
        )}
      </Panel>
    </>
  );
}
