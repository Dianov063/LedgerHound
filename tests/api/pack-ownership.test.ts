// @vitest-environment node
/**
 * Review 49, R1: documents of two purchases of one case never mix. Real
 * generateEmergencyPack; the renderer writes the purchase description into
 * each "PDF" so every stored document shows whose data it holds.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { resetResend, sentEmails } from './helpers/resend-mock';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import { packManifestKey, packOwnerKey, type PackManifest } from '@/lib/legal-packs/manifest';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('resend', () => import('./helpers/resend-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (_c: unknown, cmd: { input: { Key: string } }) => `https://signed.example/${cmd.input.Key}`,
}));
vi.mock('@/lib/legal-packs/s3', () => ({ getResearch: async () => ({ name: 'United States', exchangeContacts: [] }) }));
vi.mock('@/lib/legal-packs/templates', () => ({
  PoliceComplaintDoc: () => null, PreservationLetterDoc: () => null, RegulatorComplaintDoc: () => null, ActionGuideDoc: () => null,
}));
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: async (el: { props: { caseData: { description: string } } }) => Buffer.from(`%PDF description=${el.props.caseData.description}`),
}));

const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
const pack = (description: string, paymentId: string) => ({
  caseId: CASE, countryCode: 'US', email: 'fictional@example.com', victimName: 'Test', lossAmount: 2500,
  scamType: 'investment', walletAddress: '', txHashes: [], description, paymentId, idempotencyKey: `ledgerhound:pack:${paymentId}`,
});
const docsOf = (m: PackManifest) => m.documents.map((d) => s3Store.get(d.key)!.body);

beforeEach(() => {
  resetS3();
  resetResend();
  process.env.EMAIL_TRANSPORT = 'resend';
  process.env.RESEND_API_KEY = 're_test';
  for (const k of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']) process.env[k] = 'test';
});

describe('one owner per case document set', () => {
  it('B cannot adopt the PDFs A left before its manifest; A finishes with its own documents only', async () => {
    s3Faults.push((cmd, input) => (cmd === 'PutObjectCommand' && String(input.Key).endsWith('/regulator-complaint.pdf') ? new Error('simulated crash') : null));
    await expect(generateEmergencyPack(pack('PURCHASE A', 'pi_A'))).rejects.toThrow('simulated crash');
    expect(s3Store.has(packManifestKey(CASE))).toBe(false);
    expect(getJson(packOwnerKey(CASE))).toMatchObject({ paymentId: 'pi_A' });
    s3Faults.length = 0;

    await expect(generateEmergencyPack(pack('PURCHASE B', 'pi_B'))).rejects.toMatchObject({ name: 'ManualReviewError', code: 'case_paid_twice' });
    expect(sentEmails).toHaveLength(0);
    expect(Array.from(s3Store.values()).some((o) => o.body.includes('PURCHASE B'))).toBe(false);

    await generateEmergencyPack(pack('PURCHASE A', 'pi_A')); // A's retry
    const manifest = getJson<PackManifest>(packManifestKey(CASE))!;
    expect(manifest.paymentId).toBe('pi_A');
    expect(docsOf(manifest).every((b) => b.includes('PURCHASE A'))).toBe(true);
    expect(sentEmails).toHaveLength(1);
  });

  it('A and B generating at the same moment: one owns the set, every document is its own, one email', async () => {
    const results = await Promise.allSettled([generateEmergencyPack(pack('PURCHASE A', 'pi_A')), generateEmergencyPack(pack('PURCHASE B', 'pi_B'))]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ name: 'ManualReviewError', code: 'case_paid_twice' });
    const owner = getJson<{ paymentId: string }>(packOwnerKey(CASE))!.paymentId;
    const manifest = getJson<PackManifest>(packManifestKey(CASE))!;
    expect(manifest.paymentId).toBe(owner);
    const mine = owner === 'pi_A' ? 'PURCHASE A' : 'PURCHASE B';
    expect(docsOf(manifest).every((b) => b.includes(mine))).toBe(true);
    expect(sentEmails).toHaveLength(1);
  });

  it('documents already stored without an owner are not adopted', async () => {
    putJson(`legal-packs/cases/${CASE}/police-complaint.pdf`, { pdf: 'unknown purchase' });
    await expect(generateEmergencyPack(pack('PURCHASE A', 'pi_A'))).rejects.toMatchObject({ code: 'pack_artifacts_unowned' });
    expect(s3Store.has(packOwnerKey(CASE))).toBe(false);
    expect(sentEmails).toHaveLength(0);
  });
});
