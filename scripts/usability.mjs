import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { makeCareer, nextSeason, parseSave, playSeason } from '../src/game.ts';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
await mkdir('test-results', { recursive: true });
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('road-to-legend:v1')));
const nav = async (page, name) => {
  const menu = page.getByRole('button', { name: '메뉴 열기' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: '주 메뉴', exact: true })
    .getByRole('button', { name, exact: true })
    .click();
};
const open = async (state) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((s) => {
    if (!localStorage.getItem('road-to-legend:v1'))
      localStorage.setItem('road-to-legend:v1', JSON.stringify(s));
  }, state);
  await page.goto(baseURL);
  return page;
};
const importState = async (page, state) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'career.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole('status').filter({ hasText: '저장한 커리어를 불러왔습니다' }).waitFor();
};
try {
  const first = makeCareer('슬롯 타자', 'batter', 'CF', undefined, 7001);
  const second = makeCareer('슬롯 투수', 'pitcher', 'SP', undefined, 8101);
  const page = await open(first);
  await nav(page, '커리어 보관함');
  await page.getByRole('button', { name: '1번 슬롯에 현재 선수 저장', exact: true }).click();
  await nav(page, '선수 육성');
  await page.getByRole('button', { name: /멘탈 코칭/ }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('road-to-legend:slot:1')).plan === 'mental',
  );
  await page.reload();
  assert.equal(await page.locator('h1').textContent(), '선수 육성.');
  await importState(page, second);
  assert.equal(await page.evaluate(() => localStorage.getItem('road-to-legend:active-slot')), null);
  await nav(page, '커리어 보관함');
  await page.getByRole('button', { name: '2번 슬롯에 현재 선수 저장', exact: true }).click();
  await page.getByRole('button', { name: '1번 슬롯 불러오기', exact: true }).click();
  assert.equal((await saved(page)).player.name, '슬롯 타자');
  assert.equal((await saved(page)).plan, 'mental');
  await nav(page, '선수 육성');
  await page.getByRole('button', { name: /장타력 강화/ }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('road-to-legend:slot:1')).plan === 'power',
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('road-to-legend:slot:2')).player.name,
    ),
    '슬롯 투수',
  );
  await nav(page, '커리어 보관함');
  await page.getByRole('button', { name: '1번 자동 백업 복원', exact: true }).click();
  assert.equal((await saved(page)).player.name, '슬롯 투수');

  // A failed automatic backup must leave the current career and its slot intact.
  await nav(page, '선수 육성');
  await page.getByRole('button', { name: /체력 강화/ }).click();
  const beforeFailure = await saved(page);
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'road-to-legend:backups:v1') throw new DOMException('Full', 'QuotaExceededError');
      return window.originalSetItem.call(this, key, value);
    };
  });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('저장 파일 선택').setInputFiles({
    name: 'replacement.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(first)),
  });
  await page.getByRole('status').filter({ hasText: '백업 공간이 부족' }).waitFor();
  assert.deepEqual(await saved(page), beforeFailure);
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalSetItem;
  });
  await page.evaluate(() => {
    Storage.prototype.setItem = function (key, value) {
      if (key === 'road-to-legend:v1') throw new DOMException('Full', 'QuotaExceededError');
      return window.originalSetItem.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: /제구력 연마/ }).click();
  await page.getByRole('alert').waitFor();
  await nav(page, '커리어 보관함');
  assert.equal(
    await page.getByRole('button', { name: '현재 커리어 파일 백업', exact: true }).isEnabled(),
    true,
  );
  await page.setViewportSize({ width: 320, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalSetItem;
  });
  await page.getByRole('button', { name: '저장 다시 시도', exact: true }).click();
  await page.getByRole('alert').waitFor({ state: 'hidden' });
  assert.equal((await saved(page)).plan, 'contact');

  // Starting a new character automatically archives the outgoing one.
  await page.getByRole('button', { name: '새 커리어', exact: true }).click();
  await page.getByLabel('선수 이름').fill('새 출발');
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  for (let i = 1; i <= 3; i++)
    await page.getByRole('button', { name: `${i}번 카드 뒤집기` }).click();
  await page.getByRole('button', { name: /1번 .+ 카드 선택/ }).click();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.locator('.talent-front').evaluateAll((cards) =>
      cards.every((card) => {
        const button = card.querySelector('button');
        return button.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom + 1;
      }),
    ),
    true,
  );
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '선택한 카드로 시작' }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('road-to-legend:v1')).player.name === '새 출발',
  );
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(JSON.parse(localStorage.getItem('road-to-legend:backups:v1'))[0].raw).player
          .name,
    ),
    '슬롯 투수',
  );
  await page.close();

  const history = playSeason(nextSeason(playSeason(first)));
  const records = await open(history);
  await nav(records, '나의 기록실');
  await records.getByLabel('기록 구분', { exact: true }).selectOption('first');
  assert.equal(await records.locator('.stat-card strong').first().textContent(), '—');
  await records.getByText('선택한 범위의 기록이 없습니다', { exact: true }).waitFor();
  await records.getByRole('button', { name: '보유한 기록 보기' }).click();
  assert.equal(await records.getByLabel('기록 구분', { exact: true }).inputValue(), 'amateur');
  await records.getByRole('button', { name: '성장 비교', exact: true }).click();
  await records.getByLabel('성장 추이 지표').selectOption('ops');
  await records.getByLabel('성장 기록 리그').selectOption('HS');
  const recordURL = records.url();
  assert.equal(
    await records.getByRole('region', { name: '최근 시즌 성장 기록' }).locator('tbody tr').count(),
    2,
  );
  assert.equal(await records.getByRole('img', { name: /OPS 성장 추이/ }).count(), 1);
  await nav(records, '리그 순위');
  await records.goBack();
  await records.getByLabel('성장 추이 지표').waitFor();
  assert.equal(records.url(), recordURL);
  await records.goForward();
  await records.getByRole('heading', { level: 1, name: '리그 순위.' }).waitFor();
  await records.goBack();
  await records.getByLabel('성장 추이 지표').waitFor();
  await records.reload();
  assert.equal(await records.getByLabel('성장 추이 지표').inputValue(), 'ops');
  assert.equal(await records.getByLabel('성장 기록 리그').inputValue(), 'HS');
  await nav(records, '리그 순위');
  await records.getByRole('button', { name: '타자 순위', exact: true }).click();
  await records.getByRole('button', { name: 'HR', exact: true }).click();
  await records.getByLabel('규정 타석 충족 선수만').check();
  await records.reload();
  assert.equal(await records.getByLabel('규정 타석 충족 선수만').isChecked(), true);
  assert.equal(await records.locator('th[aria-sort="descending"] button').textContent(), 'HR');
  await records.setViewportSize({ width: 390, height: 844 });
  const menu = records.getByRole('button', { name: '메뉴 열기' });
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  assert.equal(await records.locator('.workspace').evaluate((e) => e.inert), true);
  for (let i = 0; i < 18; i++) {
    await records.keyboard.press('Tab');
    assert.equal(
      await records.evaluate(() =>
        document.querySelector('.sidebar').contains(document.activeElement),
      ),
      true,
    );
  }
  await records.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await records.locator('.sidebar').evaluate((e) => e.inert), true);
  assert.equal(await menu.evaluate((e) => e === document.activeElement), true);
  await nav(records, '커리어 보관함');
  for (const width of [390, 320]) {
    await records.setViewportSize({ width, height: 844 });
    assert.equal(
      await records.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await records.screenshot({ path: `test-results/ux-library-${width}.png`, fullPage: true });
  }
  await records.setViewportSize({ width: 1440, height: 1000 });
  await records.waitForFunction(() => document.querySelector('.sidebar').inert === false, null, {
    timeout: 5000,
  });
  assert.equal(await records.locator('.sidebar').evaluate((e) => e.inert), false);
  assert.deepEqual(parseSave(JSON.stringify(await saved(records))), await saved(records));
  await records.close();
  const cold = await browser.newPage();
  await cold.goto(baseURL);
  await cold.evaluate(
    (s) => localStorage.setItem('road-to-legend:slot:1', JSON.stringify(s)),
    first,
  );
  await cold.reload();
  await cold.getByRole('button', { name: '나의 커리어 시작', exact: true }).click();
  await cold.getByRole('button', { name: '커리어 보관함 열기', exact: true }).click();
  await cold.getByRole('button', { name: '1번 슬롯 불러오기', exact: true }).click();
  assert.equal((await saved(cold)).player.name, '슬롯 타자');
  await cold.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: automatic slot saving and isolation, pre-replacement backups, restoration, quota failure protection, new-character backups, missing record states, growth comparisons, back/forward/reload filters, keyboard menu containment, Escape and focus return, and 320/390px layouts.',
  );
} finally {
  await browser.close();
}
