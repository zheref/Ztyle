import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='node:child_process')return {url:new URL('./mock-process.mjs',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
