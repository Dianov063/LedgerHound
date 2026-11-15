/**
 * QA (package 58): minimal S3-compatible object store, in memory, listening on 127.0.0.1 only.
 * Path-style requests (the AWS SDK uses path style for an IP endpoint). Supports what
 * lib/scam-db.ts uses: PutObject (with If-Match / If-None-Match: *), GetObject, HeadObject,
 * DeleteObject, ListObjectsV2.
 * Only the buckets it was started with exist; every other bucket answers NoSuchBucket.
 * Signatures are not checked -- this store holds only synthetic QA data and is not reachable
 * from outside the machine.
 */
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function errorXml(res, status, code, message, resource) {
  res.writeHead(status, { 'content-type': 'application/xml' });
  res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>${code}</Code><Message>${xml(message)}</Message><Resource>${xml(resource)}</Resource><RequestId>qa</RequestId></Error>`);
}

/** Decodes an `aws-chunked` body (size;chunk-signature=..\r\n data \r\n ... 0\r\n trailers). */
function decodeAwsChunked(buf) {
  const out = [];
  let i = 0;
  while (i < buf.length) {
    const lineEnd = buf.indexOf('\r\n', i);
    if (lineEnd < 0) break;
    const size = parseInt(buf.subarray(i, lineEnd).toString('latin1').split(';')[0], 16);
    if (!Number.isFinite(size)) throw new Error('bad aws-chunked body');
    if (size === 0) break;
    out.push(buf.subarray(lineEnd + 2, lineEnd + 2 + size));
    i = lineEnd + 2 + size + 2;
  }
  return Buffer.concat(out);
}

export function startFakeS3({ port = 0, buckets = [] } = {}) {
  const store = new Map(buckets.map((b) => [b, new Map()]));
  const counters = { requests: 0, put: 0, get: 0, head: 0, delete: 0, list: 0, rejected: 0 };
  // Fault switch for one scenario: answer 503 to every GET of keys under `getPrefix` while set.
  // `armPrefix`: the switch turns on at the first PUT under that prefix ("503 after the file was saved").
  const fault = { getPrefix: null, armPrefix: null, injected: 0 };
  const server = createServer((req, res) => {
    counters.requests++;
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        const [, bucketName, ...rest] = url.pathname.split('/');
        const key = decodeURIComponent(rest.join('/'));
        const bucket = store.get(bucketName);
        if (!bucket) { counters.rejected++; return errorXml(res, 404, 'NoSuchBucket', 'The specified bucket does not exist', `/${bucketName}`); }

        if (req.method === 'GET' && !key) {
          if (url.searchParams.get('list-type') !== '2') return errorXml(res, 400, 'InvalidRequest', 'Only ListObjectsV2 is supported', url.pathname);
          counters.list++;
          const prefix = url.searchParams.get('prefix') || '';
          const max = Math.min(1000, Number(url.searchParams.get('max-keys') || 1000));
          const token = url.searchParams.get('continuation-token');
          const after = token ? Buffer.from(token, 'base64url').toString('utf8') : (url.searchParams.get('start-after') || '');
          const keys = Array.from(bucket.keys()).filter((k) => k.startsWith(prefix) && k > after).sort();
          const page = keys.slice(0, max);
          const truncated = keys.length > max;
          const contents = page.map((k) => {
            const o = bucket.get(k);
            return `<Contents><Key>${xml(k)}</Key><LastModified>${o.lastModified}</LastModified><ETag>"${o.etag}"</ETag><Size>${o.body.length}</Size><StorageClass>STANDARD</StorageClass></Contents>`;
          }).join('');
          res.writeHead(200, { 'content-type': 'application/xml' });
          return res.end(`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>${xml(bucketName)}</Name><Prefix>${xml(prefix)}</Prefix><KeyCount>${page.length}</KeyCount><MaxKeys>${max}</MaxKeys><IsTruncated>${truncated}</IsTruncated>${contents}${truncated ? `<NextContinuationToken>${Buffer.from(page[page.length - 1]).toString('base64url')}</NextContinuationToken>` : ''}</ListBucketResult>`);
        }
        if (!key) return errorXml(res, 400, 'InvalidRequest', 'Bucket-level operation not supported', url.pathname);

        if (req.method === 'PUT') {
          counters.put++;
          if (fault.armPrefix !== null && key.startsWith(fault.armPrefix)) { fault.getPrefix = fault.armPrefix; fault.armPrefix = null; }
          // Conditional writes, as S3: If-None-Match: * (create only) and If-Match: <etag> (replace only
          // that version). The check and the write happen in one turn of the event loop -> atomic here.
          const ifNoneMatch = req.headers['if-none-match'];
          const ifMatch = req.headers['if-match'];
          const current = bucket.get(key);
          if ((ifNoneMatch === '*' && current) || (ifMatch !== undefined && (!current || ifMatch.replace(/"/g, '') !== current.etag))) {
            counters.preconditionFailed = (counters.preconditionFailed || 0) + 1;
            return errorXml(res, 412, 'PreconditionFailed', 'At least one of the pre-conditions you specified did not hold', `/${bucketName}/${key}`);
          }
          let body = Buffer.concat(chunks);
          const enc = String(req.headers['content-encoding'] || '');
          if (enc.includes('aws-chunked') || req.headers['x-amz-decoded-content-length']) body = decodeAwsChunked(body);
          const etag = createHash('md5').update(body).digest('hex');
          bucket.set(key, { body, etag, contentType: req.headers['content-type'] || 'application/octet-stream', lastModified: new Date().toISOString() });
          res.writeHead(200, { etag: `"${etag}"` });
          return res.end();
        }
        if (req.method === 'GET' && fault.getPrefix !== null && key.startsWith(fault.getPrefix)) {
          fault.injected++;
          return errorXml(res, 503, 'ServiceUnavailable', 'QA fault: temporarily unavailable', `/${bucketName}/${key}`);
        }
        const obj = bucket.get(key);
        if (req.method === 'GET' || req.method === 'HEAD') {
          counters[req.method === 'GET' ? 'get' : 'head']++;
          if (!obj) {
            if (req.method === 'HEAD') { res.writeHead(404); return res.end(); }
            return errorXml(res, 404, 'NoSuchKey', 'The specified key does not exist.', `/${bucketName}/${key}`);
          }
          res.writeHead(200, { 'content-type': obj.contentType, 'content-length': obj.body.length, etag: `"${obj.etag}"`, 'last-modified': new Date(obj.lastModified).toUTCString() });
          return res.end(req.method === 'GET' ? obj.body : undefined);
        }
        if (req.method === 'DELETE') {
          counters.delete++;
          // conditional delete (If-Match), as Amazon S3: 412 when the object changed, 404 when it is gone
          const ifMatchDelete = req.headers['if-match'];
          if (ifMatchDelete !== undefined) {
            if (!obj) return errorXml(res, 404, 'NoSuchKey', 'The specified key does not exist.', `/${bucketName}/${key}`);
            if (ifMatchDelete.replace(/"/g, '') !== obj.etag) {
              counters.preconditionFailed = (counters.preconditionFailed || 0) + 1;
              return errorXml(res, 412, 'PreconditionFailed', 'At least one of the pre-conditions you specified did not hold', `/${bucketName}/${key}`);
            }
            counters.conditionalDelete = (counters.conditionalDelete || 0) + 1;
          }
          bucket.delete(key);
          res.writeHead(204);
          return res.end();
        }
        return errorXml(res, 405, 'MethodNotAllowed', 'Method not allowed', url.pathname);
      } catch (err) {
        return errorXml(res, 500, 'InternalError', String(err?.message || err), req.url);
      }
    });
  });
  return new Promise((resolveStart) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: actual } = server.address();
      resolveStart({
        url: `http://127.0.0.1:${actual}`,
        counters,
        /** Answer 503 to GETs of keys starting with `prefix` (null clears it). */
        failGets: (prefix) => { fault.getPrefix = prefix; fault.armPrefix = null; },
        /** Answer 503 to GETs under `prefix` from the first PUT under it on (until failGets(null)). */
        failGetsAfterPut: (prefix) => { fault.armPrefix = prefix; fault.getPrefix = null; },
        fault,
        /** Number of objects in a bucket (direct view of the store, for the report). */
        size: (b) => store.get(b)?.size ?? 0,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

export const randomBucketName = () => `qa-complaints-${randomBytes(4).toString('hex')}`;
