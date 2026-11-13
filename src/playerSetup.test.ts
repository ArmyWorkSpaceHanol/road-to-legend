import { describe, expect, it } from 'vitest';
import { BATTING_POSITIONS, PITCHING_POSITIONS } from './playerSetup';
import {
  beginSeason,
  chooseCareerPath,
  leagueTeams,
  makeCareer,
  nextSeason,
  parseSave,
  playSeason,
  resolveSeasonEvent,
  TEAMS,
} from './game';

describe('complete positions and custom high schools', () => {
  it.each([
    ...BATTING_POSITIONS.map((position) => ({ role: 'batter' as const, position })),
    ...PITCHING_POSITIONS.map((position) => ({ role: 'pitcher' as const, position })),
  ])('plays and restores a $role at $position with a custom school', ({ role, position }) => {
    const initial = makeCareer(
      '전 포지션 선수',
      role,
      position,
      undefined,
      7001,
      undefined,
      '  우리동네 야구고등학교  ',
    );
    expect(initial.player.team).toBe('우리동네 야구고등학교');
    expect(initial.player.highSchool).toBe('우리동네 야구고등학교');
    const played = resolveSeasonEvent(beginSeason(initial), 'steady');
    expect(played.history[0].position).toBe(position);
    expect(played.history[0].standings).toHaveLength(TEAMS.HS.length);
    expect(played.history[0].standings.filter((t) => t.team === initial.player.team)).toHaveLength(
      1,
    );
    expect(
      played.history[0].leaders.filter((p) => p.team === initial.player.team && p.mine === false)
        .length,
    ).toBeGreaterThan(0);
    const competitors = played.history[0].leaders.filter((p) => p.position === position && !p.mine);
    expect(competitors.length).toBeGreaterThan(0);
    if (role === 'pitcher' && position !== 'SP') expect(played.history[0].pitching.gs).toBe(0);
    if (role === 'pitcher' && position === 'SP')
      expect(played.history[0].pitching.gs).toBeGreaterThan(0);
    expect(parseSave(JSON.stringify(played))).toEqual(played);
    expect(parseSave(JSON.stringify(nextSeason(played))).player.position).toBe(position);
  });
  it('preserves the school after graduation and in all historical league tables', () => {
    let state = makeCareer(
      '진학 선수',
      'batter',
      'RF',
      undefined,
      31,
      undefined,
      '원하는 고등학교',
    );
    for (let grade = 1; grade <= 3; grade++) {
      state = playSeason(state);
      if (grade < 3) state = nextSeason(state);
    }
    state = nextSeason(chooseCareerPath(state, 'college'));
    const restored = parseSave(JSON.stringify(state));
    expect(restored.player.league).toBe('COLLEGE');
    expect(restored.player.highSchool).toBe('원하는 고등학교');
    expect(
      restored.history.every(
        (s) => s.team === '원하는 고등학교' && s.standings.some((t) => t.team === s.team),
      ),
    ).toBe(true);
  });
  it('keeps school leagues even and supports both suggestions and arbitrary names', () => {
    expect(leagueTeams('HS', TEAMS.HS[3])).toEqual(TEAMS.HS);
    expect(leagueTeams('HS', '직접 입력한 학교')).toHaveLength(8);
    expect(leagueTeams('KBO', TEAMS.KBO[0])).toEqual(TEAMS.KBO);
    expect(TEAMS.HS).not.toContain('직접 입력한 학교');
  });
  it('rejects missing, overlong or control-character school names and mismatched positions', () => {
    for (const name of ['', '   ', '가'.repeat(41), '고교\n학교'])
      expect(() => makeCareer('선수', 'batter', '2B', undefined, 1, undefined, name)).toThrow();
    expect(() => makeCareer('선수', 'pitcher', 'RF')).toThrow('포지션');
    expect(() => makeCareer('선수', 'batter', 'RP')).toThrow('포지션');
    expect(() => makeCareer('선수', 'batter', 'UNKNOWN')).toThrow('포지션');
  });
  it('keeps older saves without the optional school field compatible', () => {
    const old = playSeason(makeCareer('이전 선수'));
    delete old.player.highSchool;
    expect(parseSave(JSON.stringify(old))).toEqual(old);
  });
  it('simulates setup holds, closer saves and longer relief innings instead of starts', () => {
    const totals = Object.fromEntries(
      PITCHING_POSITIONS.map((position) => [position, { g: 0, gs: 0, outs: 0, sv: 0, hld: 0 }]),
    );
    for (const position of PITCHING_POSITIONS) {
      for (let seed = 1; seed <= 6; seed++) {
        const initial = makeCareer('역할 선수', 'pitcher', position, undefined, seed);
        initial.player.skills = Object.fromEntries(
          Object.keys(initial.player.skills).map((k) => [k, 90]),
        ) as typeof initial.player.skills;
        initial.player.potential = 94;
        const p = playSeason(initial).history[0].pitching;
        for (const key of ['g', 'gs', 'outs', 'sv', 'hld'] as const)
          totals[position][key] += p[key];
      }
    }
    expect(totals.SP.gs).toBeGreaterThan(0);
    for (const position of ['RP', 'LR', 'SU', 'CP'] as const) expect(totals[position].gs).toBe(0);
    expect(totals.CP.sv).toBeGreaterThan(0);
    expect(totals.SU.hld).toBeGreaterThan(0);
    expect(totals.LR.outs / totals.LR.g).toBeGreaterThan(totals.RP.outs / totals.RP.g);
  });
});
