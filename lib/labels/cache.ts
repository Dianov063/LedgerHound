/**
 * S3 cache for federation results.
 *
 * Layout: s3://<bucket>/address-labels/<network>/<address>.json
 * TTL:    7 days (configurable per call).
 *
 * Reads are best-effort — any S3 error (missing key, transient outage)
 * results in a cache miss; the federation will re-query upstream sources.
 * Writes are also best-effort — federation succeeds even if the write fails
 * (just won't speed up the next call).
 *
 * 2026-05-20: Phase 1.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { AddressLabelResponse } from './types';

const CACHE_PREFIX = 'address-labels';
const DEFAULT_TTL_DAYS = 7;

function getS3(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function bucket(): string | undefined {
  return process.env.AWS_S3_BUCKET;
}

function keyFor(address: string, network: string): string {
  const norm = address.startsWith('0x') ? address.toLowerCase() : address;
  return `${CACHE_PREFIX}/${network}/${norm}.json`;
}

async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Return a cached response if present AND not expired. Returns null otherwise.
 */
export async function getFromCache(
  address: string,
  network: string,
): Promise<AddressLabelResponse | null> {
  const b = bucket();
  if (!b) return null;

  try {
    const res = await getS3().send(new GetObjectCommand({ Bucket: b, Key: keyFor(address, network) }));
    const body = await streamToString(res.Body);
    const data = JSON.parse(body) as AddressLabelResponse;

    const ageMs = Date.now() - new Date(data.cached_at).getTime();
    const ttlMs = (data.ttl_days || DEFAULT_TTL_DAYS) * 24 * 60 * 60 * 1000;
    if (ageMs > ttlMs) return null;

    return data;
  } catch (e: any) {
    if (e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey') return null;
    console.warn('[labels.cache] read failed for', address, e?.message || e);
    return null;
  }
}

/**
 * Persist a federation response. Errors are logged but not thrown — caller
 * is unaffected by cache failures.
 */
export async function saveToCache(response: AddressLabelResponse): Promise<void> {
  const b = bucket();
  if (!b) return;

  try {
    await getS3().send(new PutObjectCommand({
      Bucket: b,
      Key: keyFor(response.address, response.network),
      Body: JSON.stringify(response),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
    }));
  } catch (e: any) {
    console.warn('[labels.cache] write failed for', response.address, e?.message || e);
  }
}
