// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putJson, resetS3 } from '../api/helpers/aws-s3-mock';
import { resetResend, sentEmails } from '../api/helpers/resend-mock';
import { generateEmergencyPack, type GeneratePackInput } from '@/lib/generateEmergencyPack';
import { packManifestKey, type PackManifest } from '@/lib/legal-packs/manifest';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));
vi.mock('resend', () => import('../api/helpers/resend-mock'));
vi.mock('@/lib/legal-packs/templates', () => ({
  PoliceComplaintDoc: () => null,
  PreservationLetterDoc: () => null,
  RegulatorComplaintDoc: () => null,
  ActionGuideDoc: () => null,
}));

const caseId = 'ER-MGK1Z2AB-0123456789abcdef';
const packInput: GeneratePackInput = {
  caseId,
  countryCode: 'US',
  email: 'buyer@example.com',
  victimName: 'Buyer',
  lossAmount: 100,
  scamType: 'investment',
  walletAddress: '0xabc',
  txHashes: ['0xdef'],
  description: 'Test case',
  idempotencyKey: 'ledgerhound:pack:payment-one',
};

function seedManifest(emailTransport?: PackManifest['emailTransport']) {
  putJson(packManifestKey(caseId), {
    caseId,
    createdAt: '2026-10-24T00:00:00.000Z',
    documents: [],
    email: {
      from: 'LedgerHound <noreply@ledgerhound.vip>',
      to: 'buyer@example.com',
      subject: 'Emergency pack',
      text: 'Download links',
    },
    ...(emailTransport ? { emailTransport } : {}),
  } satisfies PackManifest);
}

beforeEach(() => {
  resetS3();
  resetResend();
  process.env.EMAIL_TRANSPORT = 'resend';
  process.env.RESEND_API_KEY = 're_test';
  process.env.MAILHUB_API_KEY = 'mh_test';
  process.env.MAILHUB_API_URL = 'https://mailhub.example';
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.EMAIL_TRANSPORT = 'resend';
});

describe('frozen Emergency Pack transport', () => {
  it('uses frozen Resend even after env switches to MailHub', async () => {
    seedManifest('resend');
    process.env.EMAIL_TRANSPORT = 'mailhub';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await generateEmergencyPack(packInput);

    expect(sentEmails).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses frozen MailHub even after env switches to Resend', async () => {
    seedManifest('mailhub');
    process.env.EMAIL_TRANSPORT = 'resend';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email_pack', status: 'QUEUED' }), { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await generateEmergencyPack(packInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(0);
  });

  it('defaults legacy manifests without a transport to Resend', async () => {
    seedManifest();
    process.env.EMAIL_TRANSPORT = 'mailhub';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await generateEmergencyPack(packInput);

    expect(sentEmails).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
