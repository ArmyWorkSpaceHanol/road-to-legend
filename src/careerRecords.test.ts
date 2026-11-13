import { describe, expect, it } from 'vitest';
import { careerRecords } from './careerRecords';
import { emptyBat, emptyPitch, makeCareer, parseSave, playSeason } from './game';
import type { Season } from './game';

function season(year: number, overrides: Partial<Season> = {}): Season {
  const base = playSeason(makeCareer('기록 선수', 'batter', 'CF', undefined, 7001)).history[0];
  return {
    ...base,
    year,
    stage: 'pro',
    league: 'KBO',
    batting: emptyBat(),
    pitching: emptyPitch(),
    minorBatting: emptyBat(),
    minorPitching: emptyPitch(),
    ...overrides,
  };
}
const milestone = (report: ReturnType<typeof careerRecords>, id: string) =>
  report.milestones.find((metric) => metric.id === id)!;
const best = (report: ReturnType<typeof careerRecords>, id: string) =>
  report.bests.find((metric) => metric.id === id)!.best;

describe('career milestones and personal records', () => {
  it('starts with empty progress and no personal records, including rate records', () => {
    for (const role of ['batter', 'pitcher'] as const) {
      const report = careerRecords([], role, 'first');
      expect(report.achievements).toEqual([]);
      expect(report.milestones.every((metric) => metric.current === 0 && metric.next! > 0)).toBe(
        true,
      );
      expect(report.bests.every((metric) => metric.best === null)).toBe(true);
    }
  });
  it('keeps amateur, first-team, minor-league, league and role records separate', () => {
    const history = [
      season(2026, { stage: 'highschool', league: 'HS', batting: { ...emptyBat(), h: 90 } }),
      season(2027, { batting: { ...emptyBat(), h: 99 }, minorBatting: { ...emptyBat(), h: 50 } }),
      season(2028, { league: 'MLB', batting: { ...emptyBat(), h: 2 } }),
      season(2029, { role: 'pitcher', batting: { ...emptyBat(), h: 30 } }),
    ];
    expect(milestone(careerRecords(history, 'batter', 'amateur'), 'h').current).toBe(90);
    expect(milestone(careerRecords(history, 'batter', 'second'), 'h').current).toBe(50);
    expect(milestone(careerRecords(history, 'batter', 'first', 'KBO'), 'h').current).toBe(99);
    expect(milestone(careerRecords(history, 'batter', 'first'), 'h').current).toBe(101);
    expect(careerRecords(history, 'batter', 'amateur', 'MLB').achievements).toEqual([]);
  });
  it('records the first crossing season exactly once, including multiple targets in one season', () => {
    const history = [
      season(2028, { batting: { ...emptyBat(), h: 500 } }),
      season(2026, { batting: { ...emptyBat(), h: 99 } }),
      season(2027, { batting: { ...emptyBat(), h: 1 } }),
    ];
    const original = structuredClone(history);
    const hits = milestone(careerRecords(history, 'batter', 'first'), 'h');
    expect(hits.achieved.map(({ target, season }) => [target, season.year])).toEqual([
      [1, 2026],
      [100, 2027],
      [500, 2028],
    ]);
    expect(hits.next).toBe(1000);
    expect(hits.current).toBe(600);
    expect(history).toEqual(original);
    const completed = milestone(
      careerRecords([season(2026, { batting: { ...emptyBat(), h: 3001 } })], 'batter', 'first'),
      'h',
    );
    expect(completed.next).toBeNull();
    expect(completed.current).toBe(3001);
    expect(completed.achieved).toHaveLength(7);
  });
  it('uses outs for inning milestones and preserves fractional innings in progress', () => {
    const history = [
      season(2026, { role: 'pitcher', pitching: { ...emptyPitch(), outs: 299 } }),
      season(2027, { role: 'pitcher', pitching: { ...emptyPitch(), outs: 2 } }),
    ];
    const report = careerRecords(history, 'pitcher', 'first');
    const innings = milestone(report, 'outs');
    expect(innings.current).toBe(301);
    expect(innings.format(innings.current)).toBe('100.1');
    expect(innings.format(innings.next! - innings.current)).toBe('399.2');
    expect(innings.achieved.map(({ target, season }) => [target, season.year])).toEqual([
      [3, 2026],
      [300, 2027],
    ]);
  });
  it('requires league-specific qualifying plate appearances and keeps the earliest unrounded tie', () => {
    const history = [
      season(2028, { batting: { ...emptyBat(), pa: 447, ab: 400, h: 120 } }),
      season(2026, { batting: { ...emptyBat(), pa: 446, ab: 400, h: 200 } }),
      season(2027, { batting: { ...emptyBat(), pa: 447, ab: 400, h: 120 } }),
    ];
    const report = careerRecords(history, 'batter', 'first');
    expect(best(report, 'avg')?.value).toBe(0.3);
    expect(best(report, 'avg')?.season.year).toBe(2027);
    expect(best(report, 'h')?.season.year).toBe(2026);
    expect(
      best(
        careerRecords(
          [
            season(2026, {
              stage: 'highschool',
              league: 'HS',
              batting: { ...emptyBat(), pa: 93, ab: 80, h: 20 },
            }),
          ],
          'batter',
          'amateur',
        ),
        'avg',
      )?.value,
    ).toBe(0.25);
    const minors = [season(2026, { minorBatting: { ...emptyBat(), pa: 372, ab: 350, h: 105 } })];
    expect(best(careerRecords(minors, 'batter', 'second'), 'avg')?.value).toBe(0.3);
    expect(best(careerRecords(minors, 'batter', 'first'), 'avg')).toBeNull();
  });
  it('selects lower pitching rates, allows a real zero ERA, and excludes short scoreless outings', () => {
    const history = [
      season(2026, { role: 'pitcher', pitching: { ...emptyPitch(), g: 1, outs: 3, er: 0 } }),
      season(2027, {
        role: 'pitcher',
        pitching: { ...emptyPitch(), g: 30, outs: 432, er: 48, h: 100, bb: 44 },
      }),
      season(2028, {
        role: 'pitcher',
        pitching: { ...emptyPitch(), g: 30, outs: 432, er: 0, h: 80, bb: 30 },
      }),
    ];
    const report = careerRecords(history, 'pitcher', 'first');
    expect(best(report, 'era')).toMatchObject({ value: 0, season: { year: 2028 } });
    expect(best(report, 'whip')?.season.year).toBe(2028);
    expect(best(careerRecords(history.slice(0, 1), 'pitcher', 'first'), 'era')).toBeNull();
  });
  it('rebuilds the same report from saved history without adding save fields', () => {
    const state = playSeason(makeCareer('복원 선수', 'batter', 'CF', undefined, 7001));
    const raw = JSON.stringify(state);
    const restored = parseSave(raw);
    expect(careerRecords(restored.history, 'batter', 'amateur')).toEqual(
      careerRecords(state.history, 'batter', 'amateur'),
    );
    expect(JSON.stringify(state)).toBe(raw);
  });
});
