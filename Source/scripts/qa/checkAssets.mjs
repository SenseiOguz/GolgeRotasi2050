/* global process, console */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { PNG } from 'pngjs';
const root = resolve(process.env.PIXEL_QA_ROOT ?? resolve(import.meta.dirname, '../..'));
const palette = new Set((readFileSync(resolve(root, 'src/assets/pixel/palette.ts'), 'utf8').match(/#[0-9A-F]{6}/g) ?? []).map(c => parseInt(c.slice(1),16)));
const padding = Number(process.env.PIXEL_PADDING ?? 2);
if (!Number.isInteger(padding) || padding < 0) throw new Error('Invalid PIXEL_PADDING');
const walk = d => existsSync(d) ? readdirSync(d,{withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(resolve(d,e.name)) : [resolve(d,e.name)]) : [];
const rows=[], records=new Map(), keys=new Set(), areas=new Set();
const known = new Set(['src/assets/textureKeys.ts','src/assets/pixelKeys.ts'].flatMap(f => [...readFileSync(resolve(root,f),'utf8').matchAll(/['"]([a-z][a-z0-9-]+)['"]/g)].map(m=>m[1])));
for (const f of walk(resolve(root,'art')).filter(f=>/[\\/]manifest.json$/.test(f))) {
 const errors=[];
 try {
  const area=relative(resolve(root,'art'),f).replaceAll('\\','/').split('/')[0]; areas.add(area);
  const m=JSON.parse(readFileSync(f,'utf8'));
  if (!Array.isArray(m.assets)) throw new Error('assets must be array');
  for (const r of m.assets) {
   const path=String(r.file).replaceAll('\\','/');
   if (!path.startsWith(`src/assets/pixel/${area}/`) || path.split('/').includes('..')) { errors.push('invalid file '+path); continue; }
   if (records.has(path) || keys.has(r.key)) errors.push('duplicate file/key '+path);
   records.set(path,r); keys.add(r.key);
   if (!known.has(r.key)) errors.push('unknown key '+r.key);
   if (!existsSync(resolve(root,path))) errors.push('missing file '+path);
   if (!Number.isInteger(r.frames) || r.frames<1) errors.push('invalid frames '+path);
   if (!r.nativeSize || !Number.isInteger(r.nativeSize.width) || !Number.isInteger(r.nativeSize.height)) errors.push('invalid nativeSize '+path);
   if (!r.anchor || ![r.anchor.x,r.anchor.y].every(n=>typeof n==='number' && n>=0 && n<=1)) errors.push('invalid anchor '+path);
   if (r.frames>1 && !(r.frameWidth>0 && r.frameHeight>0)) errors.push('missing frame size '+path);
  }
 } catch(e) { errors.push(e.message); }
 rows.push({file:relative(root,f),size:'manifest',result:errors.length ? errors.join('; ') : 'OK'});
}
const squares=new Set([8,16,20,24,40,48,56,80]);
const valid=(w,h)=>(w===h && squares.has(w)) || ['24x14','320x80','160x80','40x48','40x56','640x360','640x120','640x160','640x100'].includes(`${w}x${h}`);
// Area discovery above includes art/map/manifest.json without requiring it to exist.
const layoutFile = resolve(root, 'src/assets/pixel/map/map-layout.json');
if (existsSync(layoutFile)) {
 let result = 'OK';
 try { const layout = JSON.parse(readFileSync(layoutFile, 'utf8')); if (!layout || typeof layout !== 'object' || Array.isArray(layout)) throw new Error('map-layout must be a JSON object'); } catch (e) { result = e.message; }
 rows.push({ file: relative(root, layoutFile), size: 'JSON', result });
}
const files=walk(resolve(root,'src/assets/pixel')).filter(f=>f.endsWith('.png'));
for (const f of files) {
 const path=relative(root,f).replaceAll('\\','/'), errors=new Set(); let size='?';
 try {
  const p=PNG.sync.read(readFileSync(f)), r=records.get(path); size=`${p.width}x${p.height}`;
  if (areas.has(path.split('/')[3]) && !r) errors.add('not in area manifest');
  const fw=r?.frameWidth ?? p.width, fh=r?.frameHeight ?? p.height;
  const key = r?.key ?? path.split('/').pop().replace(/\.png$/, '').replaceAll('_', '-');
  const mapNode = path.startsWith('src/assets/pixel/map/') && ['map-node-open','map-node-current','map-node-done','map-node-locked'].includes(key);
  const mapBackground = path.startsWith('src/assets/pixel/map/') && key === 'map-bg';
  if (!(mapNode && fw === 32 && fh === 32) && !valid(fw,fh)) errors.add('invalid native size');
  if (mapNode && (fw !== 32 || fh !== 32)) errors.add('map node must be 32x32');
  if (mapBackground && (fw !== 640 || fh !== 360)) errors.add('map-bg must be 640x360');
  if (!Number.isInteger(fw) || !Number.isInteger(fh) || fw<=0 || fh<=0 || p.width%fw || p.height%fh) throw new Error('invalid sheet dimensions');
  if (r?.nativeSize && (r.nativeSize.width!==fw || r.nativeSize.height!==fh)) errors.add('nativeSize mismatch');
  if (r && r.frames!==p.width/fw*(p.height/fh)) errors.add('frame count mismatch');
  const object=path.includes('/objects/'), padded=object || path.includes('/characters/');
  for(let oy=0;oy<p.height;oy+=fh) for(let ox=0;ox<p.width;ox+=fw) {
   const alpha=(x,y)=>p.data[((y+oy)*p.width+x+ox)*4+3];
   for(let y=0;y<fh;y++) for(let x=0;x<fw;x++) {
    const i=((y+oy)*p.width+x+ox)*4,a=p.data[i+3];
    if(mapBackground && a!==255) errors.add('map-bg must be fully opaque');
    if(a!==0 && a!==255) errors.add('alpha must be 0/255');
    if(a===255 && !palette.has((p.data[i]<<16)|(p.data[i+1]<<8)|p.data[i+2])) errors.add('off-palette opaque pixel');
    if(padded && a!==0 && (x<padding || y<padding || x>=fw-padding || y>=fh-padding)) errors.add(`padding < ${padding}px`);
   }
   if(object) {
    const seen=new Set(),q=[];
    const add=(x,y)=>{const i=y*fw+x;if(x>=0 && y>=0 && x<fw && y<fh && alpha(x,y)===0 && !seen.has(i)){seen.add(i);q.push([x,y]);}};
    for(let x=0;x<fw;x++){add(x,0);add(x,fh-1);} for(let y=0;y<fh;y++){add(0,y);add(fw-1,y);}
    for(let n=0;n<q.length;n++){const [x,y]=q[n];add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1);}
    for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)if(alpha(x,y)===0 && !seen.has(y*fw+x))errors.add('interior transparent hole');
   }
  }
 } catch(e){errors.add(e.message);}
 rows.push({file:path,size,result:errors.size?[...errors].join('; '):'OK'});
}
console.table(rows.length?rows:[{file:'(no pixel PNG assets)',size:'-',result:'OK'}]);
console.log(`${files.length} PNG assets; ${rows.filter(r=>r.result!=='OK').length} failed rows.`);
process.exitCode=rows.some(r=>r.result!=='OK')?1:0;
