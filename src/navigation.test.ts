import { describe, expect, it } from 'vitest';
import { defaultRoute, parseRoute, routeHash } from './navigation';

describe('shareable screen and filter state', () => {
  it('round trips screen, record scope, trend and contract filters', () => {
    const route = {
      ...defaultRoute('records', 'second'),
      recordView: 'growth' as const,
      recordYear: '2038',
      recordLeague: 'MLB' as const,
      growthMetric: 'era',
      leagueTab: 'pitching' as const,
      leaderSort: 'so',
      qualified: true,
      marketTab: 'roster' as const,
    };
    expect(parseRoute(routeHash(route), defaultRoute('home', 'amateur'))).toEqual(route);
  });
  it('falls back safely for unknown screens and malformed values', () => {
    const defaults = defaultRoute('review', 'amateur');
    const route = parseRoute(
      '#/unknown?view=bad&level=bad&year=-1&tab=bad&section=bad&sort=bad',
      defaults,
    );
    expect(route).toEqual(defaults);
  });
  it('clears incompatible league filters instead of showing a missing select option', () => {
    expect(
      parseRoute('#/records?level=amateur&league=KBO', defaultRoute('home', 'first')).recordLeague,
    ).toBe('all');
    expect(
      parseRoute('#/records?level=second&league=HS', defaultRoute('home', 'first')).recordLeague,
    ).toBe('all');
  });
});
