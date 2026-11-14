import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { makeCareer } from '../src/game.ts';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
let activePage;
await mkdir('test-results', { recursive: true });
try {
  const landing = await browser.newPage();
  activePage = landing;
  landing.on('pageerror', (e) => errors.push(e.message));
  await landing.goto(baseURL);
  await landing.getByRole('heading', { name: /당신의 야구가/ }).waitFor();
  await landing
    .locator('.stadium-model')
    .evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));
  for (const width of [1440, 760, 390, 320]) {
    await landing.setViewportSize({ width, height: 900 });
    assert.equal(
      await landing.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `landing fits ${width}px`,
    );
    await landing.screenshot({ path: `test-results/service-landing-${width}.png`, fullPage: true });
  }
  await landing.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(
    await landing
      .locator('.hero-baseball')
      .evaluate((node) => getComputedStyle(node).animationName),
    'none',
  );
  await landing.getByRole('button', { name: '나의 커리어 시작', exact: true }).click();
  await landing.getByLabel('선수 이름').waitFor();
  await landing.close();

  // Exercise the production UI against the auth/API contract; actual SQL, access,
  // and cross-device concurrency are tested separately against SQLite.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const origin = 'https://rtl-ui.chatgpt.site';
  const user = { id: 'ui-player', name: '테스트 플레이어', email: 'player@example.test' };
  let record = { bundle: null, revision: 0, updatedAt: null },
    offline = false;
  await context.route(`${origin}/**`, async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === '/api/session') return route.fulfill({ json: { user } });
    if (url.pathname === '/api/career') {
      if (request.method() === 'GET') return route.fulfill({ json: record });
      if (offline)
        return route.fulfill({ status: 503, json: { error: '기기의 기록은 유지됩니다.' } });
      const data = request.postDataJSON();
      if (data.revision !== record.revision)
        return route.fulfill({ status: 409, json: { error: '다른 기기의 기록' } });
      record = { bundle: data.bundle, revision: record.revision + 1, updatedAt: Date.now() };
      return route.fulfill({ json: { revision: record.revision, updatedAt: record.updatedAt } });
    }
    if (url.pathname === '/api/account') {
      record = { bundle: null, revision: 0, updatedAt: null };
      return route.fulfill({ json: { deleted: true } });
    }
    const response = await context.request.get(new URL(url.pathname + url.search, baseURL).href);
    return route.fulfill({ response });
  });
  const page = await context.newPage();
  activePage = page;
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin);
  await page.getByRole('button', { name: '나의 커리어 시작', exact: true }).click();
  await page.getByLabel('선수 이름').fill('클라우드 선수');
  await page.getByLabel('출발 고등학교').fill('직접 쓴 고등학교');
  await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
  for (const i of [1, 2, 3]) await page.getByRole('button', { name: `${i}번 카드 뒤집기` }).click();
  await page.getByRole('button', { name: /1번 .+ 카드 선택/ }).click();
  await page.getByRole('button', { name: '선택한 카드로 시작' }).click();
  await page.getByRole('button', { name: '계정 관리 · 클라우드 저장됨' }).waitFor();
  assert.equal(JSON.parse(record.bundle.active).player.highSchool, '직접 쓴 고등학교');
  await page.reload();
  await page.getByRole('button', { name: '계정 관리 · 클라우드 저장됨' }).click();
  await page.getByText('player@example.test', { exact: true }).waitFor();
  const exportFile = page.waitForEvent('download');
  await page.getByRole('button', { name: '계정 기록 전체 내보내기' }).click();
  assert.match((await exportFile).suggestedFilename(), /road-to-legend-account/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);

  const replacement = makeCareer(
    '가져온 선수',
    'pitcher',
    'SU',
    undefined,
    9001,
    undefined,
    '다른 고등학교',
  );
  await page.getByRole('button', { name: '계정 관리 · 클라우드 저장됨' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('계정 저장 파일 선택').setInputFiles({
    name: 'old-guest.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(replacement)),
  });
  await page.getByText('저장 파일을 가져왔습니다.', { exact: true }).waitFor();
  assert.equal(JSON.parse(record.bundle.active).player.position, 'SU');
  await page.getByRole('button', { name: '계정 창 닫기' }).click();

  offline = true;
  await page.getByRole('button', { name: '계정 관리 · 클라우드 저장됨' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('계정 저장 파일 선택').setInputFiles({
    name: 'offline.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(makeCareer('오프라인 선수'))),
  });
  await page.getByRole('dialog').getByText('기기에 저장됨', { exact: true }).waitFor();
  assert.equal(JSON.parse(record.bundle.active).player.name, '가져온 선수');
  offline = false;
  await page.getByRole('button', { name: '클라우드 저장 다시 시도' }).click();
  await page.getByText('클라우드 저장됨', { exact: true }).waitFor();
  assert.equal(JSON.parse(record.bundle.active).player.name, '오프라인 선수');
  record = {
    ...record,
    revision: record.revision + 1,
    updatedAt: Date.now(),
    bundle: { ...record.bundle, active: JSON.stringify(makeCareer('다른 기기 선수')) },
  };
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.getByRole('button', { name: /클라우드 기록 이어하기/ }).waitFor();
  assert.equal(await page.getByText('다른 기기 선수 · 2026년 · CF', { exact: true }).count(), 1);
  await page.getByRole('button', { name: /클라우드 기록 이어하기/ }).click();
  await page.getByText('클라우드 저장됨', { exact: true }).waitFor();
  await page.getByText('계정의 게임 데이터 삭제', { exact: true }).click();
  await page.getByLabel('삭제하려면 DELETE를 입력하세요').fill('DELETE');
  await page.getByRole('button', { name: '게임 데이터 영구 삭제', exact: true }).click();
  await page.getByRole('button', { name: '나의 커리어 시작', exact: true }).waitFor();
  assert.equal(record.bundle, null);
  await context.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: responsive 3D landing, reduced motion, signed-in account UI, cloud save/reload, legacy file import, offline retry, conflict selection, full export, and account-data deletion.',
  );
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.error('Service UI failure:', await activePage.locator('body').innerText());
    console.error('Browser errors:', errors);
    await activePage.screenshot({ path: 'test-results/service-failure.png', fullPage: true });
  }
  throw error;
} finally {
  await browser.close();
}
