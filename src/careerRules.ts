import type { GameState, Season } from './game';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const KBO_RULES = {
  registrationDays: 145,
  firstFA: 8,
  collegeFA: 7,
  repeatFA: 4,
  posting: 7,
  draftRounds: 11,
  teams: 10,
} as const;

export function creditedService(history: Season[], since = 0) {
  const seasons = history.filter((h) => h.stage === 'pro' && h.league === 'KBO' && h.year >= since);
  let full = 0,
    remaining = 0;
  for (const h of seasons) {
    if (h.registrationDays >= KBO_RULES.registrationDays) full++;
    else remaining += h.registrationDays;
  }
  return {
    years: full + Math.floor(remaining / 145),
    days: remaining % 145,
    progress: full + remaining / 145,
  };
}

export function kboEligibility(s: GameState) {
  const service = creditedService(s.history);
  const repeat = s.player.faSignedYear !== undefined;
  const faService = creditedService(s.history, s.player.faSignedYear ?? 0);
  const faRequired = repeat ? 4 : s.player.entry === 'college' ? 7 : 8;
  const available =
    s.player.stage === 'pro' &&
    s.player.league === 'KBO' &&
    !['scheduled', 'serving'].includes(s.player.military?.status ?? 'unserved');
  return {
    service: Math.floor(service.progress * 100) / 100,
    serviceYears: service.years,
    serviceDays: service.days,
    faService: faService.years,
    faDays: faService.days,
    faRequired,
    fa: available && faService.years >= faRequired,
    posting: available && service.years >= 7,
    repeat,
    rating: Math.round(Object.values(s.player.skills).reduce((a, b) => a + b, 0) / 6),
  };
}

export function seasonPerformance(s: GameState) {
  const h = s.history.at(-1);
  if (!h) return 25;
  const b = h.batting,
    p = h.pitching;
  const obp = (b.h + b.bb + b.hbp) / Math.max(1, b.ab + b.bb + b.hbp + b.sf);
  const slg = (b.h + b.doubles + 2 * b.triples + 3 * b.hr) / Math.max(1, b.ab);
  const era = (p.er * 27) / Math.max(1, p.outs);
  const production =
    s.player.role === 'batter'
      ? (obp + slg - 0.65) * 35 + Math.min(b.pa / 40, 12)
      : p.outs
        ? (4.5 - era) * 4 + Math.min(p.outs / 40, 12) + Math.min(p.sv / 3, 8)
        : -10;
  return Math.round(clamp(40 + h.war * 7 + production, 5, 95));
}

export function clubSalaryProposal(s: GameState) {
  const h = s.history.at(-1)!;
  const value = Math.max(
    3000,
    Math.max(0, h.war) * 2400 +
      h.registrationDays * 45 +
      (s.player.role === 'batter'
        ? h.batting.hr * 100 + h.batting.rbi * 25
        : h.pitching.so * 22 + h.pitching.sv * 150),
  );
  const multiplier = s.player.league === 'MLB' ? 20 : s.player.league === 'NPB' ? 3 : 1;
  return Math.round(Math.max(3000, s.player.salary * 0.45 + value * multiplier * 0.55));
}

export function salaryNegotiationReport(s: GameState, requested: number) {
  const offer = s.offers.find((o) => o.id === 'renew');
  const base = s.negotiation?.originalOffer ?? offer?.salary ?? 0;
  const performance = seasonPerformance(s);
  const demand = base ? (requested / base - 1) * 100 : 0;
  const annualRaise = s.player.salary ? (requested / s.player.salary - 1) * 100 : 0;
  const probability = clamp(
    0.45 + (performance - 50) * 0.008 - demand * 0.012 - Math.max(0, annualRaise - 50) * 0.001,
    0.03,
    0.95,
  );
  return { base, performance, demand, annualRaise, probability };
}

export function selectionReport(s: GameState, kind: 'national' | 'sangmu') {
  const pro = s.player.stage === 'pro',
    latest = s.history.at(-1),
    performance = seasonPerformance(s);
  const military = s.player.military?.status ?? 'unserved';
  const injury = s.player.injuryDays;
  const label =
    kind === 'sangmu'
      ? '상무 야구단'
      : s.player.stage === 'highschool'
        ? '청소년 대표팀'
        : s.player.stage === 'college'
          ? '대학 대표팀'
          : '성인 대표팀';
  let reason = '';
  if (s.phase !== 'offseason') reason = '시즌 종료 후 지원할 수 있습니다.';
  else if (latest?.selections?.some((r) => r.kind === kind))
    reason = '이번 시즌 심사를 이미 마쳤습니다.';
  else if (kind === 'sangmu' && (!pro || s.player.league !== 'KBO'))
    reason = 'KBO 소속 프로 선수만 지원할 수 있습니다.';
  else if (kind === 'sangmu' && military !== 'unserved') reason = '미필 선수만 지원할 수 있습니다.';
  else if (kind === 'sangmu' && (s.player.age + 1 < 18 || s.player.age + 1 > 27))
    reason = '다음 시즌 입대 나이 18~27세가 지원 범위입니다.';
  else if (injury >= 30) reason = '장기 부상을 회복한 뒤 지원해주세요.';
  else if (kind === 'national' && s.player.stage === 'independent')
    reason = '현재 대표팀 선발 대상에 포함되지 않습니다.';
  else if (
    kind === 'national' &&
    pro &&
    !(s.player.role === 'batter' ? latest!.batting.pa >= 60 : latest!.pitching.outs >= 60)
  )
    reason = '성인 대표팀 심사에는 이번 시즌 1군 60타석 또는 투수 20이닝이 필요합니다.';
  const rating = Object.values(s.player.skills).reduce((a, b) => a + b, 0) / 6;
  const minor = latest
    ? s.player.role === 'batter'
      ? latest.minorBatting.h
      : latest.minorPitching.outs / 3
    : 0;
  const score =
    kind === 'sangmu'
      ? rating * 0.7 + performance * 0.2 + Math.min(minor / 5, 10)
      : rating * 0.4 + performance * 0.6;
  const probability = clamp(
    1 / (1 + Math.exp(-(score - (kind === 'sangmu' ? 60 : 73)) / 7)),
    0.02,
    0.9,
  );
  return {
    kind,
    label,
    eligible: !reason,
    reason,
    probability: reason ? 0 : probability,
    performance,
    rating: Math.round(rating),
  };
}

export function postingReport(s: GameState) {
  return { probability: clamp(0.3 + seasonPerformance(s) * 0.006, 0.3, 0.9) };
}
