import { battingRates, decimal, innings, pitchingRates, SEASON_GAMES } from './game';
import type { Batting, League, Pitching, Role, Season } from './game';

export type RecordLevel = 'first' | 'second' | 'amateur';
export type RecordLeague = League | 'all';
type RecordSeason = {
  season: Season;
  batting: Batting;
  pitching: Pitching;
};
type Metric = {
  id: string;
  label: string;
  unit: string;
  value: (row: RecordSeason) => number;
  format: (value: number) => string;
};
type MilestoneMetric = Metric & { targets: number[] };
type BestMetric = Metric & { lower?: boolean; qualified?: boolean };

const count = (value: number) => value.toLocaleString('ko-KR');
const bat = (id: keyof Batting, label: string, targets: number[]): MilestoneMetric => ({
  id,
  label,
  targets,
  unit: label,
  value: (row) => row.batting[id],
  format: count,
});
const pitch = (id: keyof Pitching, label: string, targets: number[]): MilestoneMetric => ({
  id,
  label,
  targets,
  unit: label,
  value: (row) => row.pitching[id],
  format: count,
});

const BATTING_MILESTONES = [
  bat('g', '경기', [1, 100, 500, 1000, 2000, 3000]),
  bat('h', '안타', [1, 100, 500, 1000, 1500, 2000, 3000]),
  bat('hr', '홈런', [1, 10, 50, 100, 200, 300, 500]),
  bat('rbi', '타점', [1, 100, 500, 1000, 1500, 2000]),
  bat('sb', '도루', [1, 10, 50, 100, 200, 300, 500]),
  bat('bb', '볼넷', [1, 100, 500, 1000, 1500, 2000]),
];
const PITCHING_MILESTONES = [
  pitch('g', '등판', [1, 100, 300, 500, 750, 1000]),
  pitch('w', '승', [1, 10, 50, 100, 150, 200, 300]),
  pitch('so', '탈삼진', [1, 100, 500, 1000, 1500, 2000, 3000]),
  {
    ...pitch(
      'outs',
      '이닝',
      [1, 100, 500, 1000, 1500, 2000, 3000].map((n) => n * 3),
    ),
    format: innings,
  },
  pitch('sv', '세이브', [1, 10, 50, 100, 200, 300, 500]),
  pitch('hld', '홀드', [1, 10, 50, 100, 200, 300, 500]),
];
const BATTING_BEST: BestMetric[] = [
  ...BATTING_MILESTONES.filter((metric) => ['h', 'hr', 'rbi', 'sb'].includes(metric.id)),
  {
    id: 'avg',
    label: '타율',
    unit: '',
    qualified: true,
    value: (row) => battingRates(row.batting).avg,
    format: decimal,
  },
  {
    id: 'ops',
    label: 'OPS',
    unit: '',
    qualified: true,
    value: (row) => battingRates(row.batting).ops,
    format: decimal,
  },
];
const PITCHING_BEST: BestMetric[] = [
  ...PITCHING_MILESTONES.filter((metric) => ['w', 'so', 'sv', 'outs'].includes(metric.id)),
  {
    id: 'era',
    label: '평균자책점',
    unit: '',
    qualified: true,
    lower: true,
    value: (row) => pitchingRates(row.pitching).era,
    format: (n) => n.toFixed(2),
  },
  {
    id: 'whip',
    label: 'WHIP',
    unit: '',
    qualified: true,
    lower: true,
    value: (row) => pitchingRates(row.pitching).whip,
    format: (n) => n.toFixed(2),
  },
];

export function careerRecords(
  history: Season[],
  role: Role,
  level: RecordLevel,
  league: RecordLeague = 'all',
) {
  const rows: RecordSeason[] = history
    .filter(
      (season) =>
        season.role === role &&
        (level === 'amateur' ? season.stage !== 'pro' : season.stage === 'pro') &&
        (league === 'all' || season.league === league),
    )
    .sort((a, b) => a.year - b.year)
    .map((season) => ({
      season,
      batting: level === 'second' ? season.minorBatting : season.batting,
      pitching: level === 'second' ? season.minorPitching : season.pitching,
    }));
  const metrics = role === 'batter' ? BATTING_MILESTONES : PITCHING_MILESTONES;
  const milestones = metrics.map((metric) => {
    let current = 0;
    const achieved: { target: number; season: Season }[] = [];
    for (const row of rows) {
      const previous = current;
      current += metric.value(row);
      for (const target of metric.targets) {
        if (previous < target && current >= target) achieved.push({ target, season: row.season });
      }
    }
    return {
      ...metric,
      current,
      next: metric.targets.find((target) => target > current) ?? null,
      achieved,
    };
  });
  const achievements = milestones
    .flatMap((metric) =>
      metric.achieved.map(({ target, season }) => ({
        id: `${metric.id}-${target}`,
        label: `통산 ${metric.format(target)} ${metric.unit}`,
        season,
        target,
      })),
    )
    .sort((a, b) => b.season.year - a.season.year || b.target - a.target);
  const bests = (role === 'batter' ? BATTING_BEST : PITCHING_BEST).map((metric) => {
    let best: { value: number; season: Season } | null = null;
    for (const row of rows) {
      const games = level === 'second' ? 120 : SEASON_GAMES[row.season.league];
      const played = role === 'batter' ? row.batting.pa > 0 : row.pitching.outs > 0;
      const qualified =
        role === 'batter'
          ? row.batting.pa >= Math.ceil(games * 3.1)
          : row.pitching.outs >= games * 3;
      if (!played || (metric.qualified && !qualified)) continue;
      const value = metric.value(row);
      if (!best || (metric.lower ? value < best.value : value > best.value)) {
        best = { value, season: row.season };
      }
    }
    return { ...metric, best };
  });
  return { milestones, achievements, bests };
}
