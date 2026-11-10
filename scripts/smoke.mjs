import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
await page.addInitScript(() => {
  Date.now = () => 7001;
});
page.on('pageerror', (e) => errors.push(e.message));
const nav = (name) => page.getByRole('navigation').getByRole('button', { name, exact: true });
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('road-to-legend:v1')));
const screenshot = async (name) => {
  const dismiss = page.getByRole('button', { name: '알림 닫기' });
  if (await dismiss.count()) await dismiss.click();
  return page.screenshot({
    path: `test-results/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
};
const finish = async (year) => {
  await page.getByRole('button', { name: `${year} 시즌 진행` }).click();
  await page.getByRole('button', { name: `${year + 1} 시즌 준비` }).waitFor();
};
const chooseStartingCard = async (capture = false) => {
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  const start = page.getByRole('button', { name: '선택한 카드로 시작' });
  assert.equal(await start.isDisabled(), true);
  assert.equal(await page.locator('.talent-skills').count(), 0);
  if (capture) await screenshot('desktop-cards-hidden');
  await page.getByRole('button', { name: '1번 카드 뒤집기' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /1번 .+ 카드 선택/ }).click();
  assert.equal(await start.isDisabled(), true, 'Starting with two hidden cards must be blocked');
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
  const concept = await card.getByRole('heading').textContent();
  const roll = await page.locator('.talent-skills').allTextContents();
  await page.getByRole('button', { name: '기본 설정', exact: true }).click();
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  assert.deepEqual(
    await page.locator('.talent-skills').allTextContents(),
    roll,
    'Returning from basic settings must keep the deal',
  );
  if (capture) await screenshot('desktop-cards-revealed');
  await start.click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual((await saved()).player.skills, skills);
  assert.deepEqual((await saved()).player.origin.skills, skills);
  assert.equal(await page.getByText(concept, { exact: true }).count(), 1);
};
await mkdir('test-results', { recursive: true });
try {
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /ROAD TO LEGEND/);
  await page.getByRole('dialog').waitFor();
  assert.equal(await saved(), null, 'Do not auto-create a default player before card selection');
  await screenshot('desktop-creation-basics');
  await page.getByLabel('선수 이름').fill('김전설');
  await page.getByLabel('선호 팀', { exact: true }).selectOption('부산 마리너스');
  await chooseStartingCard(true);
  assert.equal((await saved()).player.name, '김전설');
  assert.equal((await saved()).player.team, '부산 마리너스');
  await screenshot('desktop-start');
  await page.getByRole('button', { name: '플레이 가이드' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');

  const beforeCancel = await saved();
  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('취소할 선수');
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  await page.getByRole('button', { name: '1번 카드 뒤집기' }).click();
  await page.keyboard.press('Escape');
  assert.deepEqual(
    await saved(),
    beforeCancel,
    'Cancelling a deal must preserve the current career',
  );

  await nav('선수 육성').click();
  await page.getByRole('button', { name: /장타력 강화/ }).click();
  await page.getByRole('button', { name: /개인 코치/ }).click();
  assert.equal((await saved()).plan, 'power');
  await finish(2026);
  let s = await saved();
  assert.equal(s.history.length, 1);
  assert.equal(s.player.money, 10500);
  assert.ok(s.history[0].batting.pa > 300);
  await screenshot('desktop-season');

  await nav('나의 기록실').click();
  await page.getByRole('heading', { name: '2026 상세 기록' }).waitFor();
  for (const metric of ['BABIP', 'OBP', 'ISO', 'wRC+'])
    assert.ok(await page.getByText(metric, { exact: true }).count());
  await page.getByRole('button', { name: '통산 기록', exact: true }).click();
  await page.getByRole('heading', { name: '통산 상세 기록' }).waitFor();
  await screenshot('desktop-records');

  await nav('리그 순위').click();
  await page.getByRole('button', { name: '타자 순위', exact: true }).click();
  await page.getByRole('button', { name: 'HR', exact: true }).click();
  assert.ok(await page.getByRole('cell', { name: '김전설 MY' }).count());
  await page.getByLabel('규정 타석 충족 선수만').check();
  await nav('시상식').click();
  await page.getByRole('heading', { name: '한 해의 가장 빛나는 이름들' }).waitFor();
  assert.ok(await page.getByText('시즌 MVP', { exact: true }).count());

  for (let year = 2027; year <= 2032; year++) {
    await nav('클럽하우스').click();
    await page.getByRole('button', { name: `${year} 시즌 준비` }).click();
    await page.getByRole('button', { name: `${year} 시즌 진행` }).waitFor();
    await finish(year);
  }
  s = await saved();
  assert.equal(s.history.length, 7);
  assert.ok(s.offers.some((o) => o.id === 'mlb'));
  await nav('계약 · 해외 진출').click();
  await page.getByRole('button', { name: /MLB.*MLB 포스팅/ }).click();
  await page.getByRole('button', { name: '다음 시즌 준비', exact: true }).click();
  await page.getByRole('button', { name: '2033 시즌 진행' }).waitFor();
  assert.equal((await saved()).player.league, 'MLB');
  await finish(2033);
  s = await saved();
  assert.equal(s.history.at(-1).league, 'MLB');
  assert.equal(s.history.at(-1).standings.length, 30);

  await page.reload();
  assert.equal((await saved()).history.length, 8);
  assert.equal((await saved()).player.name, '김전설');
  await nav('커리어 히스토리').click();
  await page.getByRole('heading', { name: '나의 야구 연대기' }).waitFor();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '백업 다운로드' }).click();
  const download = await downloadEvent;
  const path = await download.path();
  const backup = await readFile(path, 'utf8');
  assert.equal(JSON.parse(backup).history.length, 8);

  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('강에이스');
  await page.getByLabel('선수 유형').selectOption('pitcher');
  await page.getByLabel('포지션', { exact: true }).selectOption('SP');
  await chooseStartingCard();
  await finish(2026);
  await nav('나의 기록실').click();
  for (const metric of ['ERA', 'WHIP', 'FIP', 'K/9'])
    assert.ok(await page.getByText(metric, { exact: true }).count());
  assert.ok((await saved()).history[0].pitching.outs > 0);

  // Invalid imports leave the active career intact.
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1}'),
  });
  await page.getByRole('status').filter({ hasText: '올바른 저장 파일' }).waitFor();
  assert.equal((await saved()).player.name, '강에이스');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('status').filter({ hasText: '저장한 커리어를 불러왔습니다' }).waitFor();
  assert.equal((await saved()).player.name, '김전설');
  assert.equal((await saved()).history.length, 8);

  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot('mobile-clubhouse');
  for (const [label, shot] of [
    ['선수 육성', 'mobile-training'],
    ['나의 기록실', 'mobile-records'],
    ['리그 순위', 'mobile-league'],
    ['시상식', 'mobile-awards'],
    ['계약 · 해외 진출', 'mobile-market'],
    ['커리어 히스토리', 'mobile-career'],
  ]) {
    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await nav(label).click();
    const overflowing = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    assert.equal(overflowing, false, `Page overflow: ${label}`);
    await screenshot(shot);
  }
  const mobileBefore = await saved();
  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('모바일 신인');
  await chooseStartingCard();
  assert.equal((await saved()).player.name, '모바일 신인');
  await screenshot('mobile-created-player');
  assert.ok(mobileBefore.history.length > 0);
  const restoreContext = await browser.newContext();
  const restorePage = await restoreContext.newPage();
  restorePage.on('pageerror', (e) => errors.push(e.message));
  await restorePage.goto(baseURL);
  await restorePage.getByRole('button', { name: '저장한 커리어 불러오기' }).waitFor();
  restorePage.once('dialog', (dialog) => dialog.accept());
  await restorePage.getByLabel('저장 파일 선택').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await restorePage.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(
    await restorePage.evaluate(
      () => JSON.parse(localStorage.getItem('road-to-legend:v1')).player.name,
    ),
    '김전설',
  );
  await restoreContext.close();
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(
    'PASS: first-visit creation, card reveals and selection, exact starting skills, cancellation, training, stats, 8 seasons, MLB posting, pitching, save/restore, and mobile creation/pages.',
  );
} finally {
  await browser.close();
}
