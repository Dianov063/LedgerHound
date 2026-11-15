/**
 * In-memory stand-in for @aws-sdk/client-s3, used via
 *   vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'))
 * Supports the commands the routes under test use, including the
 * IfNoneMatch: '*' conditional write, If-Match writes and If-Match deletes.
 */
export interface StoredObject {
  body: string;
  modified: Date;
  input: Record<string, unknown>;
  etag?: string;
  bytes?: Buffer;
}

let etagCounter = 0;
const nextEtag = () => `"etag-${++etagCounter}"`;

export const s3Store = new Map<string, StoredObject>();
export const s3Calls: { command: string; input: Record<string, unknown> }[] = [];

/** What storage answered to each command that failed (after faults and conditions), in order. */
export const s3Failures: { command: string; key: string; status?: number; name: string; input: Record<string, unknown> }[] = [];

/** Fault injection: return an Error to make that command fail. */
export const s3Faults: ((command: string, input: Record<string, unknown>) => Error | null)[] = [];

/** Ordering control: return a promise to hold that command until it resolves (e.g. to replay a race). */
export const s3Gates: ((command: string, input: Record<string, unknown>) => Promise<void> | null)[] = [];

export function resetS3(): void {
  s3Store.clear();
  s3Calls.length = 0;
  s3Failures.length = 0;
  s3Faults.length = 0;
  s3Gates.length = 0;
}

export function putJson(key: string, value: unknown, modified = new Date()): void {
  s3Store.set(key, { body: JSON.stringify(value), modified, input: {}, etag: nextEtag() });
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
    try {
      return await this.execute(cmd);
    } catch (err: any) {
      s3Failures.push({ command: cmd.constructor.name, key: String(cmd.input.Key ?? ''), status: err?.$metadata?.httpStatusCode, name: String(err?.name), input: cmd.input });
      throw err;
    }
  }

  private async execute(cmd: Command): Promise<unknown> {
    const input = cmd.input;
    const key = String(input.Key ?? '');
    s3Calls.push({ command: cmd.constructor.name, input });
    for (const gate of s3Gates) {
      const hold = gate(cmd.constructor.name, input);
      if (hold) await hold;
    }
    for (const fault of s3Faults) {
      const err = fault(cmd.constructor.name, input);
      if (err) throw err;
    }

    if (cmd instanceof PutObjectCommand) {
      if (input.IfNoneMatch === '*' && s3Store.has(key)) throw s3Error('PreconditionFailed', 412);
      if (input.IfMatch !== undefined) {
        const current = s3Store.get(key);
        if (!current || current.etag !== input.IfMatch) throw s3Error('PreconditionFailed', 412);
      }
      const bytes = Buffer.isBuffer(input.Body) ? Buffer.from(input.Body) : Buffer.from(String(input.Body ?? ''), 'utf8');
      const body = bytes.toString('utf8');
      const etag = nextEtag();
      s3Store.set(key, { body, modified: new Date(), input, etag, bytes });
      return { ETag: etag, $metadata: { httpStatusCode: 200 } };
    }
    if (cmd instanceof GetObjectCommand) {
      const o = s3Store.get(key);
      if (!o) throw s3Error('NoSuchKey', 404);
      return {
        Body: {
          transformToString: async () => o.body,
          transformToByteArray: async () => new Uint8Array(o.bytes ?? Buffer.from(o.body, 'utf8')),
        },
        LastModified: o.modified,
        ETag: o.etag,
        Metadata: o.input.Metadata,
        $metadata: { httpStatusCode: 200 },
      };
    }
    if (cmd instanceof HeadObjectCommand) {
      const o = s3Store.get(key);
      if (!o) throw s3Error('NotFound', 404);
      return { LastModified: o.modified, ETag: o.etag, $metadata: { httpStatusCode: 200 } };
    }
    if (cmd instanceof DeleteObjectCommand) {
      // conditional delete (If-Match), as Amazon S3: 412 when the object changed, 404 when it is gone
      if (input.IfMatch !== undefined) {
        const current = s3Store.get(key);
        if (!current) throw s3Error('NoSuchKey', 404);
        if (current.etag !== input.IfMatch) throw s3Error('PreconditionFailed', 412);
      }
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
