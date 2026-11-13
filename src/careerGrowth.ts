import { battingRates, decimal, innings, pitchingRates } from './game';
import type { Role, Season } from './game';
import type { RecordLeague, RecordLevel } from './careerRecords';

export function growthHistory(
  history: Season[],
  role: Role,
  level: RecordLevel,
  league: RecordLeague = 'all',
) {
  return history
    .filter(
      (s) =>
        s.role === role &&
        (level === 'amateur' ? s.stage !== 'pro' : s.stage === 'pro') &&
        (league === 'all' || s.league === league),
    )
    .sort((a, b) => a.year - b.year)
    .map((s) => ({
      ...s,
      batting: level === 'second' ? s.minorBatting : s.batting,
      pitching: level === 'second' ? s.minorPitching : s.pitching,
      war: level === 'second' ? 0 : s.war,
    }));
}
export const growthMetrics = (role: Role, level: RecordLevel) => [
  {
    id: 'overall',
    label: '종합 능력치',
    format: (n: number) => String(n),
    value: (s: Season) => s.overall,
  },
  ...(level === 'second'
    ? []
    : [
        {
          id: 'war',
          label: 'WAR',
          format: (n: number) => n.toFixed(1),
          value: (s: Season) => s.war,
        },
      ]),
  ...(role === 'batter'
    ? [
        {
          id: 'h',
          label: '안타',
          format: (n: number) => String(n),
          value: (s: Season) => s.batting.h,
        },
        {
          id: 'hr',
          label: '홈런',
          format: (n: number) => String(n),
          value: (s: Season) => s.batting.hr,
        },
        {
          id: 'ops',
          label: 'OPS',
          format: decimal,
          value: (s: Season) => (s.batting.pa ? battingRates(s.batting).ops : null),
        },
        {
          id: 'g',
          label: '출장 경기',
          format: (n: number) => String(n),
          value: (s: Season) => s.batting.g,
        },
      ]
    : [
        {
          id: 'so',
          label: '탈삼진',
          format: (n: number) => String(n),
          value: (s: Season) => s.pitching.so,
        },
        {
          id: 'era',
          label: '평균자책점',
          format: (n: number) => n.toFixed(2),
          value: (s: Season) => (s.pitching.outs ? pitchingRates(s.pitching).era : null),
        },
        { id: 'outs', label: '투구 이닝', format: innings, value: (s: Season) => s.pitching.outs },
        {
          id: 'sv',
          label: '세이브',
          format: (n: number) => String(n),
          value: (s: Season) => s.pitching.sv,
        },
      ]),
];
