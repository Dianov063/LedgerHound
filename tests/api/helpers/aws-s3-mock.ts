/**
 * In-memory stand-in for @aws-sdk/client-s3, used via
 *   vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'))
 * Supports the commands the routes under test use, including the
 * IfNoneMatch: '*' conditional write.
 */
export interface StoredObject {
  body: string;
  modified: Date;
  input: Record<string, unknown>;
}

export const s3Store = new Map<string, StoredObject>();
export const s3Calls: { command: string; input: Record<string, unknown> }[] = [];

export function resetS3(): void {
  s3Store.clear();
  s3Calls.length = 0;
}

export function putJson(key: string, value: unknown, modified = new Date()): void {
  s3Store.set(key, { body: JSON.stringify(value), modified, input: {} });
}

export function getJson<T = Record<string, unknown>>(key: string): T | null {
  const o = s3Store.get(key);
  return o ? (JSON.parse(o.body) as T) : null;
}

class Command {
  constructor(public input: Record<string, unknown>) {}
}
export class PutObjectCommand extends Command {}
export class GetObjectCommand extends Command {}
export class HeadObjectCommand extends Command {}
export class DeleteObjectCommand extends Command {}
export class ListObjectsV2Command extends Command {}

function s3Error(name: string, status: number): Error {
  return Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } });
}

export class S3Client {
  constructor(_config?: unknown) {}

  async send(cmd: Command): Promise<unknown> {
    const input = cmd.input;
    const key = String(input.Key ?? '');
    s3Calls.push({ command: cmd.constructor.name, input });

    if (cmd instanceof PutObjectCommand) {
      if (input.IfNoneMatch === '*' && s3Store.has(key)) throw s3Error('PreconditionFailed', 412);
      const body = typeof input.Body === 'string' ? input.Body : String(input.Body ?? '');
      s3Store.set(key, { body, modified: new Date(), input });
      return {};
    }
    if (cmd instanceof GetObjectCommand) {
      const o = s3Store.get(key);
      if (!o) throw s3Error('NoSuchKey', 404);
      return { Body: { transformToString: async () => o.body }, LastModified: o.modified };
    }
    if (cmd instanceof HeadObjectCommand) {
      const o = s3Store.get(key);
      if (!o) throw s3Error('NotFound', 404);
      return { LastModified: o.modified };
    }
    if (cmd instanceof DeleteObjectCommand) {
      s3Store.delete(key);
      return {};
    }
    if (cmd instanceof ListObjectsV2Command) {
      const prefix = String(input.Prefix ?? '');
      const max = typeof input.MaxKeys === 'number' ? input.MaxKeys : 1000;
      const contents = Array.from(s3Store.entries())
        .filter(([k]) => k.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, max)
        .map(([k, v]) => ({ Key: k, Size: v.body.length, LastModified: v.modified }));
      return { Contents: contents, KeyCount: contents.length, IsTruncated: false };
    }
    throw new Error(`aws-s3-mock: unsupported command ${cmd.constructor.name}`);
  }
}
