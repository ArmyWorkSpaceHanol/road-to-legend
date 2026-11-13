import { describe, expect, it } from 'vitest';
import { growthHistory, growthMetrics } from './careerGrowth';
import { emptyBat, emptyPitch, makeCareer, playSeason } from './game';

describe('growth comparisons', () => {
  it('uses the selected squad and league, sorts years and preserves source records', () => {
    const season = playSeason(makeCareer('기록 선수')).history[0];
    const history = [
      {
        ...season,
        year: 2028,
        stage: 'pro' as const,
        league: 'MLB' as const,
        minorBatting: { ...emptyBat(), h: 20 },
      },
      {
        ...season,
        year: 2027,
        stage: 'pro' as const,
        league: 'KBO' as const,
        minorBatting: { ...emptyBat(), h: 10 },
      },
      season,
    ];
    const before = structuredClone(history);
    expect(
      growthHistory(history, 'batter', 'second').map((s) => [s.year, s.batting.h, s.war]),
    ).toEqual([
      [2027, 10, 0],
      [2028, 20, 0],
    ]);
    expect(growthHistory(history, 'batter', 'first', 'KBO')).toHaveLength(1);
    expect(growthHistory(history, 'batter', 'amateur')).toHaveLength(1);
    expect(history).toEqual(before);
  });
  it('distinguishes a missing rate from a real zero and keeps innings in outs', () => {
    const season = playSeason(makeCareer('투수', 'pitcher')).history[0];
    const metrics = growthMetrics('pitcher', 'first');
    const era = metrics.find((m) => m.id === 'era')!,
      innings = metrics.find((m) => m.id === 'outs')!;
    expect(era.value({ ...season, pitching: emptyPitch() })).toBeNull();
    expect(era.value({ ...season, pitching: { ...emptyPitch(), outs: 4 } })).toBe(0);
    expect(
      innings.format(innings.value({ ...season, pitching: { ...emptyPitch(), outs: 301 } })!),
    ).toBe('100.1');
    expect(growthMetrics('pitcher', 'second').some((m) => m.id === 'war')).toBe(false);
  });
});
