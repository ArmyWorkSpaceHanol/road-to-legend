import { describe, expect, it } from 'vitest';
import {
  beginSeason,
  chooseCareerPath,
  needsCareerDecision,
  makeCareer,
  nextSeason,
  parseSave,
  playSeason,
  resolveSeasonEvent,
  seasonCheckpoint,
  seasonEventKind,
  seasonEventDetails,
  TEAMS,
} from './game';
import type { EventKind, GameState, Role } from './game';
import { coachingFeedback } from './SeasonJourney';

function fixture(kind: EventKind, role: Role = 'batter', pro = false) {
  for (let seed = 1; seed < 100; seed++) {
    const s = makeCareer('나의 선택', role, role === 'batter' ? 'CF' : 'SP', undefined, seed);
    if (pro)
      Object.assign(s.player, {
        age: 19,
        startAge: 19,
        stage: 'pro',
        grade: 0,
        league: 'KBO',
        team: TEAMS.KBO[0],
        entry: 'legacy',
        squad: 'second',
        salary: 3000,
      });
    if (seasonEventKind(s) === kind) return beginSeason(s);
  }
  throw new Error('Fixture not found');
}

describe('season decisions and goals', () => {
  it('preserves older unfinished choices even when the event selection rules change', () => {
    const old = makeCareer('이전 선택', 'batter', 'CF', undefined, 1);
    old.seasonEvent = { kind: 'rest', choice: null };
    expect(parseSave(JSON.stringify(old))).toEqual(old);
    expect(parseSave(JSON.stringify(resolveSeasonEvent(old, 'steady')))).toBeDefined();
  });
  it('selects injury recovery and slumps from the actual career context', () => {
    const injured = makeCareer('재활 선수');
    injured.player.injuryDays = 21;
    expect(seasonEventKind(injured)).toBe('comeback');
    const slump = playSeason(makeCareer('슬럼프 선수'));
    slump.phase = 'preseason';
    slump.history[0].batting = {
      ...slump.history[0].batting,
      pa: 100,
      ab: 100,
      h: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
    };
    expect(seasonEventKind(slump)).toBe('slump');
    expect(seasonEventDetails(beginSeason(injured)).title).toContain('부상');
  });
  it.each(['rival', 'slump', 'comeback'] as const)(
    'applies both new %s choices after the first half and keeps saves valid',
    (kind) => {
      for (const role of ['batter', 'pitcher'] as const) {
        const s = fixture('technique', role, true);
        s.seasonEvent = { kind, choice: null };
        const checkpoint = seasonCheckpoint(s);
        const bold = resolveSeasonEvent(s, 'bold'),
          steady = resolveSeasonEvent(s, 'steady');
        for (const result of [bold, steady]) {
          expect(result.history[0].roster.slice(0, 12)).toEqual(checkpoint.roster);
          expect(result.history[0].story?.kind).toBe(kind);
          expect(parseSave(JSON.stringify(result))).toEqual(result);
        }
        expect(bold.player.skills).not.toEqual(steady.player.skills);
        if (kind === 'comeback') expect(steady.history[0].roster[12].available).toBe(0);
      }
    },
  );
  it('persists an unfinished checkpoint without charging training twice', () => {
    const s = makeCareer('전반기 선수');
    s.support = 'coach';
    const started = beginSeason(s);
    expect(s.seasonEvent).toBeUndefined();
    expect(beginSeason(started)).toEqual(started);
    expect(started.history).toHaveLength(0);
    expect(started.player.money).toBe(s.player.money);
    const restored = parseSave(JSON.stringify(started));
    expect(seasonCheckpoint(restored)).toEqual(seasonCheckpoint(started));
    expect(() => playSeason(restored)).toThrow('선택');
    const result = resolveSeasonEvent(restored, 'steady');
    expect(result.player.money).toBe(s.player.money + 150 - 200);
    expect(parseSave(JSON.stringify(result))).toEqual(result);
    expect(result.seasonEvent).toBeUndefined();
    expect(() => resolveSeasonEvent(result, 'bold')).toThrow();
  });
  it.each(['technique', 'chance', 'rest'] as const)(
    'preserves the real first half for both %s choices in professional play',
    (kind) => {
      const s = fixture(kind, 'batter', true);
      const half = seasonCheckpoint(s);
      const bold = resolveSeasonEvent(s, 'bold'),
        steady = resolveSeasonEvent(s, 'steady');
      for (const played of [bold, steady]) {
        expect(played.history[0].roster.slice(0, 12)).toEqual(half.roster);
        expect(parseSave(JSON.stringify(played))).toEqual(played);
        expect(played.history[0].story?.kind).toBe(kind);
        expect(played.history[0].roster).toHaveLength(24);
      }
      if (kind === 'rest') expect(steady.history[0].roster[12].available).toBe(0);
      if (kind === 'technique') {
        expect(bold.player.skills.power).toBeGreaterThan(steady.player.skills.power);
        expect(steady.player.skills.contact).toBeGreaterThan(bold.player.skills.contact);
      }
      if (kind === 'chance')
        expect(bold.history[0].roster[12].trust).toBeGreaterThan(
          steady.history[0].roster[12].trust,
        );
      expect(s.seasonEvent?.choice).toBeNull();
    },
  );
  it.each(['batter', 'pitcher'] as const)(
    'applies amateur choices, evaluates goals, and keeps %s records valid',
    (role) => {
      const s = fixture('rest', role);
      s.seasonGoal = 'performance';
      const half = seasonCheckpoint(s);
      const result = resolveSeasonEvent(s, 'steady');
      const h = result.history[0];
      expect(h.goal?.current).toBe(
        role === 'batter' ? h.batting.h : Math.floor(h.pitching.outs / 3),
      );
      expect(h.goal?.achieved).toBe(h.goal!.current >= h.goal!.target);
      expect(h.batting.g + h.pitching.g).toBeGreaterThanOrEqual(half.batting.g + half.pitching.g);
      expect(result.player.skills.speed).toBeGreaterThan(
        resolveSeasonEvent(s, 'bold').player.skills.speed,
      );
      expect(parseSave(JSON.stringify(result))).toEqual(result);
      expect(parseSave(JSON.stringify(nextSeason(result)))).toEqual(nextSeason(result));
    },
  );
  it.each(['batter', 'pitcher'] as const)(
    'keeps a complete %s career playable with annual decisions',
    (role) => {
      let s = makeCareer('결정의 연속', role, role === 'batter' ? 'SS' : 'SP', undefined, 142);
      for (let year = 0; year < 25; year++) {
        s = resolveSeasonEvent(beginSeason(s), year % 2 ? 'bold' : 'steady');
        expect(parseSave(JSON.stringify(s))).toEqual(s);
        expect(s.history.at(-1)?.story).toBeDefined();
        if (s.phase === 'retired') break;
        if (needsCareerDecision(s))
          s = chooseCareerPath(s, s.player.stage === 'independent' ? 'tryout' : 'draft');
        s = nextSeason(s);
      }
      expect(s.phase).toBe('retired');
      expect(s.history).toHaveLength(25);
    },
  );
  it('uses actual 1st-team registration for the professional opportunity goal', () => {
    const s = fixture('chance', 'batter', true);
    s.seasonGoal = 'opportunity';
    const h = resolveSeasonEvent(s, 'bold').history[0];
    expect(h.goal?.current).toBe(h.registrationDays);
    expect(h.goal?.target).toBe(30);
  });
  it('caps story growth at potential and rejects invalid checkpoints', () => {
    const s = fixture('technique');
    s.player.skills = {
      contact: 90,
      power: 90,
      fielding: 90,
      speed: 90,
      discipline: 90,
      mental: 90,
    };
    s.player.potential = 90;
    expect(Math.max(...Object.values(resolveSeasonEvent(s, 'bold').player.skills))).toBe(90);
    const invalid = JSON.parse(JSON.stringify(s));
    invalid.seasonEvent.choice = 'bold';
    expect(() => parseSave(JSON.stringify(invalid))).toThrow('선택');
    expect(() => resolveSeasonEvent(s, 'invalid' as 'bold')).toThrow();
    s.player.money = 0;
    s.support = 'coach';
    expect(() => beginSeason({ ...s, seasonEvent: undefined })).toThrow('예산');
  });
  it('continues saves without the new optional fields', () => {
    const s = makeCareer('이전 선수');
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    const h = playSeason(s);
    delete h.history[0].goal;
    expect(parseSave(JSON.stringify(h))).toEqual(h);
  });
  it('provides actionable feedback for students and injured professionals', () => {
    const student = resolveSeasonEvent(fixture('technique'), 'steady');
    expect(coachingFeedback(student).detail).toContain('출장 노출');
    const pro: GameState = resolveSeasonEvent(fixture('chance', 'pitcher', true), 'bold');
    pro.player.injuryDays = 21;
    expect(coachingFeedback(pro).plan).toBe('recovery');
  });
});
