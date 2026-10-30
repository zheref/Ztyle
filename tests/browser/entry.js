// Test-only webpack entry, prepended only to the explicit coverage build.
import manifest from '../../.nen/browser/build.json';
const nativeFetch = window.fetch.bind(window);
let shared = {version:1,scheduleVersion:2,plan:{'2026-10-29':'itachi-warm-1'},customLooks:[],saved:[]};
let revision = 1, conflict = false, weatherError = false, online = true;
const fixture = {version:1,plan:{'2026-10-22':'kirito-warm'},customLooks:[],saved:['kirito-warm']};
if(!localStorage.getItem('ztyle-coverage-seeded')) {
  localStorage.setItem('ztyle-wardrobe-v1',JSON.stringify(fixture));
  localStorage.setItem('ztyle-coverage-seeded','1');
}
window.fetch = async (input, options={}) => {
  const url = String(input);
  if(url.includes('geocoding-api.open-meteo.com')) return Response.json(weatherError ? {results:[]} : {results:[{latitude:4.7,longitude:-74.1,name:'Test city'}]});
  if(url.includes('api.open-meteo.com/v1/forecast')) return Response.json({daily:{time:['2026-10-29','2026-10-30','2026-10-31'],temperature_2m_max:[12,26,22],weather_code:[3,0,1]}});
  if(url === '/api/state') {
    if(options.method === 'PUT') {
      if(conflict) {conflict=false;return Response.json({error:'Conflict'},{status:409});}
      shared=JSON.parse(options.body);revision++;
    }
    return Response.json({state:shared,revision});
  }
  return nativeFetch(input,options);
};
Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>online});
Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:resolve=>resolve({coords:{latitude:4.7,longitude:-74.1}})}});
function mount() {
  const tools = document.createElement('div');
  tools.setAttribute('aria-label','Browser coverage test controls');
  tools.style.cssText='position:fixed;bottom:0;left:0;z-index:99999;background:white;color:black;padding:4px;display:flex;gap:8px;font:12px sans-serif';
  const add=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=action;tools.append(b);};
  add('Capture browser coverage',()=>{
    let report=document.getElementById('browser-coverage-report');
    if(!report){report=document.createElement('pre');report.id='browser-coverage-report';report.setAttribute('data-testid','browser-coverage-report');report.style.cssText='position:fixed;inset:0;z-index:99998;overflow:auto;background:white;color:black';document.body.append(report);}
    report.textContent=JSON.stringify({manifest, coverage:window.__coverage__ || {}});
  });
  add('Close coverage report',()=>document.getElementById('browser-coverage-report')?.remove());
  add('Toggle test connectivity',()=>{online=!online;window.dispatchEvent(new Event(online?'online':'offline'));});
  add('Fail next weather lookup',()=>{weatherError=!weatherError;});
  add('Conflict next shared write',()=>{conflict=true;});
  document.body.append(tools);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
