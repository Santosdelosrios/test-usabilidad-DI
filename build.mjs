import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const minify = !process.argv.includes('--dev');
const res = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify,
  write: false,
  target: ['es2020'],
  legalComments: 'none',
  loader: { '.bin': 'binary' },
});
let js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const b64 = (p) => readFileSync(p).toString('base64');
const ff = (fam, file, peso, extra = '') => `@font-face { font-family: '${fam}'; font-style: normal; font-display: block; font-weight: ${peso};${extra}
  src: url(data:font/woff2;base64,${b64(file)}) format('woff2'); }`;
const N = 'node_modules/@fontsource';
const NV = 'node_modules/@fontsource-variable';
const fonts = [
  ff('Archivo', `${NV}/archivo/files/archivo-latin-wdth-normal.woff2`, '100 900', ' font-stretch: 62% 125%;'),
  ff('JetBrains Mono', `${N}/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2`, 400),
  ff('JetBrains Mono', `${N}/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2`, 500),
  ff('Space Grotesk', `${NV}/space-grotesk/files/space-grotesk-latin-wght-normal.woff2`, '300 700'),
  ff('Space Mono', `${N}/space-mono/files/space-mono-latin-400-normal.woff2`, 400),
  ff('Space Mono', `${N}/space-mono/files/space-mono-latin-700-normal.woff2`, 700),
  ff('Michroma', `${N}/michroma/files/michroma-latin-400-normal.woff2`, 400),
  ff('Inter', `${NV}/inter/files/inter-latin-wght-normal.woff2`, '100 900'),
  ff('Share Tech Mono', `${N}/share-tech-mono/files/share-tech-mono-latin-400-normal.woff2`, 400),
  ff('Manrope', `${NV}/manrope/files/manrope-latin-wght-normal.woff2`, '200 800'),
  ff('DM Mono', `${N}/dm-mono/files/dm-mono-latin-400-normal.woff2`, 400),
  ff('DM Mono', `${N}/dm-mono/files/dm-mono-latin-500-normal.woff2`, 500),
].join('\n');
const html = readFileSync('template.html', 'utf8')
  .replace('/*FONTS*/', () => fonts)
  .replace('/*SCRIPT*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
console.log('dist/index.html', (html.length / 1024).toFixed(0), 'KB');
