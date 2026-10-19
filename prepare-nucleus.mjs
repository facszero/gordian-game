import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/fcanete/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='C:/Users/fcanete/.codex/generated_images/01a13ae0-2f58-7233-9104-cc8403258926/';
for(const [name,file] of [['nucleus-background','exec-0facebfd-6688-4c11-8790-1456ec6f65c2.png'],['nucleus-parts','exec-13519147-b892-4eb4-9666-942e8dd7c0b4.png']]){
const s=sharp(root+file);await s.webp({quality:88}).toFile('dist/assets/'+name+'.webp');}
