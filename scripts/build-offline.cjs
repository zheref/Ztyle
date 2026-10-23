const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );
}
const files = walk("public").filter(
  (f) => !f.endsWith(".map") && !f.endsWith(".jpg") && !f.endsWith("sw.js"),
);
const assets = files.map(
  (f) => "/" + path.relative("public", f).split(path.sep).join("/"),
);
assets.push("/");
const hash = crypto.createHash("sha256");
for (const f of files) hash.update(fs.readFileSync(f));
const name = "ztyle-" + hash.digest("hex").slice(0, 12);
fs.writeFileSync(
  "public/sw.js",
  `const CACHE=${JSON.stringify(name)},ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ztyle-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;if(u.pathname==='/artwork.json'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)));return;}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy))}return r}).catch(()=>e.request.mode==='navigate'?caches.match('/'):Response.error()))) });`,
);
console.log("Offline cache prepared:", assets.length, "assets");
