import { z } from 'zod';

export type League = 'HS' | 'COLLEGE' | 'IND' | 'KBO' | 'NPB' | 'MLB';
export type CareerStage = 'highschool' | 'college' | 'independent' | 'pro';
export type Squad = 'first' | 'second';
export type Role = 'batter' | 'pitcher';
export type Plan = 'balanced' | 'contact' | 'power' | 'speed' | 'fielding' | 'mental' | 'recovery';
export type Support = 'club' | 'coach' | 'data' | 'conditioning';
export const SEASON_GAMES: Record<League, number> = {
  HS: 30,
  COLLEGE: 42,
  IND: 60,
  KBO: 144,
  NPB: 143,
  MLB: 162,
};
export const LEAGUE_LABELS: Record<League, string> = {
  HS: '고교야구',
  COLLEGE: '대학야구',
  IND: '독립야구',
  KBO: 'KBO',
  NPB: 'NPB',
  MLB: 'MLB',
};
export const TEAMS: Record<League, string[]> = {
  HS: [
    '서울제일고',
    '부산해양고',
    '인천청라고',
    '대구중앙고',
    '광주무등고',
    '대전한빛고',
    '수원성곽고',
    '창원용마고',
  ],
  COLLEGE: [
    '한강대학교',
    '태양대학교',
    '동해대학교',
    '백두대학교',
    '무등대학교',
    '한빛대학교',
    '남해대학교',
    '청운대학교',
  ],
  IND: [
    '서울 챌린저스',
    '고양 원더스',
    '성남 드림즈',
    '연천 미라클',
    '화성 파이오니어스',
    '파주 브레이브스',
  ],
  KBO: [
    '서울 타이탄즈',
    '부산 마리너스',
    '인천 웨이브스',
    '대구 피닉스',
    '광주 타이거스',
    '대전 이글스',
    '수원 위저즈',
    '창원 다이노스',
    '잠실 베어스',
    '고척 히어로즈',
  ],
  NPB: [
    '도쿄 사무라이',
    '오사카 블레이즈',
    '후쿠오카 호크스',
    '요코하마 스타즈',
    '나고야 드래곤즈',
    '히로시마 레즈',
    '삿포로 파이터즈',
    '센다이 이글스',
    '지바 마린즈',
    '사이타마 라이온즈',
    '고베 버펄로즈',
    '도쿄 스왈로즈',
  ],
  MLB: [
    '뉴욕 엠파이어',
    'LA 스타즈',
    '보스턴 레드삭스',
    '시카고 컵스',
    '샌디에이고 파드리스',
    '샌프란시스코 자이언츠',
    '시애틀 매리너스',
    '텍사스 레인저스',
    '휴스턴 아스트로스',
    '애틀랜타 브레이브스',
    '필라델피아 필리스',
    '뉴욕 메츠',
    '마이애미 말린스',
    '워싱턴 내셔널스',
    '밀워키 브루어스',
    '신시내티 레즈',
    '피츠버그 파이리츠',
    '세인트루이스 카디널스',
    '콜로라도 로키스',
    '애리조나 다이아몬드백스',
    'LA 에인절스',
    '오클랜드 애슬레틱스',
    '미네소타 트윈스',
    '클리블랜드 가디언스',
    '디트로이트 타이거스',
    '캔자스시티 로열스',
    '볼티모어 오리올스',
    '탬파베이 레이스',
    '토론토 블루제이스',
    '시카고 화이트삭스',
  ],
};
export const PLANS: { id: Plan; label: string; description: string; effect: string }[] = [
  {
    id: 'balanced',
    label: '균형 성장',
    description: '기본기에 집중하는 탄탄한 한 해',
    effect: '모든 능력치 고르게 성장',
  },
  {
    id: 'contact',
    label: '정교한 타격',
    description: '스윙 궤적과 타이밍을 다듬습니다',
    effect: '컨택 집중 · 선구안 보조',
  },
  {
    id: 'power',
    label: '장타력 강화',
    description: '담장 너머를 향한 파워 트레이닝',
    effect: '파워 집중 · 컨택 보조',
  },
  {
    id: 'speed',
    label: '주루 특화',
    description: '첫 발부터 달라지는 베이스 러닝',
    effect: '스피드 집중 · 수비 보조',
  },
  {
    id: 'fielding',
    label: '수비 마스터',
    description: '실점을 지우는 확실한 글러브',
    effect: '수비 집중 · 스피드 보조',
  },
  {
    id: 'mental',
    label: '멘탈 코칭',
    description: '중요한 순간에도 흔들리지 않도록',
    effect: '멘탈 집중 · 선구안 보조',
  },
  {
    id: 'recovery',
    label: '회복과 관리',
    description: '멀리 가기 위해 몸을 돌봅니다',
    effect: '부상 확률 감소 · 성장량 감소',
  },
];
export const PITCHER_LABELS: Partial<Record<Plan, [string, string, string]>> = {
  contact: ['제구력 연마', '스트라이크 존을 정교하게 공략합니다', '제구 집중 · 멘탈 보조'],
  power: ['구속 향상', '타자를 압도하는 강한 패스트볼', '구위 집중 · 체력 보조'],
  speed: ['체력 강화', '긴 이닝을 책임지는 지구력', '체력 집중 · 구위 보조'],
  fielding: ['변화구 연구', '타자의 타이밍을 빼앗는 결정구', '변화구 집중 · 제구 보조'],
  mental: ['멘탈 코칭', '중요한 순간에도 흔들리지 않도록', '멘탈 집중 · 위기 관리 보조'],
};
export const SUPPORTS: { id: Support; label: string; cost: number; description: string }[] = [
  { id: 'club', label: '소속팀 훈련', cost: 0, description: '기본 훈련 시설을 이용합니다.' },
  {
    id: 'coach',
    label: '개인 코치',
    cost: 2500,
    description: '집중 성장 +2. 균형·회복은 모든 능력 +0.65.',
  },
  { id: 'data', label: '데이터 분석', cost: 1200, description: '선구안/제구와 멘탈에 성장 +1.' },
  {
    id: 'conditioning',
    label: '컨디셔닝 센터',
    cost: 1800,
    description: '부상 확률을 절반으로 낮춥니다.',
  },
];

const stat = z.number().finite().nonnegative();
const skillsSchema = z.object({
  contact: stat.max(99),
  power: stat.max(99),
  speed: stat.max(99),
  fielding: stat.max(99),
  discipline: stat.max(99),
  mental: stat.max(99),
});
const delta = z.number().finite().int().min(-99).max(99);
const growthSchema = z.object({
  contact: delta,
  power: delta,
  speed: delta,
  fielding: delta,
  discipline: delta,
  mental: delta,
});
export type Skills = z.infer<typeof skillsSchema>;
const archetypeSchema = z.enum([
  'slugger',
  'defender',
  'runner',
  'balanced',
  'fireballer',
  'control',
  'breaking',
]);
export type Archetype = z.infer<typeof archetypeSchema>;
export type TalentCard = { id: string; role: Role; archetype: Archetype; skills: Skills };
export type TalentDraft = { role: Role; cards: TalentCard[]; seed: number };
export const TALENTS: Record<
  Role,
  { id: Archetype; label: string; description: string; skills: Skills }[]
> = {
  batter: [
    {
      id: 'slugger',
      label: '거포형',
      description: '한 번의 스윙으로 경기의 흐름을 바꾸는 타자',
      skills: { contact: 40, power: 60, speed: 28, fielding: 35, discipline: 48, mental: 47 },
    },
    {
      id: 'defender',
      label: '수비형',
      description: '단단한 글러브로 팀의 실점을 지우는 선수',
      skills: { contact: 38, power: 30, speed: 46, fielding: 60, discipline: 40, mental: 44 },
    },
    {
      id: 'runner',
      label: '주루형',
      description: '빠른 발과 과감한 주루로 기회를 만드는 선수',
      skills: { contact: 43, power: 26, speed: 63, fielding: 46, discipline: 40, mental: 40 },
    },
    {
      id: 'balanced',
      label: '균등형',
      description: '모든 기본기를 고르게 갖춘 다재다능한 선수',
      skills: { contact: 43, power: 43, speed: 43, fielding: 43, discipline: 43, mental: 43 },
    },
  ],
  pitcher: [
    {
      id: 'fireballer',
      label: '강속구형',
      description: '타자의 배트를 밀어내는 압도적인 구위',
      skills: { contact: 34, power: 62, speed: 48, fielding: 38, discipline: 34, mental: 42 },
    },
    {
      id: 'control',
      label: '제구형',
      description: '스트라이크 존의 구석을 파고드는 정교함',
      skills: { contact: 62, power: 34, speed: 38, fielding: 43, discipline: 48, mental: 33 },
    },
    {
      id: 'breaking',
      label: '변화구형',
      description: '예측할 수 없는 궤적으로 타이밍을 빼앗는 투수',
      skills: { contact: 42, power: 35, speed: 38, fielding: 62, discipline: 43, mental: 38 },
    },
    {
      id: 'balanced',
      label: '균등형',
      description: '구위와 제구, 경기 운영까지 고르게 갖춘 투수',
      skills: { contact: 43, power: 43, speed: 43, fielding: 43, discipline: 43, mental: 43 },
    },
  ],
};
const batSchema = z.object({
  g: stat.int(),
  pa: stat.int(),
  ab: stat.int(),
  h: stat.int(),
  doubles: stat.int(),
  triples: stat.int(),
  hr: stat.int(),
  r: stat.int(),
  rbi: stat.int(),
  bb: stat.int(),
  hbp: stat.int(),
  so: stat.int(),
  sb: stat.int(),
  cs: stat.int(),
  sf: stat.int(),
  sh: stat.int(),
  gdp: stat.int(),
});
const pitchSchema = z.object({
  g: stat.int(),
  gs: stat.int(),
  outs: stat.int(),
  w: stat.int(),
  l: stat.int(),
  sv: stat.int(),
  hld: stat.int(),
  h: stat.int(),
  r: stat.int(),
  er: stat.int(),
  hr: stat.int(),
  bb: stat.int(),
  so: stat.int(),
  hbp: stat.int(),
  wp: stat.int(),
  bf: stat.int(),
});
export type Batting = z.infer<typeof batSchema>;
export type Pitching = z.infer<typeof pitchSchema>;
const leagueSchema = z.enum(['HS', 'COLLEGE', 'IND', 'KBO', 'NPB', 'MLB']);
const roleSchema = z.enum(['batter', 'pitcher']);
const standingSchema = z.object({ team: z.string(), w: stat.int(), l: stat.int(), strength: stat });
export type Standing = z.infer<typeof standingSchema>;
const awardSchema = z.object({
  title: z.string(),
  winner: z.string(),
  team: z.string(),
  detail: z.string(),
  mine: z.boolean(),
});
const leaderSchema = z.object({
  name: z.string(),
  team: z.string(),
  role: roleSchema,
  position: z.string(),
  batting: batSchema,
  pitching: pitchSchema,
  war: z.number().finite(),
  mine: z.boolean(),
});
export type Leader = z.infer<typeof leaderSchema>;
const legacySeasonSchema = z.object({
  year: stat.int(),
  age: stat.int(),
  league: leagueSchema,
  team: z.string(),
  role: roleSchema,
  position: z.string(),
  batting: batSchema,
  pitching: pitchSchema,
  war: z.number().finite(),
  overall: stat,
  skills: skillsSchema,
  growth: growthSchema,
  standings: z.array(standingSchema).max(30),
  leaders: z.array(leaderSchema).max(250),
  awards: z.array(awardSchema).max(20),
  notes: z.array(z.string()),
  injuryGames: stat.int(),
  salary: stat,
  cost: stat,
});
const stageSchema = z.enum(['highschool', 'college', 'independent', 'pro']);
const squadSchema = z.enum(['first', 'second']);
const draftSchema = z.object({
  outcome: z.enum(['selected', 'undrafted', 'college', 'continue']),
  score: stat.max(100),
  probability: stat.max(1),
  team: z.string().nullable(),
  round: stat.int(),
  bonus: stat,
  reason: z.string(),
});
export type DraftResult = z.infer<typeof draftSchema>;
const rosterSchema = z.object({
  period: stat.int().min(1).max(24),
  squad: squadSchema,
  available: stat.int(),
  batting: batSchema,
  pitching: pitchSchema,
  decision: z.enum(['promoted', 'demoted', 'retained', 'injured']),
  score: stat.max(100),
  form: stat.max(100),
  trust: stat.max(100),
  fatigue: stat.max(100),
  competition: stat.max(100),
  opportunity: z.boolean(),
  reason: z.string(),
});
export type RosterPeriod = z.infer<typeof rosterSchema>;
const seasonSchema = legacySeasonSchema.extend({
  stage: stageSchema,
  grade: stat.int().max(4),
  minorBatting: batSchema,
  minorPitching: pitchSchema,
  registrationDays: stat.int().max(168),
  roster: z.array(rosterSchema).max(24),
  draft: draftSchema.nullable(),
});
export type Season = z.infer<typeof seasonSchema>;
const offerSchema = z.object({
  id: z.string(),
  league: leagueSchema,
  team: z.string(),
  salary: stat,
  route: z.string(),
});
export type Offer = z.infer<typeof offerSchema>;
const legacyStateSchema = z.object({
  version: z.literal(1),
  seed: stat.int().max(4294967295),
  phase: z.enum(['preseason', 'offseason', 'retired']),
  year: stat.int().min(2026).max(2100),
  player: z.object({
    name: z.string().trim().min(1).max(16),
    role: roleSchema,
    position: z.enum(['CF', 'SS', '1B', 'C', 'SP', 'CP']),
    age: stat.int().min(18).max(45),
    league: leagueSchema,
    team: z.string(),
    skills: skillsSchema,
    salary: stat,
    money: stat,
    origin: z.object({ archetype: archetypeSchema, skills: skillsSchema }).optional(),
  }),
  plan: z.enum(['balanced', 'contact', 'power', 'speed', 'fielding', 'mental', 'recovery']),
  support: z.enum(['club', 'coach', 'data', 'conditioning']),
  history: z.array(legacySeasonSchema).max(30),
  offers: z.array(offerSchema).max(6),
  selectedOffer: z.string().nullable(),
});
const stateSchema = legacyStateSchema.extend({
  version: z.literal(2),
  player: legacyStateSchema.shape.player.extend({
    age: stat.int().min(16).max(40),
    startAge: z.union([z.literal(16), z.literal(19)]),
    stage: stageSchema,
    grade: stat.int().max(4),
    squad: squadSchema,
    preferredTeam: z.string(),
    potential: stat.min(65).max(99),
    trust: stat.max(100),
    fatigue: stat.max(100),
    injuryDays: stat.int().max(240),
    entry: z.enum(['highschool', 'early', 'college', 'tryout', 'legacy']).nullable(),
  }),
  history: z.array(seasonSchema).max(30),
  careerChoice: z.enum(['draft', 'college', 'continue', 'tryout']).nullable(),
  collegeTeam: z.string(),
});
export type GameState = z.infer<typeof stateSchema>;
export const SKILL_LABELS = {
  contact: '컨택',
  power: '파워',
  speed: '스피드',
  fielding: '수비',
  discipline: '선구안',
  mental: '멘탈',
};
export const PITCH_SKILL_LABELS = {
  contact: '제구',
  power: '구위',
  speed: '체력',
  fielding: '변화구',
  discipline: '위기 관리',
  mental: '멘탈',
};
export const emptyBat = (): Batting => ({
  g: 0,
  pa: 0,
  ab: 0,
  h: 0,
  doubles: 0,
  triples: 0,
  hr: 0,
  r: 0,
  rbi: 0,
  bb: 0,
  hbp: 0,
  so: 0,
  sb: 0,
  cs: 0,
  sf: 0,
  sh: 0,
  gdp: 0,
});
export const emptyPitch = (): Pitching => ({
  g: 0,
  gs: 0,
  outs: 0,
  w: 0,
  l: 0,
  sv: 0,
  hld: 0,
  h: 0,
  r: 0,
  er: 0,
  hr: 0,
  bb: 0,
  so: 0,
  hbp: 0,
  wp: 0,
  bf: 0,
});
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
const ratio = (n: number, d: number) => (d ? n / d : 0);
export const decimal = (n: number) => n.toFixed(3).replace(/^0\./, '.');
export const innings = (outs: number) => `${Math.floor(outs / 3)}.${outs % 3}`;
export const money = (n: number) =>
  n >= 10000
    ? `${(n / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`
    : `${Math.round(n).toLocaleString('ko-KR')}만`;
export function battingRates(b: Batting) {
  const avg = ratio(b.h, b.ab),
    obp = ratio(b.h + b.bb + b.hbp, b.ab + b.bb + b.hbp + b.sf);
  const slg = ratio(b.h + b.doubles + b.triples * 2 + b.hr * 3, b.ab);
  return {
    avg,
    obp,
    slg,
    ops: obp + slg,
    iso: slg - avg,
    babip: ratio(b.h - b.hr, b.ab - b.so - b.hr + b.sf),
    wrc: b.pa ? Math.round(100 + (obp + slg - 0.72) * 220) : 0,
  };
}
export function pitchingRates(p: Pitching) {
  return {
    era: ratio(p.er * 27, p.outs),
    whip: ratio((p.h + p.bb) * 3, p.outs),
    k9: ratio(p.so * 27, p.outs),
    bb9: ratio(p.bb * 27, p.outs),
    fip: p.outs ? ((13 * p.hr + 3 * (p.bb + p.hbp) - 2 * p.so) * 3) / p.outs + 3.2 : 0,
  };
}
export const overall = (s: Skills) => Math.round(Object.values(s).reduce((a, b) => a + b, 0) / 6);
export function makeCareer(
  name = '강도윤',
  role: Role = 'batter',
  position = role === 'batter' ? 'CF' : 'SP',
  team = TEAMS.KBO[0],
  seed = Date.now() % 4294967295,
  talent?: TalentCard,
  school = TEAMS.HS[0],
): GameState {
  if (talent && (talent.role !== role || !TALENTS[role].some((t) => t.id === talent.archetype))) {
    throw new Error('선수 유형에 맞는 시작 카드를 선택해주세요.');
  }
  return stateSchema.parse({
    version: 2,
    seed,
    phase: 'preseason',
    year: 2026,
    player: {
      name: name.trim() || '강도윤',
      role,
      position,
      age: 16,
      startAge: 16,
      stage: 'highschool',
      grade: 1,
      squad: 'second',
      preferredTeam: team,
      potential: 76 + (seed % 19),
      trust: 45,
      fatigue: 0,
      injuryDays: 0,
      entry: null,
      league: 'HS',
      team: school,
      skills:
        talent?.skills ??
        (role === 'batter'
          ? { contact: 44, power: 36, speed: 52, fielding: 41, discipline: 38, mental: 43 }
          : { contact: 42, power: 47, speed: 43, fielding: 38, discipline: 36, mental: 42 }),
      ...(talent ? { origin: { archetype: talent.archetype, skills: talent.skills } } : {}),
      salary: 0,
      money: 300,
    },
    plan: 'balanced',
    support: 'club',
    history: [],
    offers: [],
    selectedOffer: null,
    careerChoice: null,
    collegeTeam: TEAMS.COLLEGE[0],
  });
}
function random(seed: number) {
  let s = seed >>> 0;
  return {
    next: () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    },
    seed: () => s,
  };
}
type Random = ReturnType<typeof random>;
const int = (rng: Random, lo: number, hi: number) => lo + Math.floor(rng.next() * (hi - lo + 1));
export function generateTalentDraft(role: Role, seed = Date.now() % 4294967295): TalentDraft {
  const rng = random(seed),
    pool = [...TALENTS[role]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const cards = pool.slice(0, 3).map((talent, i) => ({
    id: `${seed}-${i}`,
    role,
    archetype: talent.id,
    skills: Object.fromEntries(
      Object.entries(talent.skills).map(([key, value]) => [key, value + int(rng, -5, 5)]),
    ) as Skills,
  }));
  return { role, cards, seed: rng.seed() };
}
function grow(s: GameState, rng: Random): Skills {
  const result = { ...s.player.skills };
  const age = s.player.age;
  const base =
    age <= 18 ? 3.1 : age <= 24 ? 2.2 : age <= 28 ? 1.2 : age <= 31 ? 0.2 : age <= 35 ? -1.2 : -2.8;
  const focus: Record<Plan, (keyof Skills)[]> = {
    balanced: [],
    contact: ['contact', s.player.role === 'batter' ? 'discipline' : 'mental'],
    power: ['power', s.player.role === 'batter' ? 'contact' : 'speed'],
    speed: ['speed', 'fielding'],
    fielding: ['fielding', s.player.role === 'batter' ? 'speed' : 'contact'],
    mental: ['mental', 'discipline'],
    recovery: [],
  };
  for (const key of Object.keys(result) as (keyof Skills)[]) {
    let change = base + rng.next() * 1.8 - 0.4;
    if (s.plan === 'balanced') change += 0.8;
    if (s.plan === 'recovery') change -= 1.3;
    if (focus[s.plan][0] === key) change += 3.5 + (s.support === 'coach' ? 2 : 0);
    if (focus[s.plan][1] === key) change += 1.3;
    if (s.support === 'coach' && (s.plan === 'balanced' || s.plan === 'recovery')) change += 0.65;
    if (
      s.support === 'data' &&
      (key === 'discipline' ||
        key === 'mental' ||
        (s.player.role === 'pitcher' && key === 'contact'))
    )
      change += 1;
    if (change > 0) change *= clamp((s.player.potential - result[key]) / 30, 0.12, 1.15);
    result[key] = Math.round(
      clamp(result[key] + change, 20, Math.max(result[key], s.player.potential)),
    );
  }
  return result;
}
const leaguePenalty: Record<League, number> = {
  HS: -14,
  COLLEGE: -7,
  IND: -4,
  KBO: 0,
  NPB: 5,
  MLB: 10,
};
function simulateBat(skills: Skills, league: League, games: number, rng: Random): Batting {
  const b = emptyBat();
  const level = leaguePenalty[league],
    c = skills.contact - level,
    power = skills.power - level;
  b.g = games;
  for (let g = 0; g < games; g++) {
    const pas = int(rng, 3, 5) + (rng.next() < 0.12 ? 1 : 0);
    for (let i = 0; i < pas; i++) {
      b.pa++;
      const outcome = rng.next();
      if (outcome < 0.035 + skills.discipline * 0.00115) {
        b.bb++;
        continue;
      }
      if (outcome < 0.047 + skills.discipline * 0.00115) {
        b.hbp++;
        continue;
      }
      if (outcome < 0.058 + skills.discipline * 0.00115) {
        b.sf++;
        if (rng.next() < 0.7) b.rbi++;
        continue;
      }
      if (outcome < 0.063 + skills.discipline * 0.00115) {
        b.sh++;
        continue;
      }
      b.ab++;
      const roll = rng.next(),
        hrChance = 0.005 + Math.pow(Math.max(power, 0) / 100, 2) * 0.065;
      if (roll < hrChance) {
        b.h++;
        b.hr++;
        b.r++;
        b.rbi += 1 + (rng.next() < 0.37 ? int(rng, 1, 3) : 0);
      } else if (roll < 0.15 + c * 0.00215) {
        b.h++;
        const extra = rng.next();
        if (extra < 0.17 + power * 0.001) b.doubles++;
        else if (extra < 0.17 + power * 0.001 + skills.speed * 0.00035) b.triples++;
        if (rng.next() < 0.23 + skills.mental * 0.0013) b.rbi += rng.next() < 0.15 ? 2 : 1;
      } else if (rng.next() < clamp(0.38 - c * 0.0025, 0.12, 0.38)) b.so++;
      else if (rng.next() < 0.07) b.gdp++;
    }
  }
  const reaches = b.h - b.hr + b.bb + b.hbp;
  for (let i = 0; i < reaches; i++) {
    if (rng.next() < 0.26 + skills.mental * 0.001) b.r++;
    if (rng.next() < Math.max(0, (skills.speed - 32) * 0.0055)) {
      if (rng.next() < 0.57 + skills.speed * 0.003) b.sb++;
      else b.cs++;
    }
  }
  return b;
}
function simulatePitch(
  skills: Skills,
  league: League,
  games: number,
  closer: boolean,
  rng: Random,
): Pitching {
  const p = emptyPitch(),
    level = leaguePenalty[league];
  const appearances = closer ? games * 0.45 : games / 5;
  p.g = Math.floor(appearances) + (rng.next() < appearances % 1 ? 1 : 0);
  p.gs = closer ? 0 : p.g;
  const stuff = skills.power - level,
    control = skills.contact - level,
    breaking = skills.fielding - level;
  for (let g = 0; g < p.g; g++) {
    const outs = closer ? int(rng, 2, 4) : int(rng, 12, 16) + Math.floor(skills.speed / 18);
    p.outs += outs;
    let runs = 0;
    const bf = Math.ceil(outs * (1.22 + rng.next() * 0.25));
    p.bf += bf;
    for (let i = 0; i < bf; i++) {
      if (rng.next() < 0.16 + stuff * 0.0018 + breaking * 0.0005) p.so++;
      else if (rng.next() < Math.max(0.025, 0.16 - control * 0.0012)) p.bb++;
      else if (rng.next() < 0.012) p.hbp++;
      else if (rng.next() < clamp(0.46 - (stuff + breaking) * 0.00135, 0.15, 0.46)) {
        p.h++;
        if (rng.next() < Math.max(0.04, 0.19 - stuff * 0.0012)) {
          p.hr++;
          runs += rng.next() < 0.25 ? 2 : 1;
        } else if (rng.next() < 0.42 - (skills.mental + skills.discipline) * 0.0008) runs++;
      }
    }
    if (rng.next() < 0.08) p.wp++;
    p.er += runs;
    p.r += runs + (rng.next() < 0.1 ? 1 : 0);
    if (closer) {
      if (runs === 0 && rng.next() < 0.7) p.sv++;
      else if (runs === 0) p.hld++;
      else if (runs >= 2 && rng.next() < 0.5) p.l++;
      else if (rng.next() < 0.15) p.w++;
    } else if (runs <= 3 && outs >= 15 && rng.next() < 0.62) p.w++;
    else if (runs >= 2 && rng.next() < 0.65) p.l++;
  }
  return p;
}
function playerWar(b: Batting, p: Pitching, skills: Skills, role: Role): number {
  if (role === 'batter') {
    const rates = battingRates(b);
    return (
      Math.round(
        clamp(
          ((rates.ops - 0.59) * b.pa) / 40 + ((skills.fielding - 50) * b.g) / 4000 + b.sb * 0.015,
          -3,
          13,
        ) * 10,
      ) / 10 || 0
    );
  }
  return (
    Math.round(
      clamp(((4.8 - pitchingRates(p).era) * (p.outs / 3)) / 85 + (p.so - p.bb) / 170, -3, 13) * 10,
    ) / 10 || 0
  );
}
function simulateStandings(league: League, team: string, war: number, rng: Random): Standing[] {
  const rows = TEAMS[league].map((name) => ({
    team: name,
    w: 0,
    l: 0,
    strength: 45 + rng.next() * 20 + (name === team ? war * 1.2 : 0),
  }));
  for (let day = 0; day < SEASON_GAMES[league]; day++) {
    const order = rows.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = int(rng, 0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 0; i < order.length; i += 2) {
      const a = rows[order[i]],
        b = rows[order[i + 1]];
      if (rng.next() < clamp(0.5 + (a.strength - b.strength) / 100, 0.2, 0.8)) {
        a.w++;
        b.l++;
      } else {
        b.w++;
        a.l++;
      }
    }
  }
  return rows.sort((a, b) => b.w - a.w || b.strength - a.strength);
}
const firstNames = [
  '민준',
  '지호',
  '도현',
  '시우',
  '서준',
  '현우',
  '준서',
  '우진',
  '건우',
  '지훈',
  '태양',
  '재현',
  '승우',
  '정우',
  '준혁',
  '민재',
  '선우',
  '수현',
  '도윤',
  '성민',
];
const lastNames = ['김', '이', '박', '최', '정', '강', '윤', '장', '임', '한'];
function makeLeaders(
  s: GameState,
  season: Omit<Season, 'leaders' | 'awards'>,
  rng: Random,
): Leader[] {
  const leaders: Leader[] = [
    {
      name: s.player.name,
      team: s.player.team,
      role: s.player.role,
      position: s.player.position,
      batting: season.batting,
      pitching: season.pitching,
      war: season.war,
      mine: true,
    },
  ];
  TEAMS[s.player.league].forEach((team, index) => {
    for (let j = 0; j < 6; j++) {
      const role: Role = j < 4 ? 'batter' : 'pitcher';
      const skillBase = 49 + leaguePenalty[s.player.league] + rng.next() * 29;
      const skills = Object.fromEntries(
        Object.keys(s.player.skills).map((key) => [
          key,
          clamp(Math.round(skillBase + rng.next() * 16 - 8), 30, 99),
        ]),
      ) as Skills;
      const games = SEASON_GAMES[s.player.league] - int(rng, 0, 15);
      const batting =
        role === 'batter' ? simulateBat(skills, s.player.league, games, rng) : emptyBat();
      const pitching =
        role === 'pitcher'
          ? simulatePitch(skills, s.player.league, games, false, rng)
          : emptyPitch();
      const name = ['HS', 'COLLEGE', 'IND', 'KBO'].includes(s.player.league)
        ? `${lastNames[index % lastNames.length]}${firstNames[(index * 6 + j) % firstNames.length]}`
        : s.player.league === 'NPB'
          ? `${['다나카', '사토', '스즈키', '야마모토'][j % 4]} ${['렌', '유키', '쇼타', '하루', '다이치', '카이'][index % 6]}`
          : `${['A.', 'J.', 'M.', 'C.', 'R.', 'D.'][j]} ${['밀러', '로드리게스', '존슨', '가르시아', '데이비스', '스미스', '윌리엄스', '마르티네스', '존스', '브라운'][index % 10]}`;
      leaders.push({
        name,
        team,
        role,
        position: role === 'pitcher' ? 'SP' : ['CF', 'SS', '1B', 'C'][j],
        batting,
        pitching,
        war: playerWar(batting, pitching, skills, role),
        mine: false,
      });
    }
  });
  return leaders;
}
function makeAwards(s: GameState, leaders: Leader[]): z.infer<typeof awardSchema>[] {
  const qualifiedBatters = leaders.filter(
    (p) => p.role === 'batter' && p.batting.pa >= SEASON_GAMES[s.player.league] * 3.1,
  );
  const qualifiedPitchers = leaders.filter(
    (p) => p.role === 'pitcher' && p.pitching.outs >= SEASON_GAMES[s.player.league] * 3,
  );
  const awards: z.infer<typeof awardSchema>[] = [];
  const award = (
    title: string,
    pool: Leader[],
    value: (p: Leader) => number,
    format: (p: Leader) => string,
    asc = false,
  ) => {
    const winner = [...pool].sort((a, b) => (asc ? 1 : -1) * (value(a) - value(b)))[0];
    if (winner)
      awards.push({
        title,
        winner: winner.name,
        team: winner.team,
        detail: format(winner),
        mine: winner.mine,
      });
  };
  award(
    '시즌 MVP',
    leaders,
    (p) => p.war,
    (p) => `WAR ${p.war.toFixed(1)}`,
  );
  award(
    '타격왕',
    qualifiedBatters,
    (p) => battingRates(p.batting).avg,
    (p) => `타율 ${decimal(battingRates(p.batting).avg)}`,
  );
  award(
    '홈런왕',
    leaders.filter((p) => p.role === 'batter'),
    (p) => p.batting.hr,
    (p) => `${p.batting.hr}홈런`,
  );
  award(
    '타점왕',
    leaders.filter((p) => p.role === 'batter'),
    (p) => p.batting.rbi,
    (p) => `${p.batting.rbi}타점`,
  );
  award(
    '도루왕',
    leaders.filter((p) => p.role === 'batter'),
    (p) => p.batting.sb,
    (p) => `${p.batting.sb}도루`,
  );
  award(
    '최우수 투수',
    leaders.filter((p) => p.role === 'pitcher'),
    (p) => p.war,
    (p) => `WAR ${p.war.toFixed(1)}`,
  );
  award(
    '평균자책점왕',
    qualifiedPitchers,
    (p) => pitchingRates(p.pitching).era,
    (p) => `ERA ${pitchingRates(p.pitching).era.toFixed(2)}`,
    true,
  );
  award(
    '탈삼진왕',
    leaders.filter((p) => p.role === 'pitcher'),
    (p) => p.pitching.so,
    (p) => `${p.pitching.so}K`,
  );
  const myRole = leaders.filter(
    (p) => p.role === s.player.role && p.position === s.player.position,
  );
  award(
    `${s.player.position} 골든글러브`,
    myRole,
    (p) => p.war,
    (p) => `WAR ${p.war.toFixed(1)}`,
  );
  if (
    s.player.stage === 'pro' &&
    totals(s.history, 'first').batting.pa < 130 &&
    totals(s.history, 'first').pitching.outs < 150
  ) {
    const mine = leaders[0];
    if (mine.war >= 1.5)
      awards.push({
        title: '신인왕',
        winner: mine.name,
        team: mine.team,
        detail: `신인 시즌 WAR ${mine.war.toFixed(1)}`,
        mine: true,
      });
  }
  return awards;
}
export function stageLabel(p: { stage: CareerStage; grade: number; squad?: Squad }) {
  return p.stage === 'highschool'
    ? `고교 ${p.grade}학년`
    : p.stage === 'college'
      ? `대학 ${p.grade}학년`
      : p.stage === 'independent'
        ? '독립리그'
        : p.squad === 'second'
          ? '프로 2군'
          : p.squad === 'first'
            ? '프로 1군'
            : '프로';
}
export function trainingCost(s: GameState, support: Support = s.support) {
  return Math.round(
    SUPPORTS.find((x) => x.id === support)!.cost *
      (s.player.stage === 'pro'
        ? 1
        : s.player.stage === 'highschool'
          ? 0.08
          : s.player.stage === 'college'
            ? 0.12
            : 0.16),
  );
}
export function needsCareerDecision(s: GameState) {
  return (
    s.phase === 'offseason' &&
    ((s.player.stage === 'highschool' && s.player.grade === 3) ||
      (s.player.stage === 'college' && [2, 4].includes(s.player.grade)) ||
      s.player.stage === 'independent') &&
    !s.careerChoice
  );
}
export function positionRating(skills: Skills, role: Role, position: string) {
  if (role === 'pitcher')
    return (
      skills.contact * 0.28 +
      skills.power * 0.27 +
      skills.fielding * 0.22 +
      skills.speed * 0.13 +
      skills.mental * 0.1
    );
  if (['SS', 'C'].includes(position))
    return (
      skills.fielding * 0.32 +
      skills.contact * 0.24 +
      skills.power * 0.12 +
      skills.speed * 0.12 +
      skills.discipline * 0.12 +
      skills.mental * 0.08
    );
  return (
    skills.contact * 0.3 +
    skills.power * 0.27 +
    skills.discipline * 0.16 +
    skills.speed * 0.1 +
    skills.fielding * 0.1 +
    skills.mental * 0.07
  );
}
export function teamCompetition(team: string, position: string, year: number) {
  let hash = year;
  for (const character of `${team}:${position}`)
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return 53 + (hash % 26);
}
export type ManagerInput = {
  skills: Skills;
  role: Role;
  position: string;
  squad: Squad;
  form: number;
  trust: number;
  competition: number;
  fatigue: number;
  injuryDays: number;
  opportunity: boolean;
  poorPeriods: number;
  periods: number;
};
export function evaluateManager(p: ManagerInput): {
  score: number;
  decision: RosterPeriod['decision'];
  reason: string;
} {
  const score = Math.round(
    clamp(
      positionRating(p.skills, p.role, p.position) * 0.5 +
        p.form * 0.32 +
        p.trust * 0.12 +
        p.skills.mental * 0.06 +
        (65 - p.competition) * 0.25 +
        (p.opportunity ? 12 : 0) -
        p.fatigue * 0.1,
      0,
      100,
    ),
  );
  if (p.injuryDays >= 14)
    return {
      score,
      decision: p.squad === 'first' ? 'demoted' : 'injured',
      reason: '부상으로 정상 출장이 어려워 재활 명단에 배치했습니다.',
    };
  if (p.squad === 'second' && p.fatigue >= 78)
    return {
      score,
      decision: 'retained',
      reason: '1군 복귀보다 피로 회복과 출장량 조절을 우선합니다.',
    };
  if (p.squad === 'second' && p.periods >= 2 && score >= 64 && p.form >= 56)
    return {
      score,
      decision: 'promoted',
      reason: p.opportunity
        ? '주전의 부상으로 생긴 기회. 2군 성적과 준비 상태를 보고 1군 콜업을 결정했습니다.'
        : '2군에서의 최근 성적, 기량과 감독 신뢰가 경쟁 기준을 넘어 1군으로 올렸습니다.',
    };
  if (
    p.squad === 'first' &&
    ((p.poorPeriods >= 2 && score < 50) || p.fatigue >= 88 || (p.competition >= 82 && score < 57))
  )
    return {
      score,
      decision: 'demoted',
      reason:
        p.fatigue >= 88
          ? '누적 피로가 높아 2군에서 컨디션을 재정비합니다.'
          : p.competition >= 82
            ? '포지션 경쟁자의 복귀와 최근 성적을 비교해 2군으로 내렸습니다.'
            : '최근 두 평가 구간의 부진과 낮아진 감독 신뢰로 2군 재조정을 결정했습니다.',
    };
  return {
    score,
    decision: 'retained',
    reason:
      p.squad === 'first'
        ? '최근 성적과 포지션 경쟁을 검토한 결과 1군 등록을 유지합니다.'
        : score >= 58
          ? '콜업 후보입니다. 경기력의 지속성과 1군의 자리를 더 지켜봅니다.'
          : '2군에서 기량과 경기 경험을 더 쌓아야 합니다.',
  };
}
function addStats<T extends Batting | Pitching>(target: T, source: T) {
  for (const key of Object.keys(target) as (keyof T)[])
    (target[key] as number) += source[key] as number;
}
function recentPerformance(b: Batting, p: Pitching, role: Role, minor: boolean) {
  if (role === 'batter')
    return b.pa ? clamp(50 + (battingRates(b).ops - (minor ? 0.78 : 0.7)) * 110, 5, 98) : 40;
  return p.outs
    ? clamp(85 - pitchingRates(p).era * 10 + pitchingRates(p).k9 * 0.5 - (minor ? 8 : 0), 5, 98)
    : 40;
}
function simulateRoster(s: GameState, skills: Skills, rng: Random) {
  const batting = emptyBat(),
    pitching = emptyPitch(),
    minorBatting = emptyBat(),
    minorPitching = emptyPitch();
  const roster: RosterPeriod[] = [];
  let squad = s.player.squad,
    trust = s.player.trust,
    fatigue = s.player.fatigue,
    injuryDays = s.player.injuryDays;
  let form = 50,
    poorPeriods = 0,
    injuryGames = 0,
    registrationDays = 0;
  for (let period = 1; period <= 24; period++) {
    const before = squad,
      games = before === 'first' ? SEASON_GAMES[s.player.league] : 120;
    const scheduled = Math.floor((games * period) / 24) - Math.floor((games * (period - 1)) / 24);
    // The block is one week of the season. A real absence removes opportunities at both levels.
    if (
      injuryDays === 0 &&
      rng.next() <
        (0.008 + fatigue * 0.00006 + Math.max(s.player.age - 28, 0) * 0.00025) *
          (s.plan === 'recovery' ? 0.35 : 1) *
          (s.support === 'conditioning' ? 0.5 : 1)
    )
      injuryDays = rng.next() < 0.09 ? int(rng, 90, 180) : int(rng, 7, 35);
    const healthAvailable = Math.max(
      0,
      scheduled - Math.ceil((Math.min(injuryDays, 7) * scheduled) / 7),
    );
    injuryGames += scheduled - healthAvailable;
    const startsShare =
      before === 'first'
        ? clamp(
            0.55 +
              (positionRating(skills, s.player.role, s.player.position) - 60) / 90 +
              (trust - 50) / 180,
            0.28,
            0.98,
          )
        : fatigue >= 78
          ? 0.45
          : 0.95;
    const available = Math.max(0, Math.round(healthAvailable * startsShare));
    const adjusted = Object.fromEntries(
      Object.entries(skills).map(([key, value]) => [
        key,
        clamp(
          value +
            (before === 'second' ? 8 : 0) -
            fatigue * 0.07 +
            (rng.next() - 0.5) * (11 - skills.mental / 15),
          15,
          99,
        ),
      ]),
    ) as Skills;
    const b =
      s.player.role === 'batter'
        ? simulateBat(adjusted, s.player.league, available, rng)
        : emptyBat();
    const p =
      s.player.role === 'pitcher'
        ? simulatePitch(adjusted, s.player.league, available, s.player.position === 'CP', rng)
        : emptyPitch();
    addStats(before === 'first' ? batting : minorBatting, b);
    addStats(before === 'first' ? pitching : minorPitching, p);
    if (before === 'first') registrationDays += Math.max(0, 7 - Math.min(7, injuryDays));
    form = Math.round(
      form * 0.5 + recentPerformance(b, p, s.player.role, before === 'second') * 0.5,
    );
    trust = clamp(trust + (form - 50) * 0.08 + (skills.mental - 50) * 0.015, 10, 95);
    fatigue = clamp(
      fatigue +
        (available / Math.max(1, scheduled)) * (before === 'first' ? 5 : 3) -
        (s.plan === 'recovery' ? 6 : before === 'first' ? 2 : 5) -
        (s.support === 'conditioning' ? 2 : 0) -
        (injuryDays > 0 ? 8 : 0),
      0,
      100,
    );
    const competition = clamp(
        teamCompetition(s.player.team, s.player.position, s.year) + int(rng, -10, 10),
        45,
        90,
      ),
      opportunity = rng.next() < 0.13;
    poorPeriods = form < 46 ? poorPeriods + 1 : 0;
    const report = evaluateManager({
      skills,
      role: s.player.role,
      position: s.player.position,
      squad,
      form,
      trust,
      competition,
      fatigue,
      injuryDays,
      opportunity,
      poorPeriods,
      periods: period,
    });
    roster.push({
      period,
      squad: before,
      available,
      batting: b,
      pitching: p,
      ...report,
      form,
      trust: Math.round(trust),
      fatigue: Math.round(fatigue),
      competition,
      opportunity,
    });
    if (report.decision === 'promoted') squad = 'first';
    if (report.decision === 'demoted') squad = 'second';
    injuryDays = Math.max(0, injuryDays - 7);
  }
  return {
    batting,
    pitching,
    minorBatting,
    minorPitching,
    roster,
    injuryGames,
    registrationDays,
    squad,
    trust: Math.round(trust),
    fatigue: Math.round(fatigue),
    injuryDays,
  };
}
export function scoutReport(s: GameState) {
  const h = s.history.at(-1);
  const performance = h ? recentPerformance(h.batting, h.pitching, s.player.role, false) : 40;
  const scheduled = SEASON_GAMES[s.player.league],
    appearances = h
      ? s.player.role === 'batter'
        ? h.batting.g
        : h.pitching.g * (s.player.position === 'CP' ? 2 : 5)
      : 0;
  const exposure = clamp((appearances / scheduled) * 100, 0, 100);
  const readiness = positionRating(s.player.skills, s.player.role, s.player.position);
  const score = Math.round(
    clamp(
      readiness * 0.6 +
        performance * 0.24 +
        exposure * 0.08 +
        s.player.skills.mental * 0.08 +
        (s.player.stage === 'college' && s.player.grade === 2 ? 2 : 0),
      0,
      100,
    ),
  );
  const probability = clamp(1 / (1 + Math.exp(-(score - 65) / 6)), 0.03, 0.95);
  return {
    score,
    probability,
    performance: Math.round(performance),
    readiness: Math.round(readiness),
    exposure: Math.round(exposure),
  };
}
export function chooseCareerPath(
  input: GameState,
  choice: 'draft' | 'college' | 'continue' | 'tryout',
  college = input.collegeTeam,
): GameState {
  if (!needsCareerDecision(input)) throw new Error('지금은 진로를 결정하는 시기가 아닙니다.');
  if (!TEAMS.COLLEGE.includes(college)) throw new Error('진학할 대학을 선택해주세요.');
  const high = input.player.stage === 'highschool',
    early = input.player.stage === 'college' && input.player.grade === 2,
    independent = input.player.stage === 'independent';
  if (
    high
      ? !['draft', 'college'].includes(choice)
      : early
        ? !['draft', 'continue'].includes(choice)
        : independent
          ? choice !== 'tryout'
          : choice !== 'draft'
  )
    throw new Error('현재 학년에서 선택할 수 없는 진로입니다.');
  const s = structuredClone(input),
    h = s.history.at(-1)!;
  s.careerChoice = choice;
  s.collegeTeam = college;
  if (choice === 'college' || choice === 'continue') {
    h.draft = {
      outcome: choice === 'college' ? 'college' : 'continue',
      score: 0,
      probability: 0,
      team: null,
      round: 0,
      bonus: 0,
      reason:
        choice === 'college'
          ? `${college} 진학을 선택했습니다. 대학 2학년을 마친 뒤 얼리 드래프트에 지원할 수 있습니다.`
          : '대학에 남아 기량과 실전 경험을 더 쌓기로 했습니다.',
    };
  } else {
    const rng = random(s.seed),
      report = scoutReport(s);
    const ranked = TEAMS.KBO.map((team) => ({
      team,
      fit:
        (100 - teamCompetition(team, s.player.position, s.year)) / 2 +
        int(rng, 0, 5) +
        (team === s.player.preferredTeam ? 2 : 0),
    })).sort((a, b) => b.fit - a.fit);
    const probability = clamp(report.probability + (ranked[0].fit - 20) * 0.008, 0.03, 0.97),
      selected = rng.next() < probability;
    const round = selected
      ? Math.round(clamp(11 - (report.score - 45) / 4 + int(rng, -1, 1), 1, 10))
      : 0;
    h.draft = {
      outcome: selected ? 'selected' : 'undrafted',
      score: report.score,
      probability,
      team: selected ? ranked[0].team : null,
      round,
      bonus: selected ? (11 - round) * 1200 : 0,
      reason: selected
        ? `기량 ${report.readiness}, 최근 경기력 ${report.performance}, 출장 노출 ${report.exposure}를 검토한 구단이 ${round}라운드에 지명했습니다. 선호 팀은 지명을 보장하지 않습니다.`
        : high
          ? `구단의 포지션 수요와 스카우트 평가에서 지명에 이르지 못했습니다. ${college}로 진학해 다시 도전합니다.`
          : early
            ? '얼리 드래프트에서 지명되지 않았습니다. 대학 3학년으로 복귀합니다.'
            : '지명되지 않았습니다. 독립리그에서 실전 경험을 쌓으며 테스트 입단에 다시 도전할 수 있습니다.',
    };
    s.seed = rng.seed();
  }
  h.notes.push(h.draft.reason);
  return s;
}
export function internationalEligibility(s: GameState) {
  const service = s.history
    .filter((h) => h.stage === 'pro' && h.league === 'KBO')
    .reduce((n, h) => n + Math.min(1, h.registrationDays / 145), 0);
  const rating = overall(s.player.skills);
  return {
    service: Math.floor(service * 100) / 100,
    npb: s.player.stage === 'pro' && service >= 5 && rating >= 68,
    mlb: s.player.stage === 'pro' && service >= 7 && rating >= 78,
    rating,
  };
}
function offersFor(s: GameState): Offer[] {
  if (s.player.stage !== 'pro') return [];
  const league = s.player.league,
    rating = overall(s.player.skills),
    h = s.history.at(-1)!;
  const value = Math.max(0, h.war) * 2200 + (h.registrationDays / 168) * (rating - 40) ** 2 * 8;
  const salary = Math.round(
    Math.max(3000, value) * (league === 'MLB' ? 20 : league === 'NPB' ? 3 : 1),
  );
  const offers: Offer[] = [
    { id: 'renew', league, team: s.player.team, salary, route: '소속팀 재계약' },
  ];
  const eligible = internationalEligibility(s);
  const fa =
    eligible.service >= (s.player.entry === 'college' ? 7 : 8) ||
    (league !== 'KBO' && s.history.filter((h) => h.league === league).length >= 3);
  if (fa)
    offers.push({
      id: 'domestic',
      league,
      team: TEAMS[league].filter((t) => t !== s.player.team)[s.year % (TEAMS[league].length - 1)],
      salary: Math.round(salary * 1.12),
      route: 'FA 이적 제안',
    });
  if (league === 'KBO' && eligible.npb)
    offers.push({
      id: 'npb',
      league: 'NPB',
      team: TEAMS.NPB[s.year % TEAMS.NPB.length],
      salary: Math.round(salary * 2.4),
      route: '구단 동의 · NPB 진출',
    });
  if (
    (league === 'KBO' && eligible.mlb) ||
    (league === 'NPB' &&
      s.history.filter((h) => h.league === 'NPB' && h.registrationDays >= 100).length >= 3 &&
      rating >= 78)
  )
    offers.push({
      id: 'mlb',
      league: 'MLB',
      team: TEAMS.MLB[s.year % TEAMS.MLB.length],
      salary: Math.round(salary * (league === 'KBO' ? 12 : 5)),
      route: league === 'KBO' ? 'MLB 포스팅' : 'MLB 이적',
    });
  if (league !== 'KBO')
    offers.push({
      id: 'return',
      league: 'KBO',
      team: TEAMS.KBO[0],
      salary: Math.round(Math.max(3000, value)),
      route: '국내 복귀',
    });
  return offers;
}
export function playSeason(input: GameState): GameState {
  if (input.phase !== 'preseason') throw new Error('다음 시즌을 준비한 후 진행해주세요.');
  const cost = trainingCost(input);
  if (input.player.money < cost)
    throw new Error('훈련 예산이 부족합니다. 다른 지원 방식을 선택해주세요.');
  const s = structuredClone(input),
    rng = random(s.seed),
    skills = grow(s, rng);
  const growth = Object.fromEntries(
    Object.entries(skills).map(([k, v]) => [k, v - s.player.skills[k as keyof Skills]]),
  ) as Skills;
  const games = SEASON_GAMES[s.player.league],
    pro = s.player.stage === 'pro';
  const injuryGames =
    rng.next() <
    0.17 * (s.plan === 'recovery' ? 0.35 : 1) * (s.support === 'conditioning' ? 0.5 : 1)
      ? int(rng, 3, Math.min(12, games))
      : 0;
  const played = Math.max(
    0,
    games -
      injuryGames -
      (s.player.stage === 'highschool' && s.player.grade === 1 ? int(rng, 5, 12) : int(rng, 0, 4)),
  );
  const sim = pro
    ? simulateRoster(s, skills, rng)
    : {
        batting:
          s.player.role === 'batter'
            ? simulateBat(skills, s.player.league, played, rng)
            : emptyBat(),
        pitching:
          s.player.role === 'pitcher'
            ? simulatePitch(skills, s.player.league, played, s.player.position === 'CP', rng)
            : emptyPitch(),
        minorBatting: emptyBat(),
        minorPitching: emptyPitch(),
        roster: [],
        registrationDays: 0,
        injuryGames,
        squad: s.player.squad,
        trust: s.player.trust,
        fatigue: 0,
        injuryDays: 0,
      };
  const war = playerWar(sim.batting, sim.pitching, skills, s.player.role),
    standings = simulateStandings(s.player.league, s.player.team, war, rng);
  const place = standings.findIndex((t) => t.team === s.player.team) + 1;
  const notes = [
    `${s.player.team}, ${LEAGUE_LABELS[s.player.league]} ${place}위로 마무리.`,
    sim.injuryGames
      ? `부상으로 ${sim.injuryGames}경기 기회를 놓쳤습니다.`
      : '큰 부상 없이 시즌을 마쳤습니다.',
  ];
  if (pro)
    notes.push(
      `1군 등록 ${sim.registrationDays}일 · 1군 ${s.player.role === 'batter' ? sim.batting.g : sim.pitching.g}경기 · 2군 ${s.player.role === 'batter' ? sim.minorBatting.g : sim.minorPitching.g}경기.`,
      `감독 평가: 콜업 ${sim.roster.filter((r) => r.decision === 'promoted').length}회 · 2군 조정 ${sim.roster.filter((r) => r.decision === 'demoted').length}회.`,
    );
  if (s.player.age >= 32)
    notes.push('나이와 누적 피로를 고려한 관리가 필요합니다. 신체 능력이 서서히 감소합니다.');
  const partial = {
    year: s.year,
    age: s.player.age,
    league: s.player.league,
    stage: s.player.stage,
    grade: s.player.grade,
    team: s.player.team,
    role: s.player.role,
    position: s.player.position,
    batting: sim.batting,
    pitching: sim.pitching,
    minorBatting: sim.minorBatting,
    minorPitching: sim.minorPitching,
    registrationDays: sim.registrationDays,
    roster: sim.roster,
    draft: null,
    war,
    overall: overall(skills),
    skills,
    growth,
    standings,
    injuryGames: sim.injuryGames,
    notes,
    salary: s.player.salary,
    cost,
  };
  const leaders = makeLeaders(s, partial, rng),
    awards = makeAwards(s, leaders);
  s.history.push({ ...partial, leaders, awards });
  s.player.skills = skills;
  s.player.squad = sim.squad;
  s.player.trust = sim.trust;
  s.player.fatigue = sim.fatigue;
  s.player.injuryDays = sim.injuryDays;
  s.player.money += (pro ? s.player.salary : 150) - cost;
  s.phase = s.player.age >= 40 ? 'retired' : 'offseason';
  s.offers = s.phase === 'retired' ? [] : offersFor(s);
  s.selectedOffer = s.offers[0]?.id ?? null;
  s.careerChoice = null;
  s.seed = rng.seed();
  return s;
}
export function nextSeason(input: GameState): GameState {
  if (input.phase !== 'offseason')
    throw new Error('시즌 결산 후에 다음 시즌을 시작할 수 있습니다.');
  if (needsCareerDecision(input)) throw new Error('진로 페이지에서 다음 진로를 먼저 결정해주세요.');
  const s = structuredClone(input),
    p = s.player,
    h = s.history.at(-1)!;
  if (p.stage === 'pro') {
    const offer = s.offers.find((o) => o.id === s.selectedOffer);
    if (!offer) throw new Error('다음 시즌 계약을 선택해주세요.');
    if (offer.league !== p.league || offer.team !== p.team) {
      p.squad = 'second';
      p.trust = 45;
    }
    p.team = offer.team;
    p.league = offer.league;
    p.salary = offer.salary;
  } else if (h.draft?.outcome === 'selected') {
    p.entry =
      p.stage === 'highschool'
        ? 'highschool'
        : p.stage === 'college' && p.grade === 2
          ? 'early'
          : p.stage === 'college'
            ? 'college'
            : 'tryout';
    p.stage = 'pro';
    p.grade = 0;
    p.league = 'KBO';
    p.team = h.draft.team!;
    p.squad = 'second';
    p.salary = 3000;
    p.money += h.draft.bonus;
    p.trust = 40;
  } else if (p.stage === 'highschool' && p.grade === 3) {
    p.stage = 'college';
    p.grade = 1;
    p.league = 'COLLEGE';
    p.team = s.collegeTeam;
  } else if (p.stage === 'college' && p.grade === 4) {
    p.stage = 'independent';
    p.grade = 0;
    p.league = 'IND';
    p.team = TEAMS.IND[s.year % TEAMS.IND.length];
  } else if (p.stage === 'highschool' || p.stage === 'college') p.grade++;
  p.age++;
  s.year++;
  s.phase = 'preseason';
  s.offers = [];
  s.selectedOffer = null;
  s.careerChoice = null;
  p.fatigue = Math.max(0, p.fatigue - 65);
  p.injuryDays = Math.max(0, p.injuryDays - 120);
  // Paid support must be explicitly chosen again after changing a school/pro budget.
  if (p.money < trainingCost(s)) s.support = 'club';
  return s;
}

export function totals(history: Season[], level: 'first' | 'second' | 'amateur' = 'first') {
  history = history.filter((h) => (level === 'amateur' ? h.stage !== 'pro' : h.stage === 'pro'));
  const batting = emptyBat(),
    pitching = emptyPitch();
  for (const h of history) {
    for (const k of Object.keys(batting) as (keyof Batting)[])
      batting[k] += (level === 'second' ? h.minorBatting : h.batting)[k];
    for (const k of Object.keys(pitching) as (keyof Pitching)[])
      pitching[k] += (level === 'second' ? h.minorPitching : h.pitching)[k];
  }
  return {
    batting,
    pitching,
    war: level === 'second' ? 0 : Math.round(history.reduce((s, h) => s + h.war, 0) * 10) / 10,
  };
}
export const SAVE_KEY = 'road-to-legend:v1';
export function parseSave(raw: string): GameState {
  if (raw.length > 3_000_000) throw new Error('저장 파일이 너무 큽니다.');
  let value = JSON.parse(raw);
  if (value?.version === 1) {
    const old = legacyStateSchema.parse(value);
    if (
      !['KBO', 'NPB', 'MLB'].includes(old.player.league) ||
      old.history.some((h) => !['KBO', 'NPB', 'MLB'].includes(h.league))
    )
      throw new Error('이전 버전 리그 정보가 올바르지 않습니다.');
    value = {
      ...old,
      version: 2,
      player: {
        ...old.player,
        startAge: 19,
        stage: 'pro',
        grade: 0,
        squad: old.history.length ? 'first' : 'second',
        preferredTeam: old.player.league === 'KBO' ? old.player.team : TEAMS.KBO[0],
        potential: Math.max(85, ...Object.values(old.player.skills)),
        trust: 60,
        fatigue: 0,
        injuryDays: 0,
        entry: 'legacy',
      },
      history: old.history.map((h) => ({
        ...h,
        stage: 'pro',
        grade: 0,
        minorBatting: emptyBat(),
        minorPitching: emptyPitch(),
        registrationDays: 168,
        roster: [],
        draft: null,
      })),
      careerChoice: null,
      collegeTeam: TEAMS.COLLEGE[0],
    };
  }
  const s = stateSchema.parse(value);
  if (s.player.origin && !TALENTS[s.player.role].some((t) => t.id === s.player.origin!.archetype)) {
    throw new Error('선수 유형과 시작 컨셉이 일치하지 않습니다.');
  }
  const validBat = (b: Batting) =>
    b.h <= b.ab &&
    b.doubles + b.triples + b.hr <= b.h &&
    b.pa === b.ab + b.bb + b.hbp + b.sf + b.sh;
  const validPitch = (p: Pitching) =>
    p.er <= p.r &&
    p.hr <= p.h &&
    p.gs <= p.g &&
    p.w + p.l + p.sv + p.hld <= p.g &&
    p.so + p.bb + p.h + p.hbp <= p.bf;
  if (
    !TEAMS[s.player.league].includes(s.player.team) ||
    !TEAMS.KBO.includes(s.player.preferredTeam) ||
    !TEAMS.COLLEGE.includes(s.collegeTeam) ||
    (s.player.role === 'batter'
      ? ['SP', 'CP'].includes(s.player.position)
      : !['SP', 'CP'].includes(s.player.position))
  )
    throw new Error('올바르지 않은 선수 정보입니다.');
  const validStage = (p: { stage: CareerStage; grade: number; league: League }) =>
    p.stage === 'highschool'
      ? p.league === 'HS' && p.grade >= 1 && p.grade <= 3
      : p.stage === 'college'
        ? p.league === 'COLLEGE' && p.grade >= 1 && p.grade <= 4
        : p.stage === 'pro'
          ? ['KBO', 'NPB', 'MLB'].includes(p.league) && p.grade === 0
          : p.league === 'IND' && p.grade === 0;
  if (!validStage(s.player)) throw new Error('학년 또는 소속 단계가 올바르지 않습니다.');
  for (const h of s.history) {
    if (
      h.draft &&
      (h.draft.outcome === 'selected'
        ? !h.draft.team ||
          !TEAMS.KBO.includes(h.draft.team) ||
          h.draft.round < 1 ||
          h.draft.round > 10 ||
          h.draft.bonus <= 0
        : h.draft.team !== null || h.draft.round !== 0 || h.draft.bonus !== 0)
    )
      throw new Error('드래프트 결과가 올바르지 않습니다.');
    if (
      !validStage(h) ||
      !validBat(h.minorBatting) ||
      !validPitch(h.minorPitching) ||
      !validBat(h.batting) ||
      !validPitch(h.pitching) ||
      h.leaders.some((l) => !validBat(l.batting) || !validPitch(l.pitching)) ||
      h.standings.some((t) => t.w + t.l !== SEASON_GAMES[h.league])
    )
      throw new Error('기록이 손상된 저장 파일입니다.');
    if (h.roster.length) {
      const first = h.roster.filter((r) => r.squad === 'first'),
        second = h.roster.filter((r) => r.squad === 'second');
      for (const [periods, batting, pitching] of [
        [first, h.batting, h.pitching],
        [second, h.minorBatting, h.minorPitching],
      ] as const) {
        if (
          Object.keys(batting).some(
            (key) =>
              periods.reduce((sum, r) => sum + r.batting[key as keyof Batting], 0) !==
              batting[key as keyof Batting],
          ) ||
          Object.keys(pitching).some(
            (key) =>
              periods.reduce((sum, r) => sum + r.pitching[key as keyof Pitching], 0) !==
              pitching[key as keyof Pitching],
          )
        )
          throw new Error('1·2군 합산 기록이 일치하지 않습니다.');
      }
      if (
        h.stage !== 'pro' ||
        h.roster.length !== 24 ||
        new Set(h.roster.map((r) => r.period)).size !== 24
      )
        throw new Error('감독 평가 기록이 올바르지 않습니다.');
    }
    const teams = TEAMS[h.league];
    if (
      h.standings.length !== teams.length ||
      new Set(h.standings.map((t) => t.team)).size !== teams.length ||
      h.standings.some((t) => !teams.includes(t.team)) ||
      !teams.includes(h.team) ||
      !h.leaders.length
    )
      throw new Error('리그 정보가 손상된 저장 파일입니다.');
  }
  if (
    s.history.length !== new Set(s.history.map((h) => h.year)).size ||
    s.offers.some((o) => !TEAMS[o.league].includes(o.team))
  )
    throw new Error('올바르지 않은 시즌 정보입니다.');
  const seasons = s.history.length - (s.phase === 'preseason' ? 0 : 1);
  if (
    seasons < 0 ||
    s.year !== 2026 + seasons ||
    s.player.age !== s.player.startAge + seasons ||
    s.history.some(
      (h, i) =>
        h.year !== 2026 + i ||
        h.age !== s.player.startAge + i ||
        h.role !== s.player.role ||
        h.position !== s.player.position,
    )
  )
    throw new Error('커리어 순서가 올바르지 않습니다.');
  if (
    s.phase === 'offseason' && s.player.stage === 'pro'
      ? !s.offers.some((o) => o.id === s.selectedOffer)
      : s.offers.length > 0 || s.selectedOffer !== null
  )
    throw new Error('계약 정보가 손상되었습니다.');
  if (
    s.careerChoice &&
    (!needsCareerDecision({ ...s, careerChoice: null }) || !s.history.at(-1)?.draft)
  )
    throw new Error('진로 선택 기록이 올바르지 않습니다.');
  if (
    (s.phase === 'retired') !==
    (s.player.age === 40 && s.history.length === 41 - s.player.startAge)
  )
    throw new Error('은퇴 정보가 올바르지 않습니다.');
  return s;
}
