import { describe, expect, it } from 'vitest';
import {
  applyForSelection,
  chooseCareerPath,
  internationalEligibility,
  makeCareer,
  negotiateSalary,
  nextSeason,
  parseSave,
  playSeason,
  requestPosting,
  scoutReport,
  TEAMS,
} from './game';
import {
  creditedService,
  kboEligibility,
  salaryNegotiationReport,
  selectionReport,
} from './careerRules';
import type { GameState } from './game';

function professional(seed = 41, rating = 80) {
  const s = makeCareer('계약 선수', 'batter', 'CF', undefined, seed);
  Object.assign(s.player, {
    stage: 'pro',
    grade: 0,
    age: 19,
    startAge: 19,
    league: 'KBO',
    team: TEAMS.KBO[0],
    squad: 'first',
    entry: 'legacy',
    salary: 5000,
    money: 10000,
    skills: {
      contact: rating,
      power: rating,
      speed: rating,
      fielding: rating,
      discipline: rating,
      mental: rating,
    },
    potential: 95,
  });
  return s;
}
function years(n: number, days = 145) {
  const s = playSeason(professional());
  const first = s.history[0];
  s.history = Array.from({ length: n }, (_, i) => ({
    ...structuredClone(first),
    year: 2026 + i,
    age: 19 + i,
    registrationDays: days,
  }));
  s.year = 2026 + n - 1;
  s.player.age = 19 + n - 1;
  return s;
}
function resultWith<T>(base: GameState, run: (s: GameState) => T, success: (s: T) => boolean) {
  for (let seed = 1; seed < 1000; seed++) {
    const result = run({ ...structuredClone(base), seed: (seed * 982451653) >>> 0 });
    if (success(result)) return result;
  }
  throw new Error('Outcome not found');
}

describe('draft projections', () => {
  it('shows the same probability used for selection and records a consistent 11-round pick', () => {
    let s = makeCareer('드래프트 유망주');
    for (let i = 0; i < 3; i++) {
      if (i) s = nextSeason(s);
      s = playSeason(s);
    }
    let found = false;
    for (let i = 1; i < 100; i++) {
      const source = { ...s, seed: (i * 982451653) >>> 0 },
        report = scoutReport(source);
      const drafted = chooseCareerPath(source, 'draft'),
        actual = drafted.history.at(-1)!.draft!;
      expect(actual.probability).toBe(report.probability);
      if (actual.outcome === 'selected') {
        expect(actual.round).toBe(Math.ceil(actual.pick! / 10));
        expect(actual.pick).toBeGreaterThanOrEqual(report.lowPick);
        expect(actual.pick).toBeLessThanOrEqual(report.highPick);
        expect(parseSave(JSON.stringify(drafted))).toEqual(drafted);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('KBO qualification accounting', () => {
  it('credits full years and carries short-season days without double-counting surplus days', () => {
    const s = years(3);
    s.history[0].registrationDays = 168;
    s.history[1].registrationDays = 80;
    s.history[2].registrationDays = 65;
    expect(creditedService(s.history)).toMatchObject({ years: 2, days: 0 });
    s.history[2].registrationDays = 64;
    expect(creditedService(s.history)).toMatchObject({ years: 1, days: 144 });
    s.history[0].stage = 'college';
    expect(creditedService(s.history).years).toBe(0);
  });
  it('requires 8 initial FA seasons, 7 for four-year graduates, and 4 after exercising FA', () => {
    const s = years(7);
    expect(kboEligibility(s).fa).toBe(false);
    s.player.entry = 'early';
    expect(kboEligibility(s).fa).toBe(false);
    s.player.entry = 'college';
    expect(kboEligibility(s).fa).toBe(true);
    s.player.faSignedYear = 2029;
    expect(kboEligibility(s)).toMatchObject({
      repeat: true,
      faRequired: 4,
      faService: 4,
      fa: true,
    });
    s.player.faSignedYear = 2030;
    expect(kboEligibility(s).fa).toBe(false);
  });
  it('starts a new four-season FA clock only when an FA contract is chosen', () => {
    const s = playSeason(nextSeason(years(8)));
    expect(s.offers.some((o) => o.id === 'domestic')).toBe(true);
    expect(nextSeason(s).player.faSignedYear).toBeUndefined();
    s.selectedOffer = 'renew-fa';
    const signed = nextSeason(s);
    expect(signed.player.faSignedYear).toBe(s.year + 1);
    const next = playSeason(signed);
    expect(next.offers.some((o) => o.usesFA)).toBe(false);
    expect(kboEligibility(next).faService).toBe(1);
    expect(parseSave(JSON.stringify(next))).toEqual(next);
  });
  it('uses seven years for both posting destinations without a rating requirement', () => {
    const s = years(6);
    expect(internationalEligibility(s)).toMatchObject({ npb: false, mlb: false });
    const eligible = years(7);
    for (const key of Object.keys(
      eligible.player.skills,
    ) as (keyof typeof eligible.player.skills)[])
      eligible.player.skills[key] = 25;
    expect(internationalEligibility(eligible)).toMatchObject({ npb: true, mlb: true });
  });
  it('refreshes obsolete offseason offers and rejects an unapproved overseas contract', () => {
    const s = years(5);
    s.offers.push({
      id: 'npb',
      league: 'NPB',
      team: TEAMS.NPB[0],
      salary: 10000,
      route: '구단 동의 · NPB 진출',
    });
    s.selectedOffer = 'npb';
    expect(() => nextSeason(s)).toThrow('구단 승인');
    const restored = parseSave(JSON.stringify(s));
    expect(restored.offers.map((o) => o.id)).toEqual(['renew']);
    expect(restored.selectedOffer).toBe('renew');
    expect(restored.offers[0].salary).toBe(s.offers[0].salary);
  });
  it('requires and saves club consent, retaining negotiated salary when offers refresh', () => {
    const s = years(7);
    const negotiated = resultWith(
      s,
      (x) => negotiateSalary(x, Math.round(x.offers[0].salary * 1.05)),
      (x) => x.negotiation!.accepted,
    );
    const approved = resultWith(negotiated, requestPosting, (x) => x.postingDecision!.approved);
    expect(approved.offers.map((x) => x.id)).toContain('mlb');
    expect(approved.offers.map((x) => x.id)).toContain('npb');
    expect(approved.offers.find((x) => x.id === 'renew')!.salary).toBe(
      negotiated.offers.find((x) => x.id === 'renew')!.salary,
    );
    expect(() => requestPosting(approved)).toThrow('한 번');
    expect(parseSave(JSON.stringify(approved))).toEqual(approved);
    const denied = resultWith(s, requestPosting, (x) => !x.postingDecision!.approved);
    expect(denied.offers.map((x) => x.id)).toEqual(['renew']);
  });
});

describe('annual salary negotiation', () => {
  it('raises the chance with performance and lowers it as the requested raise increases', () => {
    const s = playSeason(professional());
    const base = s.offers[0].salary;
    expect(salaryNegotiationReport(s, base * 1.05).probability).toBeGreaterThan(
      salaryNegotiationReport(s, base * 1.3).probability,
    );
    const poor = structuredClone(s);
    poor.history[0].war = -1;
    poor.history[0].batting.h = 0;
    expect(salaryNegotiationReport(s, base * 1.1).probability).toBeGreaterThan(
      salaryNegotiationReport(poor, base * 1.1).probability,
    );
  });
  it.each([true, false])(
    'saves a %s outcome and prevents a second attempt after reload',
    (accepted) => {
      const s = playSeason(professional()),
        requested = Math.round(s.offers[0].salary * 1.1);
      const outcome = resultWith(
        s,
        (x) => negotiateSalary(x, requested),
        (x) => x.negotiation!.accepted === accepted,
      );
      const restored = parseSave(JSON.stringify(outcome));
      expect(() => negotiateSalary(restored, requested)).toThrow('한 번');
      expect(restored.offers[0].salary).toBe(accepted ? requested : s.offers[0].salary);
      expect(restored.history[0].negotiation).toEqual(restored.negotiation);
      expect(nextSeason(restored).player.salary).toBe(restored.offers[0].salary);
      expect(nextSeason(restored).negotiation).toBeUndefined();
      expect(s.negotiation).toBeUndefined();
    },
  );
  it('rejects invalid requests without consuming the only attempt', () => {
    const s = playSeason(professional()),
      base = s.offers[0].salary;
    for (const requested of [NaN, Infinity, base, base * 3, -100])
      expect(() => negotiateSalary(s, requested)).toThrow();
    expect(s.negotiation).toBeUndefined();
  });
});

describe('national and Sangmu selection', () => {
  it('records one representative selection per year and keeps probabilities after reload', () => {
    const s = playSeason(professional());
    const report = selectionReport(s, 'national');
    expect(report.eligible).toBe(true);
    const result = applyForSelection(s, 'national');
    expect(result.history[0].selections![0].probability).toBe(report.probability);
    expect(() => applyForSelection(parseSave(JSON.stringify(result)), 'national')).toThrow('이미');
  });
  it('limits Sangmu to eligible unserved KBO players and next-year enlistment age', () => {
    const s = playSeason(professional());
    expect(selectionReport(s, 'sangmu').eligible).toBe(true);
    s.player.age = 27;
    expect(selectionReport(s, 'sangmu').eligible).toBe(false);
    s.player.age = 26;
    s.player.military = { status: 'completed', months: 0 };
    expect(selectionReport(s, 'sangmu').eligible).toBe(false);
    s.player.military = undefined;
    s.player.league = 'MLB';
    expect(selectionReport(s, 'sangmu').eligible).toBe(false);
  });
  it('serves 18 months in the second team and returns to the original club without first-team service', () => {
    const s = playSeason(professional());
    const selected = resultWith(
      s,
      (x) => applyForSelection(x, 'sangmu'),
      (x) => x.player.military?.status === 'scheduled',
    );
    expect(selected.offers.map((x) => x.id)).toEqual(['renew']);
    let serving = nextSeason(selected);
    expect(serving.player.military).toEqual({ status: 'serving', months: 18 });
    serving = playSeason(serving);
    const first = serving.history.at(-1)!;
    expect(first.registrationDays).toBe(0);
    expect(first.batting.g).toBe(0);
    expect(first.minorBatting.g).toBeGreaterThan(0);
    expect(serving.player.military).toEqual({ status: 'serving', months: 6 });
    expect(parseSave(JSON.stringify(serving))).toEqual(serving);
    serving = playSeason(nextSeason(serving));
    expect(
      serving.history
        .at(-1)!
        .roster.slice(0, 12)
        .every((r) => r.squad === 'second'),
    ).toBe(true);
    expect(serving.player.military).toEqual({ status: 'completed', months: 0 });
    expect(serving.player.team).toBe(s.player.team);
    expect(parseSave(JSON.stringify(serving))).toEqual(serving);
  });
});
