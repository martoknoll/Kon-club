// Cloudflare Pages: publica únicamente los archivos necesarios de la web.
// No expone fuentes de Edge Functions, migraciones, planillas ni documentos internos.
import { rmSync, mkdirSync, cpSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = process.cwd();
const dest = join(root, 'dist');
const publicFiles = [
  'index.html',
  'checkout.html',
  'checkout-demo.html',
  'checkout-test.html',
  'admin.html',
  'css/site.css',
  'css/checkout.css',
  'css/admin.css',
  'js/site.js',
  'js/checkout.js',
  'js/checkout-preview.js',
  'js/checkout-test.js',
  'js/admin.js',
  'data/site-config.js',
  'data/checkout-config.js',
  'data/checkout-preview-config.js',
  'data/checkout-test-config.js',
  'data/supabase-public.js',
  'public/media'
];

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const file of publicFiles) {
  const from = join(root, file);
  const to = join(dest, file);
  if (!existsSync(from)) throw new Error('Falta archivo esencial: ' + file);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

const htmls = publicFiles.filter(f => f.endsWith('.html'));
for (const page of htmls) {
  const content = readFileSync(join(dest, page), 'utf8');
  const links = [...content.matchAll(/(?:src|href)=["']([^"'?#]+)(?:[?#][^"']*)?["']/g)]
    .map(m => m[1])
    .filter(uri => !/^(https?:|mailto:|data:|\/\/)/i.test(uri));
  for (const href of links) {
    const relative = href.replace(/^\.\//, '').replace(/^\//, '');
    if (!relative || relative.startsWith('#') || relative.includes('..')) continue;
    if (!existsSync(join(dest, relative))) {
      throw new Error('Falta ' + relative + ' referenciado por ' + page);
    }
  }
}

const cfg = readFileSync(join(dest, 'data/checkout-config.js'), 'utf8');
if (!/allowLive:\s*false/.test(cfg) && process.env.KON_ALLOW_LIVE_BUILD !== 'yes') {
  throw new Error('Las ventas no pueden habilitarse en un build sin autorización expresa.');
}

console.log('Kon Club listo para Cloudflare Pages: ' + publicFiles.length + ' rutas públicas verificadas.');
