// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyticsId } from '@/lib/analytics';

const ID = 'G-TEST000000';

describe('Google Analytics id of a build', () => {
  it('production on Vercel and the self-hosted build use the configured id', () => {
    expect(analyticsId(ID, 'production')).toBe(ID);
    expect(analyticsId(ID, undefined)).toBe(ID); // self-hosted: no VERCEL_ENV
    expect(analyticsId(` ${ID} `, undefined)).toBe(ID);
  });

  it('a Vercel Preview never gets Analytics, even with the id in its environment', () => {
    expect(analyticsId(ID, 'preview')).toBeNull();
  });

  it('no id, an empty id or spaces: no Analytics anywhere', () => {
    for (const id of [undefined, '', '   ']) {
      for (const env of [undefined, 'production', 'preview']) expect(analyticsId(id, env)).toBeNull();
    }
  });

  it('the layout passes the id as the literal expression Next replaces at build time', () => {
    const layout = readFileSync(join(process.cwd(), 'app', '[locale]', 'layout.tsx'), 'utf8');
    // Read through a variable, the id would be missing at run time in the container (build-time only).
    expect(layout).toContain('analyticsId(process.env.NEXT_PUBLIC_GA_ID, process.env.VERCEL_ENV)');
    expect(layout.match(/process\.env\.NEXT_PUBLIC_GA_ID/g)).toHaveLength(1);
  });
});
