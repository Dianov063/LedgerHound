// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetS3, s3Faults, s3Store } from '../api/helpers/aws-s3-mock';
import { resetResend, sentEmails } from '../api/helpers/resend-mock';
import { deliverReport } from '@/lib/report-delivery';
vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));
vi.mock('resend', () => import('../api/helpers/resend-mock'));
vi.mock('@/lib/logger', () => ({ default: { info() {}, warn() {}, error() {} } }));
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: async () => 'https://signed.example/report' }));
beforeEach(() => { resetS3(); resetResend(); });
describe('review regression', () => {
  it('preserves the PDF already emailed when retrying after a log failure', async () => {
    let failed = false;
    s3Faults.push((cmd, input) => {
      if (failed || cmd !== 'PutObjectCommand' || input.Key !== 'logs/reports.json') return null;
      failed = true;
      return new Error('log failed');
    });
    const base = { caseId: 'LH-MGK1Z2AB-0123456789abcdef', email: 'buyer@example.com',
      walletAddress: '0xabc', network: 'eth', locale: 'en', country: '', stripePaymentId: 'pi_review',
      amount: 4900, idempotencyKey: 'ledgerhound:report:pi_review' };
    await expect(deliverReport({ ...base, buf: Buffer.from('%PDF-FIRST'), pdfSha256: 'first-hash' })).rejects.toThrow('log failed');
    await deliverReport({ ...base, buf: Buffer.from('%PDF-REGENERATED'), pdfSha256: 'different-hash' });
    expect(sentEmails).toHaveLength(1);
    const attachment = (sentEmails[0] as any).attachments[0].content.toString();
    expect(s3Store.get(`reports/${base.caseId}.pdf`)?.body).toBe(attachment);
  });
});
