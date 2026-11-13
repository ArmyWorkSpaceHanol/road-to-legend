export const BATTING_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;
export const PITCHING_POSITIONS = ['SP', 'RP', 'LR', 'SU', 'CP'] as const;
export type Position = (typeof BATTING_POSITIONS)[number] | (typeof PITCHING_POSITIONS)[number];
export const POSITION_LABELS: Record<Position, string> = {
  C: '포수',
  '1B': '1루수',
  '2B': '2루수',
  '3B': '3루수',
  SS: '유격수',
  LF: '좌익수',
  CF: '중견수',
  RF: '우익수',
  DH: '지명타자',
  SP: '선발투수',
  RP: '중간계투',
  LR: '롱릴리프',
  SU: '셋업맨',
  CP: '마무리투수',
};
export const POSITIONS = {
  batter: BATTING_POSITIONS.map((id) => [id, POSITION_LABELS[id]] as const),
  pitcher: PITCHING_POSITIONS.map((id) => [id, POSITION_LABELS[id]] as const),
};
export const validPosition = (role: 'batter' | 'pitcher', position: string) =>
  POSITIONS[role].some(([id]) => id === position);
export const reliefPitcher = (position: string) =>
  PITCHING_POSITIONS.some((id) => id === position && id !== 'SP');
export const SCHOOL_NAME_LIMIT = 40;
