import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

function config(selfHost: boolean) {
  const module = { exports: {} as any };
  vm.runInNewContext(fs.readFileSync('next.config.js', 'utf8'), {
    module, process: { env: { LEDGERHOUND_SELF_HOST: selfHost ? '1' : undefined } },
    require: (name: string) => {
      if (name !== 'next-intl/plugin') throw Error('Unexpected config dependency');
      return () => (value: unknown) => value;
    },
  });
  return module.exports;
}

describe('read-only Next runtime cache policy', () => {
  it('retains standalone output and the existing 50 MiB memory budget without disk writes on the VPS', () => {
    const c = config(true);
    expect(c.output).toBe('standalone');
    expect(c.experimental.isrFlushToDisk).toBe(false);
    expect(c.cacheMaxMemorySize).toBe(50 * 1024 * 1024);
    expect(c.images.unoptimized).toBe(true);
  });

  it('does not impose the self-host filesystem policy on other build environments', () => {
    const c = config(false);
    expect(c.experimental?.isrFlushToDisk).toBeUndefined();
    expect(c.output).toBeUndefined();
  });

  it('actual installed Next handler retains recent negative responses, evicts old ones and never writes', () => {
    const require = createRequire(import.meta.url);
    const handler = require.resolve('next/dist/server/lib/incremental-cache/file-system-cache');
    const script = `
      const assert = require('node:assert/strict');
      const Cache = require(${JSON.stringify(handler)}).default;
      let writes = 0;
      const cache = new Cache({fs:{existsSync:()=>false,
        readFile:async()=>{throw Object.assign(Error('missing'),{code:'ENOENT'})},
        mkdir:async()=>{writes++;throw Error('readonly')},
        writeFile:async()=>{writes++;throw Error('readonly')}},
        flushToDisk:${JSON.stringify(config(true).experimental?.isrFlushToDisk)},
        serverDistDir:'/app/.next/server',maxMemoryCacheSize:2048,revalidatedTags:[]});
      (async()=>{
        for(let i=0;i<100;i++) await cache.set('/qa-'+i,{kind:'APP_ROUTE',body:Buffer.alloc(100),status:404,headers:{}},{});
        assert.equal(writes,0);
        assert.ok(Cache.memoryCache.totalSize<=2048);
        assert.equal(await cache.get('/qa-0',{kind:'APP_ROUTE'}),null);
        assert.equal((await cache.get('/qa-99',{kind:'APP_ROUTE'})).value.status,404);
        console.log('bounded-readonly-cache-pass');
      })().catch(e=>{console.error(e);process.exit(1)});
    `;
    expect(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' })).toContain('bounded-readonly-cache-pass');
  });
});
