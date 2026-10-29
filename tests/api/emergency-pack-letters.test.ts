// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, resetS3, s3Store } from './helpers/aws-s3-mock';
import { resetResend, sentEmails } from './helpers/resend-mock';
import { resetStripe, stripeSessions } from './helpers/stripe-mock';
import { __resetCaseAccessCacheForTests } from '@/lib/emergency-case-access';
import { generateEmergencyPack, preservationLetterName } from '@/lib/generateEmergencyPack';
import { packManifestKey, type PackManifest } from '@/lib/legal-packs/manifest';
import { GET as status } from '@/app/api/emergency/status/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('resend', () => import('./helpers/resend-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (_client: unknown, cmd: { input: { Key: string } }) => `https://signed.example/${cmd.input.Key}`,
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));
vi.mock('@/lib/legal-packs/s3', () => ({
  getResearch: async () => ({ name: 'United States', exchangeContacts: [] }),
}));
vi.mock('@/lib/legal-packs/templates', () => ({
  PoliceComplaintDoc: () => null,
  PreservationLetterDoc: () => null,
  RegulatorComplaintDoc: () => null,
  ActionGuideDoc: () => null,
}));
// Each "PDF" records which exchange address it was rendered for.
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: async (el: { props: { caseData: { exchangeAddress?: string } } }) =>
    Buffer.from(`%PDF ${el.props.caseData.exchangeAddress ?? 'none'}`),
}));

const CASE = 'ER-MVTUQ1X5-69d6a410ad98d176';
// The QA run of 2026-10-29: four addresses share one label.
const BINANCE = [
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
  '0x9696f59e4d72e237be84ffd425dcad154bf96976',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
];
const exchanges = [
  ...BINANCE.map((address) => ({ name: 'Binance Hot Wallet', address })),
  { name: 'Binance 14 (Hot Wallet)', address: '0x28c6c06298d514db089934071355e5743bf21d60' },
  // The same address reported twice (checksummed and lowercase).
  { name: 'Binance Hot Wallet', address: '0xDFD5293D8E347DFE59E90EFD55B2956A1343963D' },
];

const input = () => ({
  caseId: CASE,
  countryCode: 'US',
  email: 'qa@ledgerhound.invalid',
  victimName: 'QA',
  lossAmount: 100,
  scamType: 'investment',
  walletAddress: '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569',
  txHashes: ['0xdef'],
  description: 'QA case',
  idempotencyKey: 'ledgerhound:pack:pi_test',
  enrichment: { identifiedExchanges: exchanges },
});

beforeEach(() => {
  resetS3();
  resetResend();
  resetStripe();
  __resetCaseAccessCacheForTests();
  process.env.EMAIL_TRANSPORT = 'resend';
  process.env.RESEND_API_KEY = 're_test';
});

describe('Emergency Pack preservation letters', () => {
  it('stores one letter per exchange address, each manifest entry its own PDF', async () => {
    await generateEmergencyPack(input());

    const manifest = getJson<PackManifest>(packManifestKey(CASE))!;
    const letters = manifest.documents.filter((d) => d.type === 'preservation-letter');
    expect(letters).toHaveLength(5); // 4 Binance Hot Wallet + Binance 14; the duplicate is dropped

    const keys = manifest.documents.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(s3Store.has(key)).toBe(true);

    // Every letter was rendered for, and stored under, its own address.
    for (const address of BINANCE) {
      const doc = letters.find((d) => d.key.includes(address))!;
      expect(s3Store.get(doc.key)!.body).toBe(`%PDF ${address}`);
      expect(doc.label).toContain(`${address.slice(0, 6)}…${address.slice(-4)}`);
    }

    const pdfs = Array.from(s3Store.keys()).filter((k) => k.startsWith(`legal-packs/cases/${CASE}/`) && k.endsWith('.pdf'));
    expect(pdfs).toHaveLength(manifest.documents.length);
    expect(sentEmails).toHaveLength(1);
  });

  it('a retry after an interrupted run keeps the stored letters and adds the missing ones', async () => {
    const firstKey = `legal-packs/cases/${CASE}/${preservationLetterName(exchanges[0])}.pdf`;
    s3Store.set(firstKey, { body: '%PDF earlier attempt', modified: new Date(), input: {} });

    await generateEmergencyPack(input());

    expect(s3Store.get(firstKey)!.body).toBe('%PDF earlier attempt');
    const manifest = getJson<PackManifest>(packManifestKey(CASE))!;
    for (const d of manifest.documents) expect(s3Store.has(d.key)).toBe(true);
    expect(manifest.documents.filter((d) => d.type === 'preservation-letter')).toHaveLength(5);
  });

  it('status lists every document with the labels from the manifest', async () => {
    await generateEmergencyPack(input());
    stripeSessions.set('cs_test_pack000001', { id: 'cs_test_pack000001', payment_status: 'paid', metadata: { caseId: CASE } });

    const res = await status(new NextRequest(
      `https://www.ledgerhound.vip/api/emergency/status?case_id=${CASE}&session_id=cs_test_pack000001`,
    ));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.documents).toHaveLength(8); // 3 standard + 5 letters

    const manifest = getJson<PackManifest>(packManifestKey(CASE))!;
    const labels = body.documents.map((d: { label: string }) => d.label).sort();
    expect(labels).toEqual(manifest.documents.map((d) => d.label).sort());
    expect(new Set(body.documents.map((d: { type: string }) => d.type)).size).toBe(8);
  });

  it('names letters safely for S3 and keeps base58 addresses case-sensitive', () => {
    expect(preservationLetterName({ name: 'Binance 14 (Hot Wallet)', address: '0xABC' }))
      .toBe('preservation-letter-binance-14-hot-wallet-0xabc');
    expect(preservationLetterName({ name: 'OKX', address: 'TXyzAbC123' }))
      .toBe('preservation-letter-okx-TXyzAbC123');
    expect(preservationLetterName({ name: '???', address: '' })).toBe('preservation-letter-exchange');
  });
});
