import { build } from 'rolldown';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifest = JSON.parse(await readFile('.openai/hosting.json', 'utf8'));
if (!manifest.project_id)
  throw new Error('서비스의 .openai/hosting.json에 project_id가 필요합니다.');
const assets = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'server' && entry.name !== '.openai') await collect(file);
    } else
      assets['/' + path.relative('dist', file).split(path.sep).join('/')] = (
        await readFile(file)
      ).toString('base64');
  }
}
await collect('dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};
const source = `import { handleApi } from './server/api.ts';
const assets=${JSON.stringify(assets)};
const types=${JSON.stringify(types)};
export default { async fetch(request, env) {
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/')) return handleApi(request,env);
 if(!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405});
 const key=url.pathname==='/'?'/index.html':url.pathname;
 const content=assets[key];
 if(!content) return new Response('Not found',{status:404});
 const extension=key.slice(key.lastIndexOf('.'));
 const headers={'Content-Type':types[extension]||'application/octet-stream','Cache-Control':key==='/index.html'?'no-cache':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'"};
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(content),c=>c.charCodeAt(0)),{headers});
}};`;
await mkdir('dist/server', { recursive: true });
await build({
  input: 'virtual:service',
  plugins: [
    {
      name: 'service-entry',
      resolveId(id) {
        if (id === 'virtual:service') return path.resolve('.service-entry.ts');
      },
      load(id) {
        if (id.endsWith('/.service-entry.ts')) return source;
      },
    },
  ],
  output: { file: 'dist/server/index.js', format: 'esm', minify: true },
});
await mkdir('dist/.openai', { recursive: true });
await writeFile('dist/.openai/hosting.json', JSON.stringify(manifest, null, 2));
await cp('drizzle', 'dist/drizzle', { recursive: true });
// Keep binding and migration metadata alongside the Worker for Sites hosting.
await writeFile(
  'dist/server/wrangler.json',
  JSON.stringify(
    {
      name: 'road-to-legend',
      main: 'index.js',
      compatibility_date: '2026-11-01',
      d1_databases: [
        { binding: 'DB', database_name: 'road-to-legend', migrations_dir: '../drizzle' },
      ],
    },
    null,
    2,
  ),
);
console.log(`Service Worker built with ${Object.keys(assets).length} embedded assets.`);
