import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function InvestigatorAgreementPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  return (
    <>
      <Navbar />
      <article className="pt-28 pb-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-3">Investigator Network Agreement</h1>
          <p className="text-xs text-slate-400 mb-8">Effective: April 28, 2026 · Last updated: April 28, 2026</p>

          <div className="prose prose-slate max-w-none prose-headings:font-display prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-slate-600 prose-li:text-slate-600">
            <p className="text-base text-slate-700 leading-relaxed">
              This agreement governs the relationship between LedgerHound (operated by USPROJECT LLC, New York) and certified investigators participating in the LedgerHound Investigator Network ("Network"). By submitting an application via{' '}
              <Link href={`${base}/join-network`}>/join-network</Link>, you agree to these terms.
            </p>

            <h2>1. Eligibility</h2>
            <p>To participate, you must:</p>
            <ul>
              <li>Hold at least one currently valid professional certification: CTCE, CFE, CAMS, EnCE, GCFE, or CCE.</li>
              <li>Have a minimum of two (2) years of professional experience in fraud investigation, digital forensics, or blockchain analytics.</li>
              <li>Be in good professional standing — no active license revocation, criminal conviction related to fraud, or unresolved ethics complaint.</li>
              <li>Be authorized to perform the work you advertise in your jurisdiction.</li>
            </ul>

            <h2>2. Verification</h2>
            <p>
              LedgerHound independently verifies certifications, identity, and professional history before approving a profile for public listing. We may request copies of certificates, references, or proof of identity. False statements result in immediate removal.
            </p>

            <h2>3. Referral Fee Structure</h2>
            <p>
              When a client engages you through the Network (i.e., submits a "Request This Investigator" form on your profile or is matched to you by our team), you agree to remit a <strong>15% referral fee</strong> on gross fees billed for the engagement.
            </p>
            <ul>
              <li>The referral fee is paid by the investigator, not added to the client's bill.</li>
              <li>You set your own rates and engagement terms with the client.</li>
              <li>Referral fees are invoiced monthly and due within 30 days of invoice.</li>
              <li>Disputes about whether a case originated from the Network are resolved by reviewing our timestamped contact-request log.</li>
            </ul>
            <p>
              Future: automated payouts via Stripe Connect (in development). Until then, manual invoicing applies.
            </p>

            <h2>4. Non-Disclosure (NDA)</h2>
            <p>
              All client information, case details, and proprietary LedgerHound tools or methodologies you encounter through the Network are confidential. Disclosure to third parties without written consent terminates this agreement and may give rise to liability.
            </p>

            <h2>5. Code of Conduct</h2>
            <ul>
              <li>You will represent your credentials accurately. No inflated claims, no fake reviews.</li>
              <li>You will not contact a client referred by us without going through their initial inquiry first.</li>
              <li>You will respond to qualified leads within 48 hours, even to decline.</li>
              <li>You will refer cases outside your competence to a more qualified colleague (within or outside the Network).</li>
              <li>You will not solicit our other Network investigators or clients to leave the platform.</li>
            </ul>

            <h2>6. Tools Access</h2>
            <p>
              Approved investigators may receive access to LedgerHound forensic tools (Wallet Tracker, Graph Tracer, Scam Database, etc.). Access tiers are subject to change. Tool access is non-transferable and revocable.
            </p>

            <h2>7. Liability Limitations</h2>
            <p>
              LedgerHound is a referral platform. It does not employ Network investigators, supervise their work, or guarantee outcomes. Investigators operate as independent contractors and are solely responsible for the quality, legality, and outcome of their work. LedgerHound's liability to any party in connection with a referral is limited to the referral fee actually received.
            </p>

            <h2>8. Term and Termination</h2>
            <p>
              Either party may terminate this agreement with 30 days' written notice to <a href="mailto:contact@ledgerhound.vip">contact@ledgerhound.vip</a>. LedgerHound may immediately suspend or remove a profile for breach of this agreement, false statements, fraud, criminal charges, or revocation of certifications. Termination does not affect referral fees owed for cases already closed.
            </p>

            <h2>9. Disputes</h2>
            <p>
              Disputes between investigators and clients are between those parties. Disputes between an investigator and LedgerHound are governed by the laws of New York, USA, and resolved by binding arbitration in New York County under the AAA Commercial Rules.
            </p>

            <h2>10. Changes to This Agreement</h2>
            <p>
              We may update this agreement. Material changes are communicated by email at least 14 days before the effective date. Continued participation constitutes acceptance.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this agreement: <a href="mailto:contact@ledgerhound.vip">contact@ledgerhound.vip</a> or +1 (833) 559-1334.
            </p>

            <p className="text-xs text-slate-400 italic mt-8">
              This agreement is provided for clarity and is not a substitute for advice from a qualified attorney. We encourage prospective Network members to review with their own counsel before applying.
            </p>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
