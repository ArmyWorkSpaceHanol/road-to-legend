import { validateBundle } from '../src/cloudSave';

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type Database = { prepare(sql: string): Statement };
export type Env = { DB: Database };
type Row = { payload: string; revision: number; updated_at: number };
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie' },
  });
async function encode(value: unknown) {
  const compressed = new Response(
    new Blob([JSON.stringify(value)]).stream().pipeThrough(new CompressionStream('gzip')),
  );
  const bytes = new Uint8Array(await compressed.arrayBuffer());
  let binary = '';
  for (let n = 0; n < bytes.length; n += 8192)
    binary += String.fromCharCode(...bytes.subarray(n, n + 8192));
  return 'gz:' + btoa(binary);
}
async function record(row: Row | null) {
  if (!row) return { bundle: null, revision: 0, updatedAt: null };
  const raw = row.payload.startsWith('gz:')
    ? await new Response(
        new Blob([Uint8Array.from(atob(row.payload.slice(3)), (c) => c.charCodeAt(0))])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).text()
    : row.payload;
  return {
    bundle: validateBundle(JSON.parse(raw)),
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}
async function body(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new Error('JSON 형식이 필요합니다.');
  // Read a bounded stream, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('요청이 비어 있습니다.');
  const decoder = new TextDecoder();
  let size = 0,
    text = '';
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 8_000_000) {
      await reader.cancel();
      throw new Error('저장 용량은 8MB까지 지원합니다.');
    }
    text += decoder.decode(part.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}
export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname;
  // These headers are asserted by the managed hosting gateway, never by browser input.
  const userId = request.headers.get('oai-authenticated-user-id');
  if (!userId) return json({ error: '로그인이 필요합니다.' }, 401);
  if (request.method !== 'GET' && request.headers.get('origin') !== url.origin)
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (path === '/api/session' && request.method === 'GET') {
    let name = request.headers.get('oai-authenticated-user-full-name') || '레전드 메이커';
    if (
      request.headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8'
    ) {
      try {
        name = decodeURIComponent(name);
      } catch {
        /* A literal name is also valid. */
      }
    }
    return json({
      user: {
        id: userId,
        name,
        email: request.headers.get('oai-authenticated-user-email') || null,
      },
    });
  }
  if (!env.DB) return json({ error: '클라우드 저장소를 준비 중입니다.' }, 503);
  try {
    if (path === '/api/career' && request.method === 'GET') {
      return json(
        await record(
          await env.DB.prepare(
            'SELECT payload, revision, updated_at FROM career_saves WHERE user_id = ?',
          )
            .bind(userId)
            .first<Row>(),
        ),
      );
    }
    if (path === '/api/career' && request.method === 'PUT') {
      let data;
      try {
        data = await body(request);
        data.bundle = validateBundle(data.bundle);
        if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error();
      } catch {
        return json({ error: '저장 파일 형식 또는 용량을 확인해주세요.' }, 400);
      }
      const now = Date.now();
      const random = crypto.getRandomValues(new Uint32Array(2));
      const nextRevision =
        data.revision === 0 ? (random[0] & 0xffff) * 4294967296 + random[1] + 1 : data.revision + 1;
      const payload = await encode(data.bundle);
      if (payload.length > 1_900_000)
        return json(
          {
            error: '저장 용량을 초과했습니다. 보관함의 커리어를 파일로 내보내 공간을 확보해주세요.',
          },
          413,
        );
      const result =
        data.revision === 0
          ? await env.DB.prepare(
              'INSERT INTO career_saves (user_id, payload, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO NOTHING',
            )
              .bind(userId, payload, nextRevision, now)
              .run()
          : await env.DB.prepare(
              'UPDATE career_saves SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?',
            )
              .bind(payload, now, userId, data.revision)
              .run();
      if (!result.meta.changes)
        return json(
          { error: '다른 기기에서 저장한 기록이 있습니다. 두 기록을 확인해주세요.' },
          409,
        );
      return json({ revision: nextRevision, updatedAt: now });
    }
    if (path === '/api/account' && request.method === 'DELETE') {
      const data = await body(request);
      if (data.confirm !== 'DELETE') return json({ error: '삭제 확인이 필요합니다.' }, 400);
      await env.DB.prepare('DELETE FROM career_saves WHERE user_id = ?').bind(userId).run();
      return json({ deleted: true });
    }
    return json({ error: '요청한 기능을 찾을 수 없습니다.' }, 404);
  } catch {
    return json(
      { error: '서버 저장에 실패했습니다. 기기의 기록은 유지됩니다. 잠시 후 다시 시도해주세요.' },
      503,
    );
  }
}
