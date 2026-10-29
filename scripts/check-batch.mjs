#!/usr/bin/env node
// Usage: node scripts/check-batch.mjs <en|ru|de> <easy|medium|hard> <dir>
import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url";
const [lang,tier,dirArg]=process.argv.slice(2);
if(!lang||!tier||!dirArg){console.error("usage: check-batch.mjs <lang> <tier> <dir>");process.exit(2);}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","puzzles");
const dir=path.resolve(dirArg);
const walk=(d,a=[])=>{if(!fs.existsSync(d))return a;for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f,a);else if(e.name.endsWith(".json"))a.push(f);}return a;};
const sig=g=>g.items.map(x=>String(x).trim().toLowerCase()).sort().join("\u0001");
const langOf=f=>{for(const s of path.relative(root,f).split(path.sep)){ if(/(^|[-_])ru([-_\d]|$)/.test(s))return "ru"; if(/(^|[-_])de([-_\d]|$)/.test(s))return "de"; } return "en";};
const sigs=new Set(),labels=new Set(),titles=new Set();
for(const f of walk(root)){ if(path.resolve(f).startsWith(dir+path.sep))continue; if(langOf(f)!==lang)continue; let j;try{j=JSON.parse(fs.readFileSync(f,"utf8"));}catch{continue;}
 for(const p of (Array.isArray(j)?j:[j])){ if(!p||!Array.isArray(p.groups))continue; for(const g of p.groups){ if(Array.isArray(g.items))sigs.add(sig(g)); if(g.label)labels.add(String(g.label).trim().toLowerCase()); } if(p.title)titles.add(String(p.title).trim().toLowerCase()); } }
const errs=[],seenSig=new Set(),seenLab=new Set(),itemCount=new Map();
const files=walk(dir).sort(); if(!files.length)errs.push("no json files in "+dir);
for(const f of files){const b=path.basename(f);let p;try{p=JSON.parse(fs.readFileSync(f,"utf8"));}catch{errs.push(b+": invalid JSON");continue;}
 const E=m=>errs.push(b+": "+m);
 if(!p.id||p.id!==b.replace(/\.json$/,""))E("id must equal filename");
 if(p.difficulty!==tier)E("difficulty must be "+tier);
 if(!p.title)E("title missing"); if(tier!=="easy"&&!p.editorialSummary)E("editorialSummary missing");
 if(!Array.isArray(p.groups)||p.groups.length!==4){E("need exactly 4 groups");continue;}
 const all=[];
 for(const g of p.groups){ if(!g.id||!g.label||(tier!=="easy"&&!g.revealHint))E("group needs id,label"+(tier!=="easy"?",revealHint":""));
  if(!Array.isArray(g.items)||g.items.length!==4){E("group "+g.id+" needs 4 items");continue;}
  g.items.forEach(x=>{if(typeof x!=="string"||!x.trim())E("bad item");all.push(String(x).trim().toLowerCase());});
  const s=sig(g); if(sigs.has(s))E("group already exists in corpus: "+g.items.join("/")); if(seenSig.has(s))E("duplicate group in batch: "+g.items.join("/")); seenSig.add(s);
  const l=String(g.label).trim().toLowerCase(); if(labels.has(l))E("label already used in corpus: "+g.label); if(seenLab.has(l))E("label duplicated in batch: "+g.label); seenLab.add(l);
  if(g.revealHint&&String(g.revealHint).length>24)E("revealHint longer than 24 chars"); }
 if(new Set(all).size!==all.length)E("same item appears twice in one puzzle");
 for(const x of new Set(all))itemCount.set(x,(itemCount.get(x)||0)+1);
 if(p.title&&titles.has(String(p.title).trim().toLowerCase()))E("title already used: "+p.title);
}
for(const [x,c] of itemCount)if(c>3)errs.push("item used in >3 puzzles of this batch: "+x+" ("+c+")");
console.log(files.length+" puzzles checked, "+errs.length+" problems");errs.forEach(e=>console.log(" - "+e));process.exit(errs.length?1:0);
