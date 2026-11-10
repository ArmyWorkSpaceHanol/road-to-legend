import { describe, expect, it } from 'vitest';
import {
  battingRates,
  emptyBat,
  emptyPitch,
  generateTalentDraft,
  innings,
  makeCareer,
  parseSave,
  pitchingRates,
  playSeason,
  TALENTS,
} from './game';

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
            Object.values(card.skills).every((n) => Number.isInteger(n) && n >= 18 && n <= 68),
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
  it('keeps saves without a starting card compatible', () => {
    const legacy = makeCareer('기존 선수');
    expect(parseSave(JSON.stringify(legacy))).toEqual(legacy);
    expect(parseSave(JSON.stringify(legacy)).player.origin).toBeUndefined();
  });
});
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
