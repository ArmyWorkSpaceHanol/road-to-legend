import { useState } from 'react';
import { Check, Flag, Medal, Trophy } from 'lucide-react';
import { careerRecords } from './careerRecords';
import type { RecordLeague, RecordLevel } from './careerRecords';
import { LEAGUE_LABELS } from './game';
import type { League, Role, Season } from './game';
import Pagination, { usePagination } from './Pagination';

const LEVEL_LABELS = { amateur: '아마추어', first: '프로 1군', second: '프로 2군' };
const PRO_LEAGUES: League[] = ['KBO', 'NPB', 'MLB'];
const AMATEUR_LEAGUES: League[] = ['HS', 'COLLEGE', 'IND'];

export default function CareerRecords({
  history,
  role,
  level,
}: {
  history: Season[];
  role: Role;
  level: RecordLevel;
}) {
  const [league, setLeague] = useState<RecordLeague>('all');
  const report = careerRecords(history, role, level, league);
  const pager = usePagination(
    report.achievements.length,
    `${level}-${league}-${role}-${history.length}`,
  );
  const latestYear = history.reduce((year, season) => Math.max(year, season.year), 0);
  const scope = `${league === 'all' ? '전체 리그' : LEAGUE_LABELS[league]} · ${LEVEL_LABELS[level]}`;
  return (
    <div className="career-records">
      <section className="panel" aria-label="커리어 마일스톤">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE NEXT MILESTONE</span>
            <h2>전설을 향한 다음 기록</h2>
          </div>
          <select
            aria-label="도전 기록 리그"
            value={league}
            onChange={(event) => setLeague(event.target.value as RecordLeague)}
          >
            <option value="all">전체 리그</option>
            {(level === 'amateur' ? AMATEUR_LEAGUES : PRO_LEAGUES).map((id) => (
              <option key={id} value={id}>
                {LEAGUE_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <p className="record-scope">{scope} · 완료한 시즌의 기록만 반영합니다.</p>
        <div className="milestone-grid">
          {report.milestones.map((metric) => {
            const last = metric.achieved.at(-1);
            return (
              <article
                className="milestone-card"
                key={metric.id}
                aria-label={`통산 ${metric.label} 도전`}
              >
                <div className="milestone-title">
                  <span>통산 {metric.label}</span>
                  <Flag size={16} />
                </div>
                <strong>
                  {metric.format(metric.current)} <small>{metric.unit}</small>
                </strong>
                <progress
                  value={metric.next === null ? 1 : metric.current}
                  max={metric.next ?? 1}
                  aria-label={`통산 ${metric.label} 진행률`}
                />
                <p>
                  {metric.next === null
                    ? '모든 단계 달성! 기록은 계속 쌓입니다.'
                    : `다음 ${metric.format(metric.next)} ${metric.unit}까지 ${metric.format(metric.next - metric.current)} ${metric.unit}`}
                </p>
                <small className="milestone-achieved">
                  {last ? (
                    <>
                      <Check size={13} />
                      {last.season.year} · {metric.format(last.target)} {metric.unit} 달성
                    </>
                  ) : (
                    '첫 달성을 기다리고 있어요'
                  )}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-label="개인 최고 시즌">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PERSONAL BEST</span>
            <h2>나의 최고 시즌</h2>
          </div>
          <Medal size={20} />
        </div>
        <p className="record-scope">
          {scope} · 비율 기록은 규정 타석(팀 경기 × 3.1)·이닝(팀 경기 × 1)을 충족한 시즌만
          비교합니다. 2군은 120경기 기준이며, 동률이면 먼저 달성한 시즌을 표시합니다.
        </p>
        <div className="personal-best-grid">
          {report.bests.map((metric) => (
            <article className="personal-best" key={metric.id} aria-label={`최고 ${metric.label}`}>
              <span>{metric.label}</span>
              <strong>
                {metric.best ? metric.format(metric.best.value) : '—'}{' '}
                <small>{metric.best ? metric.unit : ''}</small>
              </strong>
              {metric.best ? (
                <>
                  <b>
                    {metric.best.season.year} · {LEAGUE_LABELS[metric.best.season.league]}
                  </b>
                  <small>{metric.best.season.team}</small>
                </>
              ) : (
                <small>{metric.qualified ? '규정 출장 시즌 없음' : '출장 기록 없음'}</small>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel" aria-label="마일스톤 달성 이력">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">MOMENTS TO REMEMBER</span>
            <h2>달성한 기록</h2>
          </div>
          <span className="badge neutral">{report.achievements.length}개 달성</span>
        </div>
        {report.achievements.length ? (
          <>
            <ol className="milestone-history">
              {report.achievements
                .slice(pager.start, pager.start + pager.size)
                .map((achievement) => (
                  <li key={achievement.id}>
                    <Trophy size={18} />
                    <div>
                      <b>{achievement.label}</b>
                      <small>
                        {achievement.season.year} · {LEAGUE_LABELS[achievement.season.league]} ·{' '}
                        {achievement.season.team}
                      </small>
                    </div>
                    {achievement.season.year === latestYear && (
                      <span className="badge neutral">최근 시즌</span>
                    )}
                  </li>
                ))}
            </ol>
            <Pagination
              {...pager}
              total={report.achievements.length}
              onChange={pager.setPage}
              label="마일스톤 달성 이력"
            />
          </>
        ) : (
          <div className="milestone-empty">
            <Flag size={24} />
            <p>아직 달성한 기록이 없습니다. 시즌을 진행하며 첫 이정표를 남겨보세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
