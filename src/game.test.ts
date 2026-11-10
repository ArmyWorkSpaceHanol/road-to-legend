import { describe, expect, it } from 'vitest';
import {
  battingRates,
  emptyBat,
  emptyPitch,
  generateTalentDraft,
  innings,
  makeCareer,
  nextSeason,
  parseSave,
  pitchingRates,
  playSeason,
  SEASON_GAMES,
  totals,
  TALENTS,
} from './game';
import type { GameState, Role } from './game';

describe('rookie talent cards', () => {
  it.each(['batter', 'pitcher'] as const)(
    'deals three distinct %s concepts with randomized, plausible skills',
    (role) => {
      const concepts = new Set<string>();
      const primary = {
        slugger: 'power',
        defender: 'fielding',
        runner: 'speed',
        fireballer: 'power',
        control: 'contact',
        breaking: 'fielding',
      } as const;
      for (let i = 0; i < 40; i++) {
        const draft = generateTalentDraft(role, (i * 982451653) >>> 0);
        expect(draft.cards).toHaveLength(3);
        expect(new Set(draft.cards.map((c) => c.archetype)).size).toBe(3);
        expect(new Set(draft.cards.map((c) => c.id)).size).toBe(3);
        for (const card of draft.cards) {
          concepts.add(card.archetype);
          expect(card.role).toBe(role);
          expect(
            Object.values(card.skills).every((n) => Number.isInteger(n) && n >= 30 && n <= 80),
          ).toBe(true);
          if (card.archetype === 'balanced') {
            expect(
              Math.max(...Object.values(card.skills)) - Math.min(...Object.values(card.skills)),
            ).toBeLessThanOrEqual(10);
          } else {
            expect(card.skills[primary[card.archetype]]).toBe(
              Math.max(...Object.values(card.skills)),
            );
          }
        }
      }
      expect([...concepts].sort()).toEqual(TALENTS[role].map((t) => t.id).sort());
    },
  );
  it('reproduces a deal by seed and varies both deals and individual skill rolls across seeds', () => {
    expect(generateTalentDraft('batter', 7001)).toEqual(generateTalentDraft('batter', 7001));
    const first = generateTalentDraft('batter', 7001),
      second = generateTalentDraft('batter', 8002);
    const shared = first.cards.find((c) =>
      second.cards.some((other) => other.archetype === c.archetype),
    )!;
    expect(shared.skills).not.toEqual(
      second.cards.find((c) => c.archetype === shared.archetype)!.skills,
    );
  });
  it('starts with the exact chosen skills and keeps the original card through growth and save restoration', () => {
    const draft = generateTalentDraft('batter', 7001),
      card = draft.cards[1],
      original = structuredClone(card);
    const s = makeCareer('카드 신인', 'batter', 'SS', undefined, draft.seed, card);
    expect(s.player.skills).toEqual(card.skills);
    expect(s.player.origin).toEqual({ archetype: card.archetype, skills: card.skills });
    const played = playSeason(s);
    expect(played.player.skills).not.toEqual(card.skills);
    expect(parseSave(JSON.stringify(played)).player.origin).toEqual(s.player.origin);
    expect(card).toEqual(original);
    expect(() => makeCareer('잘못된 선택', 'pitcher', 'SP', undefined, draft.seed, card)).toThrow();
  });
  it('keeps older saves without a starting card compatible', () => {
    const legacy = makeCareer('기존 선수');
    expect(parseSave(JSON.stringify(legacy))).toEqual(legacy);
    expect(parseSave(JSON.stringify(legacy)).player.origin).toBeUndefined();
  });
});

function completeSeasons(count: number, role: Role = 'batter'): GameState {
  let s = makeCareer('테스트 선수', role, role === 'batter' ? 'CF' : 'SP', undefined, 7001);
  for (let i = 0; i < count; i++) {
    if (i) s = nextSeason(s);
    s = playSeason(s);
  }
  return s;
}
describe('baseball rate calculations', () => {
  it('calculates all batting rates from raw counts, including sacrifice flies and hit-by-pitches', () => {
    const b = {
      ...emptyBat(),
      ab: 400,
      h: 120,
      doubles: 25,
      triples: 5,
      hr: 20,
      bb: 50,
      hbp: 5,
      sf: 5,
      so: 80,
    };
    const r = battingRates(b);
    expect(r.avg).toBe(0.3);
    expect(r.obp).toBeCloseTo(175 / 460);
    expect(r.slg).toBe(215 / 400);
    expect(r.ops).toBeCloseTo(175 / 460 + 215 / 400);
    expect(r.babip).toBeCloseTo(100 / 305);
  });
  it('counts partial innings as outs, never decimal fractions', () => {
    const p = { ...emptyPitch(), outs: 20, er: 2, h: 5, bb: 2, so: 7 };
    expect(innings(p.outs)).toBe('6.2');
    expect(pitchingRates(p).era).toBe(2.7);
    expect(pitchingRates(p).whip).toBe(1.05);
    expect(pitchingRates(p).k9).toBe(9.45);
  });
  it('never produces NaN for a new career', () => {
    expect(
      Object.values(battingRates(emptyBat())).every((n) => Number.isFinite(n) && n === 0),
    ).toBe(true);
    expect(
      Object.values(pitchingRates(emptyPitch())).every((n) => Number.isFinite(n) && n === 0),
    ).toBe(true);
  });
});
describe('one-click season simulation', () => {
  it('replays the same save identically and does not mutate its input', () => {
    const s = makeCareer('김테스트', 'batter', 'SS', undefined, 42),
      before = JSON.stringify(s);
    expect(playSeason(s)).toEqual(playSeason(s));
    expect(JSON.stringify(s)).toBe(before);
    expect(playSeason(s).history[0].batting.pa).toBeGreaterThan(400);
  });
  it.each(['batter', 'pitcher'] as const)(
    'preserves statistical invariants through a full %s career',
    (role) => {
      let s = makeCareer('김테스트', role, role === 'batter' ? 'CF' : 'SP', undefined, 27);
      for (let i = 0; i < 22; i++) {
        s = playSeason(s);
        const h = s.history.at(-1)!,
          b = h.batting,
          p = h.pitching;
        expect(b.h).toBeLessThanOrEqual(b.ab);
        expect(b.hr + b.doubles + b.triples).toBeLessThanOrEqual(b.h);
        expect(b.pa).toBe(b.ab + b.bb + b.hbp + b.sf + b.sh);
        expect(b.so).toBeLessThanOrEqual(b.ab - b.h);
        expect(p.er).toBeLessThanOrEqual(p.r);
        expect(p.w + p.l + p.sv + p.hld).toBeLessThanOrEqual(p.g);
        expect(p.so + p.h + p.bb + p.hbp).toBeLessThanOrEqual(p.bf);
        expect(h.standings.every((t) => t.w + t.l === SEASON_GAMES[h.league])).toBe(true);
        expect(h.standings.reduce((sum, t) => sum + t.w - t.l, 0)).toBe(0);
        expect(parseSave(JSON.stringify(s))).toEqual(s);
        if (i < 21) s = nextSeason(s);
      }
      expect(s.phase).toBe('retired');
      expect(s.player.age).toBe(40);
      expect(() => playSeason(s)).toThrow();
      expect(() => nextSeason(s)).toThrow();
    },
  );
  it('supports a closer career with saves and no starts', () => {
    const s = playSeason(makeCareer('마무리', 'pitcher', 'CP', undefined, 99));
    expect(s.history[0].pitching.gs).toBe(0);
    expect(s.history[0].pitching.sv).toBeGreaterThan(0);
  });
  it('deducts a support fee once, pays the current contract, and rejects overspending', () => {
    const s = makeCareer();
    s.support = 'coach';
    const result = playSeason(s);
    expect(result.player.money).toBe(s.player.money + s.player.salary - 2500);
    expect(() => playSeason(result)).toThrow();
    s.player.money = 2499;
    expect(() => playSeason(s)).toThrow('예산');
  });
  it('makes focused training measurably affect growth and season outcomes', () => {
    const s = makeCareer('육성', 'batter', 'CF', undefined, 15);
    s.plan = 'contact';
    const contact = playSeason(s);
    s.plan = 'power';
    const power = playSeason(s);
    expect(contact.player.skills.contact).toBeGreaterThan(power.player.skills.contact);
    expect(power.player.skills.power).toBeGreaterThan(contact.player.skills.power);
    expect(contact.history[0].batting).not.toEqual(power.history[0].batting);
  });
  it('makes recovery and conditioning reduce missed games across many seasons', () => {
    let normal = 0,
      rested = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const s = makeCareer('컨디셔닝', 'batter', 'CF', undefined, seed);
      normal += playSeason(s).history[0].injuryGames;
      s.plan = 'recovery';
      s.support = 'conditioning';
      rested += playSeason(s).history[0].injuryGames;
    }
    expect(rested).toBeLessThan(normal);
    expect(normal).toBeGreaterThan(0);
  });
});
describe('contracts, awards, and career persistence', () => {
  it('gates NPB and MLB offers by completed service and applies a chosen posting contract', () => {
    let s = completeSeasons(4);
    expect(s.offers.some((o) => o.league !== 'KBO')).toBe(false);
    s = playSeason(nextSeason(s));
    expect(s.offers.some((o) => o.league === 'NPB')).toBe(true);
    expect(s.offers.some((o) => o.league === 'MLB')).toBe(false);
    s = playSeason(nextSeason(s));
    s = playSeason(nextSeason(s));
    const mlb = s.offers.find((o) => o.id === 'mlb');
    expect(mlb).toBeDefined();
    s.selectedOffer = 'mlb';
    const moved = nextSeason(s);
    expect(moved.player.league).toBe('MLB');
    expect(moved.player.salary).toBe(mlb!.salary);
    expect(moved.player.money).toBe(s.player.money);
    const played = playSeason(moved);
    expect(played.history.at(-1)!.standings).toHaveLength(30);
    expect(played.history.at(-1)!.standings.every((t) => t.w + t.l === 162)).toBe(true);
    expect(played.offers.some((o) => o.id === 'return')).toBe(true);
  });
  it('supports NPB, MLB transfer after three NPB seasons, and domestic return', () => {
    let s = completeSeasons(5);
    s.selectedOffer = 'npb';
    s = nextSeason(s);
    for (let i = 0; i < 3; i++) {
      s = playSeason(s);
      if (i < 2) s = nextSeason(s);
    }
    expect(s.history.at(-1)!.standings).toHaveLength(12);
    expect(s.history.at(-1)!.standings[0].w + s.history.at(-1)!.standings[0].l).toBe(143);
    expect(s.offers.some((o) => o.id === 'mlb')).toBe(true);
    s.selectedOffer = 'return';
    expect(nextSeason(s).player.league).toBe('KBO');
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it('uses recomputed career rates rather than averaging annual rates', () => {
    const s = completeSeasons(3),
      t = totals(s.history);
    expect(t.batting.h).toBe(s.history.reduce((sum, h) => sum + h.batting.h, 0));
    expect(battingRates(t.batting).avg).toBe(t.batting.h / t.batting.ab);
  });
  it('awards batting titles only to qualified players and MVP to the highest WAR', () => {
    const s = completeSeasons(1),
      h = s.history[0];
    const mvp = h.awards.find((a) => a.title === '시즌 MVP')!;
    expect(h.leaders.find((p) => p.name === mvp.winner && p.team === mvp.team)?.war).toBe(
      Math.max(...h.leaders.map((p) => p.war)),
    );
    const winner = h.awards.find((a) => a.title === '타격왕')!;
    const leader = h.leaders.find((p) => p.name === winner.winner && p.team === winner.team)!;
    expect(leader.batting.pa).toBeGreaterThanOrEqual(144 * 3.1);
  });
  it('rejects malformed, unsupported, corrupted, and oversized save files', () => {
    expect(() => parseSave('{')).toThrow();
    expect(() => parseSave('{"version":999}')).toThrow();
    const s = completeSeasons(1);
    s.history[0].batting.h = 100000;
    expect(() => parseSave(JSON.stringify(s))).toThrow();
    expect(() => parseSave(' '.repeat(3_000_001))).toThrow();
  });
  it('rejects incomplete standings and impossible career phases instead of loading a broken UI', () => {
    const s = completeSeasons(1);
    s.history[0].standings = [];
    expect(() => parseSave(JSON.stringify(s))).toThrow('리그');
    const fresh = makeCareer();
    fresh.phase = 'offseason';
    expect(() => parseSave(JSON.stringify(fresh))).toThrow();
  });
});
