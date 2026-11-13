import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordLeague, RecordLevel } from './careerRecords';

const PAGES = [
  'home',
  'review',
  'training',
  'records',
  'leaders',
  'awards',
  'market',
  'career',
  'saves',
] as const;
export type Page = (typeof PAGES)[number];
export type Route = {
  page: Page;
  recordView: 'stats' | 'milestones' | 'growth';
  recordYear: string;
  recordLevel: RecordLevel;
  recordLeague: RecordLeague;
  leagueTab: 'standings' | 'batting' | 'pitching';
  leaderSort: string;
  qualified: boolean;
  marketTab: 'contract' | 'selection' | 'roster';
  growthMetric: string;
};
export function defaultRoute(page: Page, recordLevel: RecordLevel): Route {
  return {
    page,
    recordLevel,
    recordView: 'stats',
    recordYear: 'latest',
    recordLeague: 'all',
    leagueTab: 'standings',
    leaderSort: 'war',
    qualified: false,
    marketTab: 'contract',
    growthMetric: 'overall',
  };
}
export function parseRoute(hash: string, defaults: Route): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(query);
  const pick = <T extends string>(key: string, options: readonly T[], fallback: T): T => {
    const value = params.get(key) as T;
    return options.includes(value) ? value : fallback;
  };
  const year = params.get('year') ?? defaults.recordYear;
  const route: Route = {
    page: PAGES.includes(path as Page) ? (path as Page) : defaults.page,
    recordView: pick('view', ['stats', 'milestones', 'growth'], defaults.recordView),
    recordLevel: pick('level', ['first', 'second', 'amateur'], defaults.recordLevel),
    recordLeague: pick(
      'league',
      ['all', 'HS', 'COLLEGE', 'IND', 'KBO', 'NPB', 'MLB'],
      defaults.recordLeague,
    ),
    recordYear: /^(latest|all|20\d{2}|2100)$/.test(year) ? year : defaults.recordYear,
    leagueTab: pick('tab', ['standings', 'batting', 'pitching'], defaults.leagueTab),
    leaderSort: pick(
      'sort',
      ['war', 'avg', 'hr', 'rbi', 'ops', 'sb', 'era', 'w', 'so', 'whip', 'sv'],
      'war',
    ),
    qualified: params.get('qualified') === '1',
    marketTab: pick('section', ['contract', 'selection', 'roster'], 'contract'),
    growthMetric: pick(
      'trend',
      ['overall', 'war', 'h', 'hr', 'ops', 'g', 'so', 'era', 'outs', 'sv'],
      'overall',
    ),
  };
  if (
    route.recordLeague !== 'all' &&
    (route.recordLevel === 'amateur'
      ? !['HS', 'COLLEGE', 'IND'].includes(route.recordLeague)
      : !['KBO', 'NPB', 'MLB'].includes(route.recordLeague))
  )
    route.recordLeague = 'all';
  return route;
}
export function routeHash(route: Route) {
  const query = new URLSearchParams({
    view: route.recordView,
    level: route.recordLevel,
    year: route.recordYear,
    league: route.recordLeague,
    tab: route.leagueTab,
    sort: route.leaderSort,
    qualified: route.qualified ? '1' : '0',
    section: route.marketTab,
    trend: route.growthMetric,
  });
  return `#/${route.page}?${query}`;
}
export function useGameRoute(defaults: Route) {
  const defaultsRef = useRef(defaults);
  const [route, setRoute] = useState(() => parseRoute(window.location.hash, defaults));
  const current = useRef(route);
  useEffect(() => {
    const restore = () => {
      const next = parseRoute(window.location.hash, defaultsRef.current);
      current.current = next;
      setRoute(next);
    };
    if (!window.location.hash) window.history.replaceState(null, '', routeHash(current.current));
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, []);
  const updateRoute = useCallback((patch: Partial<Route>, replace = false) => {
    const next = { ...current.current, ...patch };
    const hash = routeHash(next);
    if (hash === window.location.hash) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    current.current = next;
    setRoute(next);
  }, []);
  return { route, updateRoute };
}
