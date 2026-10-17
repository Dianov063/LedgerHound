// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { withRunLock } from '@/lib/run-lock';

describe('withRunLock', () => {
  it('refuses a second concurrent run and releases after completion or failure', async () => {
    let release: () => void = () => {};
    const first = withRunLock('job', () => new Promise<string>((r) => { release = () => r('done'); }));
    expect(await withRunLock('job', async () => 'second')).toBeNull();
    expect(await withRunLock('other-job', async () => 'independent')).toBe('independent');
    release();
    expect(await first).toBe('done');

    await expect(withRunLock('job', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(await withRunLock('job', async () => 'after failure')).toBe('after failure');
  });
});
