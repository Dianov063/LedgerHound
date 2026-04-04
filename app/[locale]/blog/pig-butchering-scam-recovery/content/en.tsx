import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ContentEn({ base }: { base: string }) {
  return (
    <>
              {/* Intro */}
              <p className="text-lg text-slate-700 leading-relaxed">
                You met someone online a few months ago. Maybe on LinkedIn, Instagram, or a dating app. They were friendly, interesting, and never pushy. Over weeks, you built a real connection — daily messages, phone calls, maybe even video chats.
              </p>
              <p>
                Then one day, almost casually, they mentioned they'd been making serious money trading cryptocurrency. They showed you their account. The numbers looked incredible. They offered to help you get started.
              </p>
              <p>
                You invested a little. It worked. You invested more. It kept working. Then you tried to withdraw — and everything stopped.
              </p>
              <p>
                If this sounds familiar, you may be a victim of a <strong>pig butchering scam</strong> — the most financially devastating form of cryptocurrency fraud in the world today.
              </p>

              {/* Section 1 */}
              <h2 id="what-is">What Is a Pig Butchering Scam?</h2>
              <p>
                The term comes from the Chinese phrase <em>shā zhū pán</em> (杀猪盘) — literally "pig slaughter plate." The name reflects the strategy: scammers "fatten" victims with small early profits and emotional investment before the final "slaughter" — a total theft of everything deposited.
              </p>
              <p>
                These are not quick, opportunistic scams. They are long-duration confidence operations, often lasting weeks or months, run by organized criminal networks primarily based in Southeast Asia.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">$9.3 Billion</p>
                <p className="text-sm text-slate-600">
                  in reported losses from cryptocurrency-related complaints to the FBI's IC3 in 2024 — a 66% increase over the previous year. Investment fraud accounted for $5.8 billion of that total.
                </p>
              </div>

              <p>
                According to TRM's 2026 Crypto Crime Report, approximately $35 billion was sent to fraud schemes in 2025, with pig butchering scams accounting for a significant share.
              </p>

              {/* Section 2 */}
              <h2 id="how-it-works">How Pig Butchering Scams Work: The Full Playbook</h2>

              <h3>Phase 1: The Setup (Weeks 1–4)</h3>
              <p>
                Contact begins innocuously. A message on WhatsApp from a wrong number. A new connection request on LinkedIn. A match on a dating app. The scammer — often operating from a forced labor compound in Cambodia, Myanmar, or Laos — presents as a successful professional, usually Asian-American, often attractive, always charming.
              </p>
              <p>
                There is no mention of money or investment in this phase. The goal is simply to build a relationship. Daily good morning messages. Sharing meals over video. Talking about family, dreams, the future.
              </p>

              <h3>Phase 2: The Introduction (Weeks 4–8)</h3>
              <p>
                After trust is established, the scammer "accidentally" mentions their investment success. They're reluctant to talk about it — they don't want to seem like they're bragging. But you ask. They explain that their uncle works at a crypto firm and taught them a special trading method.
              </p>
              <p>
                They offer to show you — just to help, not for any gain. They walk you through setting up an account on a platform you've never heard of. The platform looks completely professional: real-time charts, customer support chat, slick mobile app.
              </p>
              <p>
                You deposit a small amount. You watch it grow. You withdraw a little — it works, instantly. You're convinced.
              </p>

              <h3>Phase 3: The Fattening (Weeks 8–20)</h3>
              <p>
                Now the investment amounts grow. The scammer encourages you to deposit more — "the market is moving, this is a once-in-a-year opportunity." They deposit their own money alongside yours (fake, of course — it's all on a fraudulent platform they control).
              </p>
              <p>
                Your account shows extraordinary returns. 30%, 50%, 100% gains. You share the screenshots with friends. You feel like you've finally found financial freedom.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">253% Increase</p>
                <p className="text-sm text-slate-600">
                  in average scam payment size from 2024 to 2025 — growing from $782 to $2,764 per transaction as scammers continued to adapt and innovate.
                </p>
              </div>

              <h3>Phase 4: The Slaughter</h3>
              <p>
                When you try to withdraw a significant amount, something goes wrong. There's a "tax hold." A "verification fee." A "compliance deposit" required by regulations. You're told you need to deposit more money to unlock your funds.
              </p>
              <p>
                Some victims pay these fees — sometimes multiple times — before realizing the platform is fraudulent. By the time the scammer disappears, losses often reach six figures.
              </p>
              <p>
                The IRS notes that losses often reach hundreds of thousands of dollars, with some victims losing as much as $2 million.
              </p>

              {/* Section 3 */}
              <h2 id="who-are-scammers">Who Are the Scammers?</h2>
              <p>
                This is not a lone criminal in a basement. Pig butchering is an industrial operation.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">200,000+ People</p>
                <p className="text-sm text-slate-600">
                  estimated by the United Nations to be held in scam compounds across Southeast Asia — many are themselves trafficking victims, forced to perpetrate fraud under threat of violence.
                </p>
              </div>

              <p>
                The people messaging you may themselves be victims — kidnapped or trafficked and forced to run these scams under threat of physical harm. The actual beneficiaries are organized criminal networks operating the compounds.
              </p>
              <p>
                Chainalysis identified persistent connections between cryptocurrency scams and operations based in East and Southeast Asia, with AI being increasingly incorporated into scam operations — including AI-generated deepfake voices and sophisticated social engineering tools.
              </p>

              {/* Section 4 - Warning signs (yellow box) */}
              <h2 id="warning-signs">Warning Signs of a Pig Butchering Scam</h2>

              <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
                  <AlertTriangle size={20} />
                  Red Flags to Watch For
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">How contact is made:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Unsolicited message from an unknown number ("wrong number" that accidentally reaches you)</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Suspiciously attractive stranger connects on LinkedIn or a dating app</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Contact escalates quickly to daily messaging and emotional intimacy</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">The investment pitch:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> They mention crypto profits casually, not as a sales pitch</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> They offer to "help" you — not sell you anything</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> The platform they recommend is one you've never heard of</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Early small withdrawals work perfectly (by design)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Red flags on the platform:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Cannot be found on app stores — requires downloading from a link</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Customer support only via chat, never phone</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Withdrawal requires additional deposits ("tax," "compliance fee")</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> Profits seem impossibly high with no explanation of risk</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">The relationship:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> They refuse video calls or use pre-recorded video (deepfakes)</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> They avoid meeting in person despite strong emotional connection</li>
                    <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> They become pushy when you hesitate to invest more</li>
                  </ul>
                </div>
              </div>

              {/* Section 5 - What to do (green box) */}
              <h2 id="what-to-do">What To Do If You've Been Scammed</h2>

              <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
                  <CheckCircle2 size={20} />
                  Action Steps for Victims
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                      Stop All Transfers Immediately
                    </p>
                    <p className="text-sm text-slate-600 ml-8">Do not send any more money, regardless of what you're told. Any "fee to unlock funds" is another layer of the scam. There are no legitimate fees that require victims to deposit more cryptocurrency.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                      Preserve All Evidence
                    </p>
                    <p className="text-sm text-slate-600 ml-8">Screenshot everything before the scammer disappears: all chat conversations (WhatsApp, Telegram, WeChat, Line), the fraudulent platform URL and your account screenshots, all transaction records and wallet addresses, the scammer's profile photos and contact information.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                      Report to Authorities
                    </p>
                    <div className="text-sm text-slate-600 ml-8 space-y-1">
                      <p><strong>FBI IC3:</strong> ic3.gov — file a detailed complaint with all transaction information</p>
                      <p><strong>FTC:</strong> reportfraud.ftc.gov</p>
                      <p><strong>Your state attorney general's office</strong></p>
                    </div>
                  </div>

                  <div className="not-prose ml-8 my-4 bg-white border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-700 font-semibold mb-1">FBI Operation Level Up</p>
                    <p className="text-xs text-slate-600">Has notified over 8,103 victims of cryptocurrency investment fraud, with 77% unaware they were being scammed. Estimated savings: over $511 million from early intervention.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                      Get a Blockchain Forensic Investigation
                    </p>
                    <div className="text-sm text-slate-600 ml-8 space-y-2">
                      <p>This is where professional help makes a real difference. Every cryptocurrency transaction is permanently recorded on the blockchain — including yours. A certified investigator can:</p>
                      <ul className="space-y-1">
                        <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Trace exactly where your funds went after you sent them</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identify which exchanges received the stolen cryptocurrency</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Build a court-ready forensic report documenting the complete fund flow</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Identify subpoena targets (KYC-compliant exchanges)</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Support law enforcement and your attorney with actionable intelligence</li>
                      </ul>
                      <p className="font-semibold text-slate-700 mt-2">The sooner this is done, the better. Funds that reach an exchange can potentially be frozen — but only if identified and reported quickly.</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
                      Consult an Attorney
                    </p>
                    <div className="text-sm text-slate-600 ml-8 space-y-1">
                      <p>A lawyer experienced in cryptocurrency fraud can:</p>
                      <p>• File emergency freezing injunctions against identified exchanges</p>
                      <p>• Pursue civil forfeiture proceedings against seized funds</p>
                      <p>• Connect you with relevant DOJ forfeiture proceedings if applicable</p>
                    </div>
                  </div>
                </div>
              </div>

              <p>
                In one notable case, the U.S. Attorney's Office in Massachusetts filed a civil forfeiture action to recover approximately $2.3 million in cryptocurrency traced to a pig butchering scheme targeting a local resident.
              </p>

              {/* Mid-article CTA */}
              <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
                <h3 className="font-display font-bold text-xl text-white mb-2">Think you may be a victim?</h3>
                <p className="text-brand-100 text-sm mb-5">Get a free, confidential case evaluation within 24 hours. No obligation, no upfront cost.</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
                >
                  Get Free Case Evaluation <ArrowRight size={14} />
                </Link>
              </div>

              {/* Section 6 */}
              <h2 id="recovery">Can You Get Your Money Back?</h2>
              <p>
                This is the question every victim asks. The honest answer: it depends on several factors.
              </p>

              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Increases Recovery Chances</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li>• Reporting quickly (within days or weeks)</li>
                    <li>• Having wallet addresses and transaction hashes</li>
                    <li>• Funds ending at a KYC-compliant exchange</li>
                    <li>• Coordinated forensic + legal action</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Reduces Recovery Chances</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li>• Funds passed through a mixer or privacy coin</li>
                    <li>• Significant time elapsed since theft</li>
                    <li>• Funds moved to unregulated exchanges</li>
                    <li>• No documentation of transactions</li>
                  </ul>
                </div>
              </div>

              <p>
                Even when full recovery isn't possible, a forensic investigation provides documentation for tax purposes (theft loss deductions), evidence for law enforcement criminal proceedings, and contribution to DOJ forfeiture pools that distribute to victims.
              </p>

              {/* Section 7 */}
              <h2 id="law-enforcement">Law Enforcement Is Getting Better at This</h2>

              <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">$400 Million+</p>
                <p className="text-sm text-slate-600">
                  in cryptocurrency already seized by the DOJ's Scam Center Strike Force, established in November 2025, specifically focused on investigating and prosecuting Southeast Asian scam center operations.
                </p>
              </div>

              <p>
                DOJ seized $61 million in USDT tied to pig butchering scams in North Carolina — demonstrating that despite laundering attempts across wallets and blockchains, investigators can trace transactions and identify consolidation wallets holding victim funds.
              </p>
              <p>
                The tools available to investigators — and the cooperation between blockchain analytics firms and law enforcement — are improving rapidly. Victims who properly document and report their cases contribute to larger enforcement actions that benefit the entire victim community.
              </p>

              {/* Section 8 */}
              <h2 id="getting-help">Getting Help</h2>
              <p>
                If you or someone you know has been affected by a pig butchering scam, do not wait. The blockchain trail gets harder to follow with time, and exchanges have limited windows for emergency freezes.
              </p>

              <p>
                <strong>LedgerHound</strong> provides certified blockchain forensic investigations for victims of cryptocurrency fraud. Our team:
              </p>
              <ul>
                <li>Traces stolen funds across all major blockchains</li>
                <li>Identifies exchanges and entities that received your funds</li>
                <li>Delivers court-ready forensic reports for attorneys and law enforcement</li>
                <li>Works with Russian-speaking clients directly — no translators needed</li>
                <li>Provides a free, confidential case evaluation within 24 hours</li>
              </ul>
    </>
  );
}
