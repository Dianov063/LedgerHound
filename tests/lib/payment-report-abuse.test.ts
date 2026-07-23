import { describe, expect, it } from 'vitest';
import {
  AbuseProtectionError,
  authorizeEvidenceUpload,
  authorizeReportSubmission,
  enforceReportLimits,
  issueSubmissionSession,
  verifySubmissionSession,
} from '@/lib/payment-report-abuse';

describe('payment report abuse protection', () => {
  it('binds signed submission sessions to an IP and expiry', () => {
    const now = Date.now();
    const token = issueSubmissionSession('203.0.113.10', now);
    expect(verifySubmissionSession(token, '203.0.113.10', now + 1000).v).toBe(1);
    expect(() => verifySubmissionSession(token, '203.0.113.11', now + 1000)).toThrow(AbuseProtectionError);
    expect(() => verifySubmissionSession(`${token}broken`, '203.0.113.10', now + 1000)).toThrow(AbuseProtectionError);
    expect(() => verifySubmissionSession(token, '203.0.113.10', now + 11 * 60 * 1000)).toThrow(AbuseProtectionError);
  });

  it('enforces upload and submission session use', async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const token = issueSubmissionSession(ip);
    for (let index = 0; index < 5; index += 1) {
      await expect(authorizeEvidenceUpload(token, ip)).resolves.toBeUndefined();
    }
    await expect(authorizeEvidenceUpload(token, ip)).rejects.toMatchObject({ code: 'upload_session_exhausted' });
    await expect(authorizeReportSubmission(token, ip)).resolves.toBeUndefined();
    await expect(authorizeReportSubmission(token, ip)).rejects.toMatchObject({ code: 'submission_session_used' });
  });

  it('blocks the same email and recipient combination for 24 hours', async () => {
    const suffix = `${Date.now()}-${Math.random()}`;
    const input = {
      ip: `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
      reporterEmail: `reporter-${suffix}@example.com`,
      identityHash: `identity-${suffix}`,
    };
    await expect(enforceReportLimits(input)).resolves.toBeUndefined();
    await expect(enforceReportLimits(input)).rejects.toMatchObject({ code: 'duplicate_report' });
  });
});
