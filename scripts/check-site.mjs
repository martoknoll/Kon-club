// Revisión automática de consistencia para el sitio de Kon Club.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const fileExists = (p) => fs.existsSync(path.join(root, p));
const sandbox = {window: {}};
vm.runInNewContext(read('data/site-config.js'), sandbox);
const config = sandbox.window.KON_CONFIG;
const errors = [];
const check = (pass, msg) => {if (!pass) errors.push(msg)};
const media = (p,desc) => check(typeof p === 'string' && p.startsWith('public/media/') && fileExists(p), `${desc}: imagen no encontrada: ${p}`);

check(!!config.editionDefaults[config.activeEdition], 'La edición activa no existe');
for (const [key, image] of Object.entries(config.assets)) media(image, `assets.${key}`);
for (const [key, entry] of Object.entries(config.editionDefaults)) {
    check(!!config.assets[entry.poster], `editionDefaults.${key}: flyer inexistente`);
    check(!!config.assets[entry.logo], `editionDefaults.${key}: logo inexistente`);
    for (const color of ['bg','on','paper','ink','accent','secondary'])
        check(/^#[a-fA-F0-9]{6}$/.test(entry.palette[color]||''), `editionDefaults.${key}: falta color ${color}`);
}
const forbidden = new Set(['18','20','23','27','32B','35.B']);
check(config.archiveCatalog.length === 15, 'El archivo debe tener 15 fechas del ciclo regular');
for (const [id,title,poster] of config.archiveCatalog) {
    check(!forbidden.has(String(id)), `No publicar carpeta ${id}`);
    check(!!config.assets[poster], `Archivo ${id} sin flyer: ${poster}`);
}
check(Object.keys(config.readerIssues).length === 14, 'La Fanzinoteca debe contener 14 publicaciones');
for (const [id,issue] of Object.entries(config.readerIssues)) {
    check(issue.pages.length === 8, `Fanzine ${id} debe tener 8 páginas`);
    issue.pages.forEach((page,index)=>media(page, `${id} página ${index+1}`));
    media(issue.print, `${id} pliego para imprimir`);
}
const html = read('index.html');
const home = html.match(/<section class="fanzines section shell" id="fanzines"[\s\S]*?<\/section>/)?.[0] || '';
check((home.match(/class="zine-card"/g)||[]).length === 2, 'La home debe mostrar solo las dos fanzines más recientes');
check(!html.includes('drive.google.com'), 'La web no debe enlazar a Drive');
check(fileExists('css/site.css') && fileExists('js/site.js'), 'Faltan CSS o JavaScript');
console.log(`Kon Club: ${config.archiveCatalog.length} funciones públicas, ${Object.keys(config.readerIssues).length} fanzines, ${Object.keys(config.assets).length} recursos gráficos.`);
if (errors.length) { errors.forEach(e=>console.error('ERROR:',e)); process.exit(1); }
console.log('OK — Validación de archivos superada.');
