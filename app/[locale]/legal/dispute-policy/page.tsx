import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Scale, Clock, Shield, FileText, Mail, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Dispute Policy | LedgerHound',
  description: 'LedgerHound dispute resolution policy for scam database listings.',
};

export default function DisputePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600/20 rounded-2xl mb-4">
            <Scale size={28} className="text-brand-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-3">Dispute Policy</h1>
          <p className="text-slate-400">
            LedgerHound Scam Database · DMCA / Section 230 Compliance
          </p>
          <p className="text-slate-500 text-sm mt-2">Last updated: April 2026</p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-brand-400" />
              Overview
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              The LedgerHound Scam Database is a community-driven platform that aggregates user-submitted reports of cryptocurrency scams.
              We take accuracy seriously and provide a formal dispute process for any party who believes a listing is inaccurate, incomplete, or unjust.
            </p>
            <p className="text-slate-300 leading-relaxed">
              This policy is designed to comply with Section 230 of the Communications Decency Act and applicable DMCA provisions.
              LedgerHound acts as a platform for user-generated content and implements good-faith procedures to address disputes promptly.
            </p>
          </section>

          {/* Who Can Dispute */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4">Who Can Submit a Dispute?</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">1.</span>
                <span><strong className="text-white">Platform Owners or Operators</strong> — Individuals or entities who own or operate the platform listed in the database.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">2.</span>
                <span><strong className="text-white">Legal Representatives</strong> — Attorneys or authorized agents acting on behalf of a listed platform.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">3.</span>
                <span><strong className="text-white">Other Interested Parties</strong> — Anyone with credible evidence that a listing contains materially inaccurate information.</span>
              </li>
            </ul>
          </section>

          {/* Process */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-brand-400" />
              Dispute Process
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Submit Dispute Form</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Complete the <Link href="/scam-database/dispute" className="text-brand-400 hover:underline">online dispute form</Link> with
                    your contact information, relationship to the platform, evidence type, and a detailed description (minimum 500 characters).
                    You may attach supporting documents (PDFs, images).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Acknowledgment</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You will receive a confirmation email with your dispute ID within minutes of submission.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">3</div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Review Period</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Our compliance team reviews all disputes within <strong className="text-white">7 business days</strong>.
                    During review, we evaluate the evidence provided against existing reports, blockchain data, and any additional sources.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">4</div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Decision</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You will be notified by email of the outcome. If your dispute is upheld, the listing will be removed or updated.
                    If denied, you will receive an explanation and may submit an appeal.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-brand-400" />
              Timeline
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-brand-400 mb-1">24h</p>
                <p className="text-slate-400 text-sm">Confirmation email</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-amber-400 mb-1">7 days</p>
                <p className="text-slate-400 text-sm">Review period</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-emerald-400 mb-1">48h</p>
                <p className="text-slate-400 text-sm">Post-decision action</p>
              </div>
            </div>
          </section>

          {/* Valid Grounds */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4">What Constitutes a Valid Dispute?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-5">
                <h3 className="text-emerald-400 font-semibold mb-2">Valid Grounds</h3>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li>• Platform is legitimately licensed and regulated</li>
                  <li>• Listed information is factually incorrect</li>
                  <li>• Platform was confused with another entity</li>
                  <li>• Resolved customer complaints with evidence</li>
                  <li>• Court order or regulatory clearance</li>
                </ul>
              </div>
              <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-5">
                <h3 className="text-red-400 font-semibold mb-2">Not Valid Grounds</h3>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li>• Simply disagreeing with victim reports</li>
                  <li>• Claiming reports are "fake" without evidence</li>
                  <li>• Threats of legal action without substance</li>
                  <li>• Requests to remove blockchain-verified data</li>
                  <li>• Anonymous submissions without contact info</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Appeal */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4">Appeal Process</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If your dispute is denied and you have additional evidence, you may:
            </p>
            <ul className="text-slate-300 space-y-2 mb-4">
              <li>• Submit a new dispute with additional supporting documentation</li>
              <li>• Contact our legal team directly at <a href="mailto:contact@ledgerhound.vip" className="text-brand-400 hover:underline">contact@ledgerhound.vip</a></li>
              <li>• Have your attorney send a formal legal notice to our registered agent</li>
            </ul>
          </section>

          {/* Legal Notices */}
          <section className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-8">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              Legal Notices
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              For formal legal notices, DMCA takedown requests, or court orders, please contact:
            </p>
            <div className="bg-slate-900 rounded-xl p-5 text-sm text-slate-300 leading-relaxed">
              <p className="font-semibold text-white mb-2">USPROJECT LLC</p>
              <p>Email: <a href="mailto:contact@ledgerhound.vip" className="text-brand-400">contact@ledgerhound.vip</a></p>
              <p>Phone: +1 (833) 559-1334</p>
              <p className="mt-2 text-slate-500">
                Legal notices must include the sender's full name, contact information, and specific identification of the content at issue.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/scam-database/dispute"
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Mail size={18} /> Submit a Dispute
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
