import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { parseSave } from '../src/game.ts';

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => {
  Date.now = () => 7001;
});
const expected = {
  batter: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
  pitcher: ['SP', 'RP', 'LR', 'SU', 'CP'],
};
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('road-to-legend:v1')));
await mkdir('test-results', { recursive: true });
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:5173');
  let first = true;
  for (const [role, positions] of Object.entries(expected)) {
    for (const position of positions) {
      if (!first) await page.getByRole('button', { name: '새 커리어', exact: true }).click();
      await page.getByLabel('선수 이름').fill(`${position} 검증 선수`);
      await page.getByLabel('선수 유형', { exact: true }).selectOption(role);
      assert.deepEqual(
        await page
          .getByLabel('포지션', { exact: true })
          .locator('option')
          .evaluateAll((options) => options.map((o) => o.value)),
        positions,
      );
      await page.getByLabel('포지션', { exact: true }).selectOption(position);
      if (first) {
        await page.getByLabel('출발 고등학교').fill('   ');
        await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
        assert.equal(await page.locator('.career-basics').count(), 1);
        assert.equal(
          await page.getByLabel('출발 고등학교').evaluate((e) => e.validity.valid),
          false,
        );
      }
      const school = position === 'RF' ? '국제야구'.repeat(10) : `내가 입력한 ${position} 고등학교`;
      await page.getByLabel('출발 고등학교').fill(school.length === 40 ? school : `  ${school}  `);
      assert.equal(await page.getByLabel('출발 고등학교').getAttribute('maxlength'), '40');
      await page.getByRole('button', { name: '시작 카드 확인하기' }).click();
      for (let i = 1; i <= 3; i++)
        await page.getByRole('button', { name: `${i}번 카드 뒤집기` }).click();
      await page.getByRole('button', { name: /1번 .+ 카드 선택/ }).click();
      await page.getByRole('button', { name: '선택한 카드로 시작' }).click();
      await page.waitForFunction(
        (p) => JSON.parse(localStorage.getItem('road-to-legend:v1')).player.position === p,
        position,
      );
      const initial = await saved();
      assert.equal(initial.player.team, school);
      assert.equal(initial.player.highSchool, school);
      assert.equal(initial.player.role, role);
      await page.reload();
      assert.equal((await saved()).player.position, position);
      assert.equal((await saved()).player.team, school);
      assert.deepEqual(parseSave(JSON.stringify(await saved())), await saved());
      await page.setViewportSize({ width: 320, height: 844 });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `${position}: mobile overflow`,
      );
      if (position === '3B' || position === 'RP') {
        await page.getByRole('button', { name: /2026 시즌 진행/ }).click();
        await page.locator('.event-option').last().click();
        await page.waitForFunction(
          () => JSON.parse(localStorage.getItem('road-to-legend:v1')).phase === 'offseason',
        );
        const played = await saved();
        assert.equal(played.history[0].team, school);
        assert.ok(played.history[0].standings.some((t) => t.team === school));
        assert.ok(played.history[0].leaders.some((p) => p.team === school && !p.mine));
        if (role === 'pitcher') assert.equal(played.history[0].pitching.gs, 0);
        await page.screenshot({
          path: `test-results/creation-${position}-custom-school.png`,
          fullPage: true,
        });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      first = false;
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: all 9 fielding/batting positions and all 5 pitching roles created through the UI, custom schools, whitespace validation, 40-character names, save/reload, custom-school standings and leaderboards, relief appearances, and 320px layout.',
  );
} finally {
  await browser.close();
}
