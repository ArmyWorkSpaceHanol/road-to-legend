import { growthHistory, growthMetrics } from './careerGrowth';
import { LEAGUE_LABELS, PITCH_SKILL_LABELS, SKILL_LABELS } from './game';
import type { Role, Season, Skills } from './game';
import type { RecordLeague, RecordLevel } from './careerRecords';

export default function CareerGrowth({
  history,
  role,
  level,
  league,
  metricId,
  onMetricChange,
  onLeagueChange,
}: {
  history: Season[];
  role: Role;
  level: RecordLevel;
  league: RecordLeague;
  metricId: string;
  onMetricChange: (id: string) => void;
  onLeagueChange: (league: RecordLeague) => void;
}) {
  const rows = growthHistory(history, role, level, league).slice(-5);
  const metrics = growthMetrics(role, level);
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const latest = rows.at(-1),
    previous = rows.at(-2);
  const values = rows.map((s) => metric.value(s));
  const numbers = values.filter((n): n is number => n !== null);
  const minimum = Math.min(...numbers, 0),
    maximum = Math.max(...numbers, 1);
  const x = (i: number) => (rows.length === 1 ? 300 : 60 + (i * 480) / (rows.length - 1));
  const y = (value: number) => 190 - ((value - minimum) / (maximum - minimum)) * 150;
  const labels = role === 'batter' ? SKILL_LABELS : PITCH_SKILL_LABELS;
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SEE YOUR PROGRESS</span>
            <h2>최근 다섯 시즌, 성장의 궤적</h2>
          </div>
          <div className="growth-filters">
            <select
              aria-label="성장 기록 리그"
              value={league}
              onChange={(e) => onLeagueChange(e.target.value as RecordLeague)}
            >
              <option value="all">전체 리그</option>
              {(level === 'amateur'
                ? (['HS', 'COLLEGE', 'IND'] as const)
                : (['KBO', 'NPB', 'MLB'] as const)
              ).map((id) => (
                <option value={id} key={id}>
                  {LEAGUE_LABELS[id]}
                </option>
              ))}
            </select>
            <select
              aria-label="성장 추이 지표"
              value={metric.id}
              onChange={(e) => onMetricChange(e.target.value)}
            >
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="record-scope">
          선택한 기록 구분과 리그에서 완료한 최근 시즌을 비교합니다. 비율 기록은 출장량과 리그
          환경을 함께 확인하세요. 능력치는 해당 시즌 종료 시점입니다.
        </p>
        {latest ? (
          <>
            <div
              className="growth-chart table-scroll"
              tabIndex={0}
              role="region"
              aria-label="좌우로 이동할 수 있는 성장 그래프"
            >
              <svg
                viewBox="0 0 600 245"
                role="img"
                aria-label={`${metric.label} 성장 추이: ${rows.map((s, i) => `${s.year}년 ${values[i] === null ? '기록 없음' : metric.format(values[i]!)}`).join(', ')}`}
              >
                <line x1="45" x2="565" y1="195" y2="195" stroke="currentColor" opacity=".25" />
                {values.map(
                  (value, i) =>
                    value !== null && (
                      <g key={rows[i].year}>
                        {i > 0 && values[i - 1] !== null && (
                          <line
                            x1={x(i - 1)}
                            y1={y(values[i - 1]!)}
                            x2={x(i)}
                            y2={y(value)}
                            stroke="#264f39"
                            strokeWidth="3"
                          />
                        )}
                        <circle cx={x(i)} cy={y(value)} r="5" fill="#264f39" />
                        <text x={x(i)} y={y(value) - 14} textAnchor="middle">
                          {metric.format(value)}
                        </text>
                      </g>
                    ),
                )}
                {rows.map((s, i) => (
                  <text x={x(i)} y="225" textAnchor="middle" key={s.year}>
                    {s.year}
                  </text>
                ))}
              </svg>
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="최근 시즌 성장 기록"
            >
              <table>
                <thead>
                  <tr>
                    <th>시즌</th>
                    <th>리그</th>
                    {metrics.map((m) => (
                      <th key={m.id}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.year}>
                      <th scope="row">{s.year}</th>
                      <td>{LEAGUE_LABELS[s.league]}</td>
                      {metrics.map((m) => (
                        <td key={m.id}>{m.value(s) === null ? '—' : m.format(m.value(s)!)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="milestone-empty">
            선택한 범위에 완료한 시즌이 없습니다. 다른 기록 구분을 선택하거나 첫 시즌을
            진행해보세요.
          </div>
        )}
      </section>
      {latest && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ONE SEASON AT A TIME</span>
              <h2>
                {previous ? `${previous.year} → ${latest.year} 시즌 변화` : '첫 시즌의 출발점'}
              </h2>
            </div>
          </div>
          {previous ? (
            <>
              <div className="growth-comparison">
                {metrics.map((m) => {
                  const a = m.value(previous),
                    b = m.value(latest);
                  const delta = a === null || b === null ? null : b - a;
                  return (
                    <article key={m.id}>
                      <span>{m.label}</span>
                      <strong>
                        {delta === null
                          ? '—'
                          : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${m.format(Math.abs(delta))}`}
                      </strong>
                      <small>
                        {a === null ? '—' : m.format(a)} → {b === null ? '—' : m.format(b)}
                      </small>
                    </article>
                  );
                })}
              </div>
              <div className="growth-skills">
                {(Object.keys(labels) as (keyof Skills)[]).map((key) => {
                  const delta = latest.skills[key] - previous.skills[key];
                  return (
                    <div key={key}>
                      <span>{labels[key]}</span>
                      <b>
                        {previous.skills[key]} → {latest.skills[key]}
                      </b>
                      <span>
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="record-scope">
                직전 해당 범위 시즌과 비교한 수치입니다. {latest.year}년 부상으로 놓친 경기 기회{' '}
                {latest.injuryGames}경기
                {latest.stage === 'pro' ? ` · 1군 등록 ${latest.registrationDays}일` : ''}.
                {latest.story ? ` 주요 선택: ${latest.story.title} → ${latest.story.label}.` : ''}
              </p>
            </>
          ) : (
            <p className="record-scope">
              비교할 이전 시즌이 없습니다. 다음 시즌부터 능력치와 성적의 변화를 함께 볼 수 있습니다.
            </p>
          )}
        </section>
      )}
    </>
  );
}
