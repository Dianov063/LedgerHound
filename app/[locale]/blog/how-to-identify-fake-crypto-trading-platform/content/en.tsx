import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ContentEn({ base }: { base: string }) {
  return (
    <>
              {/* Intro */}
              <p className="text-lg text-slate-700 leading-relaxed">
                You found a crypto trading platform through someone you met online. The interface looks professional. Your account shows impressive returns. You've even made a small withdrawal that worked perfectly.
              </p>
              <p>
                Then you try to take out your real profits — and everything stops.
              </p>
              <p>
                This is the defining moment of one of the most sophisticated financial frauds of our era. Fake cryptocurrency exchanges have become one of the most effective tools used by organized fraud networks. These platforms are designed to look legitimate, often mimicking real exchanges and displaying fabricated account balances to create the illusion of active trading and consistent profits.
              </p>
              <p>
                In 2026, these platforms are more convincing than ever — and the stakes have never been higher.
              </p>

              {/* Scale */}
              <h2 id="scale">The Scale of the Problem</h2>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">$17 Billion</p>
                <p className="text-sm text-slate-600">
                  in crypto scam losses in 2025, with AI-driven impersonation and social engineering scams increasing by 1,400% year-on-year.
                </p>
              </div>

              <p>
                According to TRM's 2026 Crypto Crime Report, approximately $35 billion was sent to fraud schemes in 2025, with pig butchering scams accounting for a significant share.
              </p>
              <p>
                Fake trading platforms are at the center of most of these losses. They are not crude, obvious scams — they are sophisticated software products built by organized criminal networks specifically to deceive.
              </p>

              {/* How they work */}
              <h2 id="how-they-work">How Fake Platforms Work</h2>
              <p>
                Understanding the mechanics helps you recognize them before it's too late.
              </p>

              <h3>Step 1: The Introduction</h3>
              <p>
                These schemes are highly coordinated and typically begin with unsolicited contact through text messages, social media, or dating applications. Over time, scammers build trust and gradually introduce cryptocurrency investment opportunities that appear credible and low risk.
              </p>
              <p>
                The platform is never the first thing they show you. The relationship comes first — sometimes weeks or months of daily conversation, shared interests, and emotional connection.
              </p>

              <h3>Step 2: The Platform Demo</h3>
              <p>
                Once trust is established, your contact offers to show you how they invest. They guide you to a specific platform — one you've never heard of, accessed through a link they send you or an app downloaded outside official app stores.
              </p>
              <p>
                Victims are often guided step-by-step to "learn" crypto investing through fake trading apps, cloned exchange websites, or demo accounts that show fabricated gains.
              </p>

              <h3>Step 3: The Proof</h3>
              <p>
                You deposit a small amount. You watch it grow. You withdraw a small amount — and it works. This is by design.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">By Design</p>
                <p className="text-sm text-slate-600">
                  Account balances increase, trades appear to execute, and small withdrawals are permitted to reinforce the illusion of legitimacy. As confidence builds, victims are encouraged to invest larger amounts.
                </p>
              </div>

              <h3>Step 4: The Trap</h3>
              <p>
                When you attempt a significant withdrawal, the platform generates an obstacle. A tax hold. A compliance verification. A "liquidity fee." When victims try to withdraw, the platform adds friction, demanding extra payments framed as taxes, compliance checks, upgrades, or verification fees — keeping the victim paying while the funds are routed away.
              </p>

              <h3>Step 5: The Exit</h3>
              <p>
                Once they've extracted maximum funds, the platform disappears — along with your contact, their profile, and every way to reach them.
              </p>

              {/* Mid-article CTA */}
              <div className="not-prose my-10 bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-brand-600 mb-2" size={24} />
                <p className="font-display font-bold text-brand-800 mb-1">Think you may be dealing with a fake platform?</p>
                <p className="text-sm text-brand-600 mb-4">Get a free, confidential case evaluation within 24 hours. No obligation, no upfront cost.</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Get Free Case Evaluation <ArrowRight size={14} />
                </Link>
              </div>

              {/* 10 Warning Signs */}
              <h2 id="warning-signs">10 Warning Signs of a Fake Crypto Trading Platform</h2>

              <h3>1. You Were Directed There by Someone You Met Online</h3>
              <p>
                Legitimate platforms don't need someone to personally recruit you. If a person you met online — especially someone who seemed unusually interested in your financial situation — directed you to a specific platform, treat this as a serious red flag.
              </p>

              <h3>2. The App Isn't in Official App Stores</h3>
              <p>
                Real exchanges like Coinbase, Kraken, and Binance are available on the Apple App Store and Google Play with thousands of verified reviews. Fake platforms typically require you to:
              </p>
              <ul>
                <li>Download an APK file directly from a link</li>
                <li>Use a web browser app with no app store listing</li>
                <li>Install a "special version" for better returns</li>
              </ul>

              <h3>3. The URL Looks Almost Right</h3>
              <p>
                Fraudsters register domains that closely mimic legitimate exchanges. Common tactics include:
              </p>
              <ul>
                <li>Adding words: <code>coinbase-pro-trading.com</code></li>
                <li>Changing endings: <code>binance.cc</code> instead of <code>binance.com</code></li>
                <li>Using hyphens: <code>kraken-exchange.net</code></li>
              </ul>
              <p>
                Always verify the exact URL against the official website. Bookmark legitimate exchanges directly.
              </p>

              <h3>4. Returns Are Guaranteed or Consistently High</h3>
              <p>
                No legitimate investment guarantees returns. When you hear about "guaranteed" returns on crypto, you are probably dealing with an untrustworthy individual or business, according to the Federal Trade Commission.
              </p>
              <p>
                Fake platforms typically show returns of 10–40% monthly — figures that would be impossible to sustain in real markets.
              </p>

              <h3>5. Withdrawals Require Additional Payments</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">The #1 Indicator of a Scam</p>
                <p className="text-sm text-red-700">
                  Demands for extra "fees" or "verification payments" never result in account access. Each payment leads to new excuses, increasing losses as victims try to recover their deposits.
                </p>
              </div>

              <p>
                Legitimate exchanges <strong>never</strong> require you to deposit more money to withdraw your existing funds. If you encounter any of these:
              </p>
              <ul>
                <li>"Tax payment required to release funds"</li>
                <li>"Compliance verification fee"</li>
                <li>"Liquidity deposit to process withdrawal"</li>
                <li>"Anti-money laundering clearance fee"</li>
              </ul>
              <p>
                <strong>You are being scammed. Stop all payments immediately.</strong>
              </p>

              <h3>6. Customer Support Only via Chat</h3>
              <p>
                Fake platforms typically have no phone number, no physical address, no verifiable company registration — support only through in-platform chat or Telegram. Real exchanges have verifiable corporate registration, published addresses, and multiple contact channels.
              </p>

              <h3>7. The Platform Can't Be Found in Industry Databases</h3>
              <p>
                Check the platform against:
              </p>
              <ul>
                <li><strong>CoinGecko</strong> and <strong>CoinMarketCap</strong> — legitimate exchanges are listed</li>
                <li><strong>DFPI Scam Tracker</strong> (California Department of Financial Protection)</li>
                <li><strong>FCA Register</strong> (UK Financial Conduct Authority)</li>
                <li><strong>FINRA BrokerCheck</strong> (US)</li>
              </ul>
              <p>
                If the platform doesn't appear in any regulatory database, it is not a registered financial service.
              </p>

              <h3>8. AI-Generated Profiles and Deepfakes</h3>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">4.5x More Money</p>
                <p className="text-sm text-slate-600">
                  extracted per operation by AI-enabled scams compared to traditional scams. In 2026, the person who introduced you to the platform may not be human at all.
                </p>
              </div>

              <p>
                Warning signs of AI-generated personas:
              </p>
              <ul>
                <li>Profile photos that look slightly unnatural (AI-generated faces)</li>
                <li>Video calls that are pre-recorded or use deepfake technology</li>
                <li>Scripted conversation that feels slightly off</li>
                <li>Refusal to do spontaneous live video</li>
              </ul>

              <h3>9. Pressure to Invest More</h3>
              <p>
                Legitimate investment advisors don't pressure you. Fake platform operators create urgency:
              </p>
              <ul>
                <li>"This trading window closes in 48 hours"</li>
                <li>"You'll miss the bull run if you don't add funds now"</li>
                <li>"I'm putting in $50,000 — you should too"</li>
              </ul>
              <p>
                This psychological pressure is engineered to override your rational judgment.
              </p>

              <h3>10. No Traceable Transaction History</h3>
              <p>
                When you send cryptocurrency to a fake platform, it leaves immediately. On a real exchange, your funds remain in your account.
              </p>
              <p>
                You can verify this: use our free <Link href={`${base}/wallet-tracker`} className="text-brand-600 font-semibold hover:underline">Wallet Tracker</Link> to check the destination address. If funds transferred to the platform's wallet immediately moved to other addresses rather than staying in a platform reserve, you're dealing with a scam.
              </p>

              {/* Technical Red Flags */}
              <h2 id="technical-red-flags">Technical Red Flags</h2>
              <p>
                For those comfortable with blockchain analysis:
              </p>
              <p>
                <strong>Check the wallet address on-chain.</strong> Legitimate exchanges maintain large reserve wallets with thousands of transactions over years. Scam wallets typically:
              </p>
              <ul>
                <li>Were created recently (days or weeks ago)</li>
                <li>Show a pattern of receiving funds and immediately forwarding them</li>
                <li>Have no long-term transaction history</li>
              </ul>
              <p>
                <strong>Use our free <Link href={`${base}/scam-checker`} className="text-brand-600 font-semibold hover:underline">Scam Checker</Link>.</strong> We maintain a database of known fraudulent addresses cross-referenced with Chainabuse reports and OFAC sanctions lists.
              </p>
              <p>
                <strong>Look for exchange identification.</strong> Run the destination address through our <Link href={`${base}/graph-tracer`} className="text-brand-600 font-semibold hover:underline">Graph Tracer</Link>. If funds immediately flow to privacy mixers or unregulated offshore exchanges rather than major KYC-compliant platforms, it's a strong indicator of fraud.
              </p>

              {/* Real Case */}
              <h2 id="real-case">Real Case: Georgia Man Loses $164,000</h2>
              <p>
                A Georgia man met a woman calling herself "Hnin Phyu" on Facebook in June 2025. She quickly moved their conversation to Telegram and introduced him to cryptocurrency investing. He trusted her and followed her instructions to set up accounts on Crypto.com and a digital wallet service before transferring his money to a fake trading website that displayed fabricated profits.
              </p>
              <p>
                When he tried to withdraw his money, scammers told him he owed an additional $50,000 in taxes and fees to release his funds. Total losses exceeded $164,000.
              </p>
              <p>
                The FBI's <strong>Operation Silent Freeze</strong>, launched October 2025, is specifically targeting cryptocurrency fraud schemes — but prevention remains far more effective than recovery.
              </p>

              {/* If already sent money */}
              <h2 id="already-sent">If You've Already Sent Money</h2>

              <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-xl font-display font-bold text-red-900 mb-2">Stop Immediately</p>
                <p className="text-sm text-red-700">
                  Do not send any additional funds regardless of what you're told. Every additional payment goes directly to the scammers.
                </p>
              </div>

              <p>
                <strong>Preserve all evidence:</strong>
              </p>
              <ul>
                <li>Screenshots of the platform and your account balance</li>
                <li>All chat conversations with the person who introduced you</li>
                <li>Transaction records and wallet addresses</li>
                <li>The platform URL and any account credentials</li>
              </ul>

              <p>
                <strong>Report immediately:</strong>
              </p>
              <ul>
                <li>FBI IC3 at <strong>ic3.gov</strong> (include all wallet addresses)</li>
                <li>FTC at <strong>reportfraud.ftc.gov</strong></li>
                <li>Your state attorney general</li>
              </ul>

              <p>
                <strong>Get a blockchain forensic investigation.</strong> Data shows that freezing assets has acted as the best step in helping to stop losses. In many cases where the funds were still under the control of the attacker's wallet, about 75% of the assets were successfully frozen.
              </p>
              <p>
                Time is critical. Every hour that passes, funds move further through the blockchain and become harder to trace and freeze.
              </p>

              {/* Getting Help */}
              <h2 id="getting-help">Getting Help</h2>
              <p>
                If you've been victimized by a fake trading platform, <strong>LedgerHound</strong> provides certified blockchain forensic investigations.
              </p>

              <div className="not-prose my-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="font-display font-bold text-slate-900 mb-4">We will:</p>
                <div className="space-y-3">
                  {[
                    'Trace your funds across all major blockchains',
                    'Identify which exchanges received the stolen cryptocurrency',
                    'Build a court-ready forensic report documenting the complete fund flow',
                    'Support your attorney\'s subpoena process',
                    'Provide consultations in Russian, English, Spanish, Chinese, French, and Arabic',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p>
                <Link href={`${base}/free-evaluation`} className="text-brand-600 font-bold hover:underline">
                  Get Your Free Case Evaluation →
                </Link>
              </p>
              <p>
                Free. Confidential. No obligation. Response within 24 hours.
              </p>
    </>
  );
}
