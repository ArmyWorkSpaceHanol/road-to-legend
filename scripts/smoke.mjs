import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import {
  chooseCareerPath,
  internationalEligibility,
  makeCareer,
  nextSeason,
  parseSave,
  playSeason,
  TEAMS,
} from '../src/game.ts';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
await page.addInitScript(() => {
  Date.now = () => 7001;
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('road-to-legend:v1')));
const nav = async (name) => {
  const menu = page.getByRole('button', { name: '메뉴 열기' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
};
const screenshot = async (name) => {
  const dismiss = page.getByRole('button', { name: '알림 닫기' });
  if (await dismiss.count()) await dismiss.click();
  await page.screenshot({
    path: `test-results/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
};
const play = async () => {
  const year = (await saved()).year;
  await page.getByRole('button', { name: `${year} 시즌 진행` }).click();
  await page.waitForFunction((y) => {
    const s = JSON.parse(localStorage.getItem('road-to-legend:v1'));
    return s.phase === 'offseason' && s.history.at(-1).year === y;
  }, year);
  return saved();
};
const prepare = async () => {
  const year = (await saved()).year;
  await nav('클럽하우스');
  await page.getByRole('button', { name: `${year + 1} 시즌 준비` }).click();
  await page.waitForFunction(
    (y) => JSON.parse(localStorage.getItem('road-to-legend:v1')).year === y + 1,
    year,
  );
  return saved();
};
const choosePath = async (label) => {
  await nav('진로 · 계약');
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('road-to-legend:v1')).careerChoice !== null,
  );
  return saved();
};
const importCareer = async (state) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'career.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole('status').filter({ hasText: '저장한 커리어를 불러왔습니다' }).waitFor();
  return saved();
};
const seedFor = (state, selected, choice = 'draft') => {
  for (let i = 0; i < 1000; i++) {
    const s = { ...state, seed: (i * 982451653) >>> 0 };
    if ((chooseCareerPath(s, choice).history.at(-1).draft.outcome === 'selected') === selected)
      return s;
  }
  throw new Error('No deterministic draft fixture found');
};
const chooseCard = async (capture) => {
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  const start = page.getByRole('button', { name: '선택한 카드로 시작' });
  assert.equal(await start.isDisabled(), true);
  await page.getByRole('button', { name: '1번 카드 뒤집기' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /1번 .+ 카드 선택/ }).click();
  assert.equal(await start.isDisabled(), true);
  for (let i = 2; i <= 3; i++)
    await page.getByRole('button', { name: `${i}번 카드 뒤집기` }).click();
  const ratings = await page.locator('.talent-overall b').allTextContents();
  const best = ratings.indexOf(String(Math.max(...ratings.map(Number))));
  const card = page.getByRole('article', { name: `${best + 1}번 시작 카드` });
  await card.getByRole('button', { name: /카드 선택/ }).click();
  const skills = await card
    .locator('[data-skill]')
    .evaluateAll((nodes) =>
      Object.fromEntries(nodes.map((n) => [n.dataset.skill, Number(n.textContent)])),
    );
  if (capture) await screenshot('life-starting-cards');
  await start.click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual((await saved()).player.skills, skills);
};
await mkdir('test-results', { recursive: true });
try {
  await page.goto(baseURL);
  await page.getByRole('dialog').waitFor();
  assert.equal(await saved(), null);
  await page.getByLabel('선수 이름').fill('김전설');
  await page.getByLabel('출발 고등학교').selectOption(TEAMS.HS[1]);
  await page.getByLabel('선호 팀', { exact: true }).selectOption(TEAMS.KBO[1]);
  await chooseCard(true);
  assert.equal((await saved()).player.age, 16);
  assert.equal((await saved()).player.grade, 1);
  assert.equal((await saved()).player.team, TEAMS.HS[1]);
  await screenshot('life-high-school');

  await nav('선수 육성');
  await page.getByRole('button', { name: /장타력 강화/ }).click();
  await page.getByRole('button', { name: /개인 코치/ }).click();
  let s = await play();
  assert.equal(s.player.money, 250);
  assert.equal(s.history[0].stage, 'highschool');
  assert.ok(s.history[0].batting.g <= 30);
  await nav('나의 기록실');
  for (const stat of ['BABIP', 'OPS', 'wRC+'])
    assert.ok(await page.getByText(stat, { exact: true }).count());
  await page.getByLabel('기록 구분').selectOption('first');
  assert.equal(await page.locator('.stat-card strong').first().textContent(), '.000');
  await page.getByLabel('기록 구분').selectOption('amateur');
  await page.getByRole('button', { name: '통산 기록', exact: true }).click();
  await screenshot('life-amateur-records');

  await prepare();
  await play();
  await prepare();
  s = await play();
  assert.equal(s.player.grade, 3);
  const highGraduate = structuredClone(s);
  await page.getByRole('button', { name: '진로 선택하기' }).click();
  await page.getByLabel('진학 대학').selectOption(TEAMS.COLLEGE[2]);
  await screenshot('life-high-school-decision');
  await choosePath('대학 진학 확정');
  s = await prepare();
  assert.equal(s.player.stage, 'college');
  assert.equal(s.player.grade, 1);
  assert.equal(s.player.age, 19);
  assert.equal(s.player.team, TEAMS.COLLEGE[2]);
  await play();
  await prepare();
  s = await play();
  const earlyEligible = structuredClone(s);
  assert.equal(s.player.grade, 2);
  await nav('진로 · 계약');
  await screenshot('life-early-draft');
  await importCareer(seedFor(earlyEligible, true));
  s = await choosePath('얼리 드래프트 지원 확정');
  assert.equal(s.history.at(-1).draft.outcome, 'selected');
  await screenshot('life-drafted');
  s = await prepare();
  assert.equal(s.player.stage, 'pro');
  assert.equal(s.player.squad, 'second');
  assert.equal(s.player.age, 21);
  s = await play();
  assert.equal(s.history.at(-1).roster[0].squad, 'second');
  assert.equal(s.history.at(-1).roster.length, 24);
  await nav('진로 · 계약');
  await page.getByRole('button', { name: '24개 평가 구간 전체 보기' }).click();
  assert.equal(await page.locator('.roster-entry').count(), 24);
  await screenshot('life-manager-decisions');
  await nav('나의 기록실');
  await page.getByLabel('기록 구분').selectOption('second');
  assert.ok(s.history.at(-1).minorBatting.g > 0);
  await screenshot('life-minor-league-records');
  await page.reload();
  assert.equal((await saved()).player.stage, 'pro');
  assert.equal((await saved()).history.length, 6);

  await nav('커리어 히스토리');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '백업 다운로드' }).click();
  const backup = await readFile(await (await downloadEvent).path(), 'utf8');
  assert.equal(parseSave(backup).history.length, 6);
  const primaryCareer = JSON.parse(backup);

  await importCareer(seedFor(highGraduate, false));
  s = await choosePath('드래프트 지원 확정');
  assert.equal(s.history.at(-1).draft.outcome, 'undrafted');
  await screenshot('life-undrafted-high-school');
  s = await prepare();
  assert.equal(s.player.stage, 'college');
  assert.equal(s.player.grade, 1);
  await importCareer(seedFor(earlyEligible, false));
  await choosePath('얼리 드래프트 지원 확정');
  s = await prepare();
  assert.equal(s.player.stage, 'college');
  assert.equal(s.player.grade, 3);
  await importCareer(earlyEligible);
  await choosePath('대학 잔류 확정');
  s = await prepare();
  s = playSeason(s);
  s = nextSeason(s);
  s = playSeason(s);
  await importCareer(seedFor(s, false));
  await choosePath('졸업 드래프트 지원 확정');
  s = await prepare();
  assert.equal(s.player.stage, 'independent');
  s = await play();
  await importCareer(seedFor(s, true, 'tryout'));
  await choosePath('테스트 입단 지원');
  s = await prepare();
  assert.equal(s.player.stage, 'pro');
  assert.equal(s.player.squad, 'second');

  // A previous-version adult career must continue as an adult, preserving its records.
  const legacy = makeCareer('기존 프로 선수', 'batter', 'CF', undefined, 31);
  Object.assign(legacy.player, {
    age: 19,
    league: 'KBO',
    team: TEAMS.KBO[0],
    skills: Object.fromEntries(Object.keys(legacy.player.skills).map((k) => [k, 90])),
    salary: 5000,
    money: 8000,
  });
  legacy.version = 1;
  let veteran = await importCareer(legacy);
  assert.equal(veteran.version, 2);
  assert.equal(veteran.player.age, 19);
  assert.equal(veteran.player.stage, 'pro');
  do {
    veteran = playSeason(veteran);
    if (!internationalEligibility(veteran).mlb) veteran = nextSeason(veteran);
  } while (!internationalEligibility(veteran).mlb && veteran.player.age < 35);
  assert.equal(internationalEligibility(veteran).mlb, true);
  await importCareer(veteran);
  await nav('진로 · 계약');
  await page.getByRole('button', { name: /MLB.*MLB 포스팅/ }).click();
  s = await prepare();
  assert.equal(s.player.league, 'MLB');
  assert.equal(s.player.squad, 'second');
  s = await play();
  assert.equal(s.history.at(-1).standings.length, 30);

  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('강에이스');
  await page.getByLabel('선수 유형').selectOption('pitcher');
  await chooseCard();
  s = await play();
  assert.ok(s.history[0].pitching.outs > 0);
  await nav('나의 기록실');
  for (const stat of ['ERA', 'WHIP', 'FIP', 'K/9'])
    assert.ok(await page.getByText(stat, { exact: true }).count());
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":2}'),
  });
  await page.getByRole('status').filter({ hasText: '올바른 저장 파일' }).waitFor();
  assert.equal((await saved()).player.name, '강에이스');

  await importCareer(primaryCareer);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, image] of [
    ['클럽하우스', 'home'],
    ['선수 육성', 'training'],
    ['나의 기록실', 'records'],
    ['리그 순위', 'league'],
    ['시상식', 'awards'],
    ['진로 · 계약', 'career-path'],
    ['커리어 히스토리', 'history'],
  ]) {
    await nav(label);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Mobile overflow: ${label}`,
    );
    await screenshot(`life-mobile-${image}`);
  }
  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('모바일 신입생');
  await chooseCard();
  assert.equal((await saved()).player.age, 16);
  await screenshot('life-mobile-new-student');

  const cold = await browser.newContext(),
    coldPage = await cold.newPage();
  coldPage.on('pageerror', (e) => errors.push(e.message));
  await coldPage.goto(baseURL);
  await coldPage.getByRole('button', { name: '저장한 커리어 불러오기' }).waitFor();
  coldPage.once('dialog', (dialog) => dialog.accept());
  await coldPage.getByLabel('저장 파일 선택').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await coldPage.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(
    await coldPage.evaluate(
      () => JSON.parse(localStorage.getItem('road-to-legend:v1')).history.length,
    ),
    6,
  );
  await cold.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: high-school start, talent cards, school years, college choice, draft success/failure, early entry and return, independent retry, roster decisions, separate stats, old-save migration, posting, backup/restore, and mobile play.',
  );
} finally {
  await browser.close();
}
