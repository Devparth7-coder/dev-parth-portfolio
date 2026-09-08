import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const result=await build({entryPoints:['src/main.tsx'],bundle:true,write:false,outdir:'portable',format:'iife',minify:true,define:{'process.env.NODE_ENV':'"production"'},external:['/fonts/*']});
let js=result.outputFiles.find(f=>f.path.endsWith('.js')).text;
let css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
for(const folder of ['images','fonts'])for(const name of fs.readdirSync(`public/${folder}`)){const ext=path.extname(name);const mime={'.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'}[ext];if(!mime)continue;const uri=`data:${mime};base64,${fs.readFileSync(`public/${folder}/${name}`).toString('base64')}`;js=js.replaceAll(`/${folder}/${name}`,uri);css=css.replaceAll(`/${folder}/${name}`,uri)}
let html=fs.readFileSync('index.html','utf8').replace(/<link rel="preload"[^>]*>/g,'').replace('<script type="module" src="/src/main.tsx"></script>',()=>`<script>${js.replaceAll('</script','<\\/script')}</script>`).replace('</head>',`<style>${css}</style></head>`);
html=html.replace('href="/favicon.svg"',`href="data:image/svg+xml;base64,${fs.readFileSync('public/favicon.svg').toString('base64')}"`);
fs.writeFileSync('../Dev-Parth-Portfolio.html',html);console.log('Created ../Dev-Parth-Portfolio.html');
