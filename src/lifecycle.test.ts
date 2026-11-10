import { describe, expect, it } from 'vitest';
import {
  battingRates,
  chooseCareerPath,
  evaluateManager,
  internationalEligibility,
  makeCareer,
  needsCareerDecision,
  nextSeason,
  parseSave,
  playSeason,
  SEASON_GAMES,
  TEAMS,
  totals,
  trainingCost,
} from './game';
import type { GameState, ManagerInput, Role, Skills } from './game';

const uniform = (n: number): Skills => ({
  contact: n,
  power: n,
  speed: n,
  fielding: n,
  discipline: n,
  mental: n,
});
function highGraduate(role: Role = 'batter') {
  let s = makeCareer('고교 유망주', role, role === 'batter' ? 'SS' : 'SP', TEAMS.KBO[1], 7001);
  for (let i = 0; i < 3; i++) {
    if (i) s = nextSeason(s);
    s = playSeason(s);
  }
  return s;
}
function earlyEligible(role: Role = 'batter') {
  let s = nextSeason(chooseCareerPath(highGraduate(role), 'college', TEAMS.COLLEGE[1]));
  s = nextSeason(playSeason(s));
  return playSeason(s);
}
function outcome(s: GameState, choice: 'draft' | 'tryout', selected: boolean) {
  for (let i = 0; i < 1000; i++) {
    const result = chooseCareerPath(
      { ...s, seed: (i * 982451653) >>> 0 },
      choice,
      TEAMS.COLLEGE[2],
    );
    if ((result.history.at(-1)!.draft!.outcome === 'selected') === selected) return result;
  }
  throw new Error('Expected outcome was not generated');
}
function professional(role: Role = 'batter', rating = 70, squad: 'first' | 'second' = 'second') {
  const s = makeCareer('프로 테스트', role, role === 'batter' ? 'CF' : 'SP', undefined, 7001);
  Object.assign(s.player, {
    age: 19,
    startAge: 19,
    stage: 'pro',
    grade: 0,
    squad,
    league: 'KBO',
    team: TEAMS.KBO[0],
    skills: uniform(rating),
    potential: Math.max(rating, 90),
    salary: 3000,
    money: 8000,
    entry: 'legacy',
    trust: 60,
  });
  return s;
}
function automaticChoice(s: GameState) {
  if (!needsCareerDecision(s)) return s;
  return chooseCareerPath(
    s,
    s.player.stage === 'independent'
      ? 'tryout'
      : s.player.stage === 'highschool'
        ? 'college'
        : 'draft',
  );
}

describe('school years and draft decisions', () => {
  it('starts at 16 in high school, not in a preferred professional club', () => {
    const s = makeCareer('신입생', 'batter', 'CF', TEAMS.KBO[4], 31, undefined, TEAMS.HS[2]);
    expect(s.player).toMatchObject({
      stage: 'highschool',
      grade: 1,
      age: 16,
      team: TEAMS.HS[2],
      preferredTeam: TEAMS.KBO[4],
      salary: 0,
    });
    expect(() => chooseCareerPath(s, 'draft')).toThrow();
    const h1 = playSeason(s);
    expect(h1.history[0].batting.g).toBeLessThanOrEqual(30);
    expect(h1.offers).toHaveLength(0);
    expect(nextSeason(h1).player.grade).toBe(2);
    expect(highGraduate().player).toMatchObject({ grade: 3, age: 18 });
  });
  it('requires an explicit final-year decision and prevents replaying the same draft', () => {
    const s = highGraduate();
    expect(needsCareerDecision(s)).toBe(true);
    expect(() => nextSeason(s)).toThrow('진로');
    const result = chooseCareerPath(s, 'draft');
    expect(() => chooseCareerPath(result, 'draft')).toThrow();
    expect(() => chooseCareerPath(s, 'continue')).toThrow();
    expect(s.history.at(-1)!.draft).toBeNull();
  });
  it('allows college as a deliberate route and opens early entry only after college year 2', () => {
    let s = nextSeason(chooseCareerPath(highGraduate(), 'college', TEAMS.COLLEGE[3]));
    expect(s.player).toMatchObject({ stage: 'college', grade: 1, age: 19, team: TEAMS.COLLEGE[3] });
    expect(() => chooseCareerPath(playSeason(s), 'draft')).toThrow();
    s = playSeason(nextSeason(playSeason(s)));
    expect(s.player.grade).toBe(2);
    expect(needsCareerDecision(s)).toBe(true);
    expect(nextSeason(chooseCareerPath(s, 'continue')).player).toMatchObject({
      stage: 'college',
      grade: 3,
      age: 21,
    });
  });
  it('automatically sends an undrafted high-school applicant to the chosen university', () => {
    const s = outcome(highGraduate(), 'draft', false);
    expect(s.history.at(-1)!.draft!.outcome).toBe('undrafted');
    expect(nextSeason(s).player).toMatchObject({
      stage: 'college',
      grade: 1,
      team: TEAMS.COLLEGE[2],
      age: 19,
    });
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it('signs a drafted high-school player into the second team and pays the bonus once', () => {
    const s = outcome(highGraduate(), 'draft', true),
      result = s.history.at(-1)!.draft!;
    const next = nextSeason(s);
    expect(next.player).toMatchObject({
      stage: 'pro',
      squad: 'second',
      grade: 0,
      age: 19,
      team: result.team,
      salary: 3000,
      entry: 'highschool',
    });
    expect(next.player.money).toBe(s.player.money + result.bonus);
    expect(() => nextSeason(next)).toThrow();
    expect(parseSave(JSON.stringify(next))).toEqual(next);
  });
  it.each(['batter', 'pitcher'] as const)(
    'supports both selected and undrafted early-entry %s players',
    (role) => {
      const s = earlyEligible(role);
      const drafted = nextSeason(outcome(s, 'draft', true));
      expect(drafted.player).toMatchObject({
        stage: 'pro',
        squad: 'second',
        entry: 'early',
        age: 21,
      });
      const missed = nextSeason(outcome(s, 'draft', false));
      expect(missed.player).toMatchObject({ stage: 'college', grade: 3, age: 21 });
    },
  );
  it('continues from university graduation to independent baseball and a second chance', () => {
    let s = nextSeason(chooseCareerPath(earlyEligible(), 'continue'));
    s = playSeason(nextSeason(playSeason(s)));
    expect(s.player.grade).toBe(4);
    s = nextSeason(outcome(s, 'draft', false));
    expect(s.player).toMatchObject({ stage: 'independent', league: 'IND', age: 23 });
    s = playSeason(s);
    const signed = nextSeason(outcome(s, 'tryout', true));
    expect(signed.player).toMatchObject({ stage: 'pro', squad: 'second', entry: 'tryout' });
    expect(nextSeason(outcome(s, 'tryout', false)).player.stage).toBe('independent');
  });
});

describe('manager evaluation and genuine roster movement', () => {
  const base: ManagerInput = {
    skills: uniform(65),
    role: 'batter',
    position: 'CF',
    squad: 'second',
    form: 65,
    trust: 50,
    competition: 75,
    fatigue: 25,
    injuryDays: 0,
    opportunity: false,
    poorPeriods: 0,
    periods: 3,
  };
  it('considers performance, readiness, trust and openings rather than promoting by age', () => {
    expect(evaluateManager(base).decision).toBe('retained');
    expect(evaluateManager({ ...base, opportunity: true }).decision).toBe('promoted');
    const strong = { ...base, skills: uniform(90), form: 90, trust: 90 };
    expect(evaluateManager(strong).decision).toBe('promoted');
    expect(evaluateManager({ ...strong, periods: 1 }).decision).toBe('retained');
  });
  it('demotes for sustained slump, injury, exhaustion or a returning competitor', () => {
    expect(
      evaluateManager({ ...base, squad: 'first', form: 15, trust: 20, poorPeriods: 2 }).decision,
    ).toBe('demoted');
    expect(evaluateManager({ ...base, squad: 'first', injuryDays: 30 }).decision).toBe('demoted');
    expect(evaluateManager({ ...base, squad: 'first', fatigue: 90 }).decision).toBe('demoted');
    expect(evaluateManager({ ...base, squad: 'first', competition: 90 }).decision).toBe('demoted');
    expect(
      evaluateManager({ ...base, skills: uniform(95), form: 95, trust: 95, fatigue: 90 }).decision,
    ).toBe('retained');
  });
  it.each(['batter', 'pitcher'] as const)(
    'separates every %s appearance into the actual team at that time',
    (role) => {
      const s = playSeason(professional(role, 88)),
        h = s.history[0];
      expect(h.roster).toHaveLength(24);
      expect(h.roster[0].squad).toBe('second');
      expect(h.roster.some((r) => r.decision === 'promoted')).toBe(true);
      expect(role === 'batter' ? h.batting.pa : h.pitching.outs).toBeGreaterThan(0);
      expect(role === 'batter' ? h.minorBatting.pa : h.minorPitching.outs).toBeGreaterThan(0);
      expect(h.batting.g).toBe(
        h.roster.filter((r) => r.squad === 'first').reduce((n, r) => n + r.batting.g, 0),
      );
      expect(h.minorPitching.outs).toBe(
        h.roster.filter((r) => r.squad === 'second').reduce((n, r) => n + r.pitching.outs, 0),
      );
      expect(parseSave(JSON.stringify(s))).toEqual(s);
    },
  );
  it('can call up and send down the same player during one season', () => {
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      const s = professional('batter', 65);
      s.seed = (i * 982451653) >>> 0;
      const moves = playSeason(s).history[0].roster;
      found =
        moves.some((r) => r.decision === 'promoted') && moves.some((r) => r.decision === 'demoted');
    }
    expect(found).toBe(true);
  });
  it('does not count a struggling minor-league season as major-league service', () => {
    const s = playSeason(professional('batter', 25));
    expect(s.history[0].batting.pa).toBe(0);
    expect(s.history[0].minorBatting.pa).toBeGreaterThan(200);
    expect(totals(s.history).batting.pa).toBe(0);
    expect(totals(s.history, 'second').batting.pa).toBeGreaterThan(200);
    expect(internationalEligibility(s).service).toBe(0);
    expect(s.offers.map((o) => o.id)).toEqual(['renew']);
  });
});

describe('career invariants, finances and save compatibility', () => {
  it('uses affordable amateur training costs and pays no professional salary at school', () => {
    const s = makeCareer();
    s.support = 'coach';
    expect(trainingCost(s)).toBe(200);
    expect(playSeason(s).player.money).toBe(250);
    const pro = professional();
    pro.support = 'coach';
    expect(trainingCost(pro)).toBe(2500);
    expect(playSeason(pro).player.money).toBe(pro.player.money + pro.player.salary - 2500);
    pro.player.money = 2499;
    expect(() => playSeason(pro)).toThrow('예산');
  });
  it('counts actual registered days, not amateur years or years in the organization, for posting', () => {
    const s = playSeason(professional('batter', 90, 'first'));
    const h = s.history[0];
    s.history = Array.from({ length: 7 }, (_, i) => ({
      ...structuredClone(h),
      year: 2026 + i,
      age: 19 + i,
      registrationDays: 145,
    }));
    expect(internationalEligibility(s)).toMatchObject({ service: 7, npb: true, mlb: true });
    s.history[0].registrationDays = 0;
    expect(internationalEligibility(s)).toMatchObject({ service: 6, mlb: false });
    expect(internationalEligibility(highGraduate()).service).toBe(0);
  });
  it.each(['batter', 'pitcher'] as const)(
    'plays a complete %s life from high school to retirement without broken transitions',
    (role) => {
      let s = makeCareer('평생 선수', role, role === 'batter' ? 'CF' : 'SP', undefined, 7001);
      for (let i = 0; i < 25; i++) {
        s = playSeason(s);
        const h = s.history.at(-1)!;
        for (const [b, p] of [
          [h.batting, h.pitching],
          [h.minorBatting, h.minorPitching],
        ] as const) {
          expect(b.h).toBeLessThanOrEqual(b.ab);
          expect(b.doubles + b.triples + b.hr).toBeLessThanOrEqual(b.h);
          expect(b.pa).toBe(b.ab + b.bb + b.hbp + b.sf + b.sh);
          expect(p.er).toBeLessThanOrEqual(p.r);
          expect(p.w + p.l + p.sv + p.hld).toBeLessThanOrEqual(p.g);
        }
        expect(h.standings.every((t) => t.w + t.l === SEASON_GAMES[h.league])).toBe(true);
        expect(h.standings.reduce((sum, t) => sum + t.w - t.l, 0)).toBe(0);
        expect(parseSave(JSON.stringify(s))).toEqual(s);
        if (i < 24) {
          s = automaticChoice(s);
          expect(parseSave(JSON.stringify(s))).toEqual(s);
          s = nextSeason(s);
        }
      }
      expect(s.phase).toBe('retired');
      expect(s.player.age).toBe(40);
      expect(s.history.slice(0, 3).map((h) => h.grade)).toEqual([1, 2, 3]);
      expect(s.history.some((h) => h.stage === 'pro')).toBe(true);
      expect(() => nextSeason(s)).toThrow();
      expect(() => playSeason(s)).toThrow();
      const pro = totals(s.history),
        amateur = totals(s.history, 'amateur');
      expect(amateur.batting.pa + amateur.pitching.outs).toBeGreaterThan(0);
      expect(battingRates(pro.batting).avg).toBe(
        pro.batting.ab ? pro.batting.h / pro.batting.ab : 0,
      );
    },
  );
  it('preserves older professional careers rather than inventing or replacing school years', () => {
    const current = playSeason(professional('batter', 80));
    const old = JSON.parse(JSON.stringify(current));
    old.version = 1;
    for (const key of [
      'stage',
      'grade',
      'squad',
      'preferredTeam',
      'potential',
      'trust',
      'fatigue',
      'injuryDays',
      'entry',
      'startAge',
    ])
      delete old.player[key];
    for (const h of old.history)
      for (const key of [
        'stage',
        'grade',
        'minorBatting',
        'minorPitching',
        'registrationDays',
        'roster',
        'draft',
      ])
        delete h[key];
    delete old.careerChoice;
    delete old.collegeTeam;
    const restored = parseSave(JSON.stringify(old));
    expect(restored.version).toBe(2);
    expect(restored.player.stage).toBe('pro');
    expect(restored.player.age).toBe(19);
    expect(restored.history[0].batting).toEqual(current.history[0].batting);
    expect(parseSave(JSON.stringify(restored))).toEqual(restored);
    expect(playSeason(nextSeason(restored)).history).toHaveLength(2);
  });
  it('rejects corrupted splits, invalid grades and unsupported saves', () => {
    const s = playSeason(professional());
    s.history[0].minorBatting.h++;
    expect(() => parseSave(JSON.stringify(s))).toThrow();
    const student = makeCareer();
    student.player.grade = 4;
    expect(() => parseSave(JSON.stringify(student))).toThrow();
    expect(() => parseSave('{')).toThrow();
    expect(() => parseSave('{"version":999}')).toThrow();
  });
});
