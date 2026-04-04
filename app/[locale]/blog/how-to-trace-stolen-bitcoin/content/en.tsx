import Link from 'next/link';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function ContentEn({ base }: { base: string }) {
  return (
    <>
              {/* Intro */}
              <p className="text-lg text-slate-700 leading-relaxed">
                You sent cryptocurrency to what you believed was a legitimate investment platform, exchange, or contact — and now it's gone. Your first question is probably: <em>Can crypto even be traced?</em>
              </p>
              <p>
                The answer, in most cases, is yes.
              </p>
              <p>
                Despite the common perception that cryptocurrency is anonymous and untraceable, the opposite is true for most major blockchains. Every Bitcoin transaction, every Ethereum transfer, every USDT movement — all of it is permanently recorded in a public ledger that anyone in the world can read. Including investigators.
              </p>
              <p>
                This guide explains exactly how cryptocurrency tracing works, what investigators do step by step, and what you can do right now to maximize your chances of recovery.
              </p>

              {/* Section 1 */}
              <h2 id="blockchain-transparency">The Fundamental Truth About Blockchain Transparency</h2>
              <p>
                Bitcoin and most major cryptocurrencies are <strong>pseudonymous, not anonymous</strong>. This is a critical distinction.
              </p>
              <p>
                Your wallet address does not contain your name. But every single transaction you make — to whom, how much, when — is permanently written to a public blockchain that cannot be altered or deleted.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">Pseudonymous, Not Anonymous</p>
                <p className="text-sm text-slate-600">
                  Despite early perceptions of anonymity, most cryptocurrency transactions can be traced using blockchain analytics. Every transfer of value is recorded permanently on public ledgers such as Bitcoin or Ethereum.
                </p>
              </div>

              <p>
                This radical transparency has transformed financial investigations. The challenge is not whether transactions can be seen — it's interpreting what those transactions mean, and connecting pseudonymous addresses to real-world identities.
              </p>

              {/* Section 2 */}
              <h2 id="whats-visible">What Information Is Visible on the Blockchain</h2>
              <p>
                When you send cryptocurrency, the following information is permanently recorded:
              </p>

              {/* Info box */}
              <div className="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-blue-700 font-display font-bold text-lg">
                  <Shield size={20} />
                  What the Blockchain Records
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Always visible:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Sending wallet address</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Receiving wallet address</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Amount transferred</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Date and time (exact block timestamp)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Transaction hash (unique ID)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> Network fees paid</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Sometimes recoverable:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> IP address of the sender (captured by network nodes at broadcast time)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Geographic location data (from IP)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> Connection to other addresses controlled by the same person</li>
                  </ul>
                </div>
              </div>

              <p>
                This means that from a single wallet address or transaction hash, an investigator can reconstruct the complete history of where funds came from and where they went.
              </p>

              {/* Section 3 */}
              <h2 id="how-tracing-works">Step-by-Step: How Crypto Tracing Actually Works</h2>

              <h3>Step 1: Intake — Gathering the Starting Evidence</h3>
              <p>
                Every investigation begins with what the victim can provide:
              </p>
              <ul>
                <li><strong>Transaction hash</strong> — the unique ID of your payment (looks like <code>0x7f3a...</code>)</li>
                <li><strong>Wallet address</strong> — the address you sent funds to</li>
                <li><strong>Platform name</strong> — the scam website or app</li>
                <li><strong>Dates and amounts</strong> — when each transfer was made</li>
                <li><strong>Screenshots</strong> — of the platform, communications, your account</li>
              </ul>
              <p>
                Even if you only have one of these, a trace can usually begin. In most cases, a single wallet address or transaction hash is enough to get started.
              </p>

              <h3>Step 2: Transaction Mapping</h3>
              <p>
                The investigator loads the starting address into a blockchain intelligence platform (Chainalysis Reactor, TRM Labs, Elliptic, or similar) and begins mapping every transaction connected to that address.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">Visual Fund Flow Mapping</p>
                <p className="text-sm text-slate-600">
                  Transactional data is converted into visual maps and flowcharts, showing interactions by the subject with known exchanges and other entities, tracing financial transfers to their ultimate endpoints. Visual mapping makes it much easier to recognize patterns, such as layering and peel chains, commonly used for money laundering.
                </p>
              </div>

              <p>
                This creates a visual graph — exactly like our free Graph Tracer tool — showing the flow of funds across multiple wallets.
              </p>

              <h3>Step 3: Cluster Analysis</h3>
              <p>
                One address is rarely the complete picture. Criminals use multiple wallets to obscure the trail. Cluster analysis groups addresses that are likely controlled by the same person.
              </p>
              <p>
                A cluster is a group of cryptocurrency addresses that are controlled by the same person or entity. Expanding the focus of an investigation from one address to a larger cluster can dramatically increase the amount of available evidence for de-anonymization and asset tracing.
              </p>
              <p>
                Common clustering techniques include:
              </p>
              <ul>
                <li><strong>Common spend analysis</strong> — multiple addresses used in the same transaction</li>
                <li><strong>Address reuse</strong> — the same address used repeatedly</li>
                <li><strong>Timing analysis</strong> — transactions occurring in patterns</li>
              </ul>

              <h3>Step 4: Exchange Identification — The Critical Breakthrough</h3>
              <p>
                This is where investigations become actionable. When stolen funds reach a <strong>KYC-compliant exchange</strong> (Coinbase, Binance, Kraken, OKX, etc.), the exchange has legally required identity verification on file for the account owner.
              </p>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">The Subpoena Gateway</p>
                <p className="text-sm text-slate-600">
                  Blockchain intelligence tools identify transactions with exchanges such as Coinbase and Binance. Subpoenas on KYC/AML-compliant entities request production of identity documents on the Bitcoin owner — turning pseudonymous addresses into real-world identities.
                </p>
              </div>

              <p>
                Once investigators identify which exchange received the funds, an attorney can file a subpoena — compelling the exchange to reveal the account holder's name, address, ID documents, and banking information.
              </p>

              <h3>Step 5: Attribution Analysis</h3>
              <p>
                Professional blockchain intelligence platforms maintain databases of millions of labeled wallet addresses — exchanges, mixers, DeFi protocols, known criminal entities, and flagged addresses.
              </p>
              <p>
                Blockchain forensic professionals use a mix of open-source, commercial, and proprietary tools. The foundation of any forensic work is the blockchain explorer. Advanced forensic explorers include additional metadata: wallet tags (e.g., "Binance Hot Wallet," "Flagged Mixer"), risk scores based on known fraud associations.
              </p>
              <p>
                When stolen funds touch one of these labeled addresses, investigators can immediately identify the entity involved.
              </p>

              <h3>Step 6: IP Address Intelligence</h3>
              <p>
                This is a lesser-known but powerful tracing method. When a transaction is broadcast to the blockchain network, the sending computer's IP address may be captured by surveillance nodes operated by blockchain intelligence companies.
              </p>
              <p>
                Privacy-piercing metadata is collected through blockchain surveillance systems, which run networks of nodes that "listen" and "sniff" for Internet Protocol (IP) addresses associated with certain transactions. IP addresses, when available, may provide information regarding the geographical location of the subject at the time of the transaction.
              </p>
              <p>
                This can place the scammer in a specific city or country — critical intelligence for international law enforcement coordination.
              </p>

              <h3>Step 7: Forensic Report</h3>
              <p>
                Everything is compiled into a court-ready forensic report containing:
              </p>
              <ul>
                <li>Complete transaction map from victim to final destination</li>
                <li>All identified wallet addresses</li>
                <li>Exchange identification with subpoena recommendations</li>
                <li>Risk scoring and entity attribution</li>
                <li>Investigator certification and methodology documentation</li>
              </ul>

              {/* Section 4 */}
              <h2 id="obfuscation-techniques">Common Obfuscation Techniques — And How Investigators Beat Them</h2>
              <p>
                Scammers know investigators exist. They use techniques to hide the trail. Here's what they try — and how forensics counters it.
              </p>

              <h3>Mixers and Tumblers (e.g., Tornado Cash)</h3>
              <p>
                <strong>What they do:</strong> Pool cryptocurrency from multiple sources and redistribute equivalent amounts, breaking the transaction trail.
              </p>
              <p>
                <strong>How investigators respond:</strong> Modern demixing techniques analyze the timing, amounts, and patterns of mixer inputs and outputs to probabilistically trace funds through the service. Crystal Expert's automatic demixing analyzes mixer inputs and outputs to surface up to five candidate paths from the mixing service onward.
              </p>
              <p>
                Additionally, Tornado Cash was sanctioned by OFAC in 2022 — any exchange that receives funds from Tornado Cash is required to freeze them under US sanctions law.
              </p>

              <h3>Chain Hopping (Cross-Chain Transfers)</h3>
              <p>
                <strong>What they do:</strong> Convert Bitcoin to Ethereum to USDT to BNB — hopping between blockchains to confuse investigators.
              </p>
              <p>
                <strong>How investigators respond:</strong> Modern tools trace across chains automatically. Blockchain intelligence platforms like TRM Labs can follow the flow of funds, detect suspicious behavior, and link activity to real-world actors — especially when combined with off-chain intelligence.
              </p>

              <h3>Peel Chains</h3>
              <p>
                <strong>What they do:</strong> Send funds through a long chain of wallets, each passing most of the funds to the next and keeping a small amount — like peeling an onion.
              </p>
              <p>
                <strong>How investigators respond:</strong> Automated transaction mapping tools follow peel chains automatically, no matter how many hops. The pattern itself is a red flag that makes the funds easier to identify.
              </p>

              <h3>Privacy Coins (Monero)</h3>
              <p>
                <strong>What they do:</strong> Use Monero (XMR), which has built-in privacy features that obscure transaction details.
              </p>
              <p>
                <strong>How investigators respond:</strong> This is the most difficult scenario. Pure Monero transactions are extremely difficult to trace. However, most scammers eventually convert to Bitcoin or stablecoins to cash out — and that conversion point is traceable.
              </p>

              {/* Mid-article CTA */}
              <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
                <h3 className="font-display font-bold text-xl text-white mb-2">Lost crypto? The blockchain remembers.</h3>
                <p className="text-brand-100 text-sm mb-5">Get a free, confidential case evaluation within 24 hours. No obligation, no upfront cost.</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
                >
                  Get Free Case Evaluation <ArrowRight size={14} />
                </Link>
              </div>

              {/* Section 5 */}
              <h2 id="what-you-need">What You Need to Start a Trace</h2>
              <p>
                You do not need all of this — but the more you have, the faster and more complete the investigation:
              </p>

              {/* Checklist box */}
              <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
                  <CheckCircle2 size={20} />
                  Investigation Checklist
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Essential (at least one):</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Wallet address you sent funds to</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Transaction hash / TX ID</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Name of the platform or exchange you used</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Helpful:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Dates and exact amounts of each transfer</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Screenshots of your account on the platform</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Communications with the scammer</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Platform URL and any registration details</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Bonus:</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Any name, phone, or email the scammer provided</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Social media profiles used in the scam</li>
                  </ul>
                </div>
              </div>

              {/* Section 6 */}
              <h2 id="how-long">How Long Does Tracing Take?</h2>

              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="font-bold text-slate-800 text-sm mb-1">Basic Trace</p>
                  <p className="text-xs text-slate-500 mb-2">Single blockchain, clear trail</p>
                  <p className="text-2xl font-display font-bold text-brand-600">24-48 Hours</p>
                  <p className="text-xs text-slate-500 mt-1">for initial report</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="font-bold text-slate-800 text-sm mb-1">Full Investigation</p>
                  <p className="text-xs text-slate-500 mb-2">Multi-chain, complex routing</p>
                  <p className="text-2xl font-display font-bold text-brand-600">3-7 Days</p>
                  <p className="text-xs text-slate-500 mt-1">business days</p>
                </div>
              </div>

              {/* Pull quote */}
              <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <p className="text-2xl font-display font-bold text-slate-900 mb-2">Time Is Critical</p>
                <p className="text-sm text-slate-600">
                  Acting within the first 72 hours dramatically increases your recovery chances. The sooner a trace begins, the higher the chance of finding funds before they're fully liquidated, reaching exchanges while accounts are still active, and filing emergency freeze requests.
                </p>
              </div>

              {/* Section 7 */}
              <h2 id="free-tools">Free Tools You Can Use Right Now</h2>
              <p>
                Before engaging a professional investigator, you can start gathering information yourself using free tools:
              </p>

              <h3>Blockchain Explorers</h3>
              <ul>
                <li><strong>Etherscan.io</strong> — Ethereum, ERC-20 tokens, NFTs</li>
                <li><strong>Blockchain.com</strong> — Bitcoin</li>
                <li><strong>BscScan.com</strong> — BNB Chain</li>
                <li><strong>Tronscan.org</strong> — Tron/USDT</li>
              </ul>
              <p>
                Enter any wallet address or transaction hash to see the complete transaction history.
              </p>

              <h3>LedgerHound Free Tools</h3>
              <ul>
                <li><strong><Link href={`${base}/tracker`} className="text-brand-600 hover:text-brand-700">Wallet Tracker</Link></strong> — Enter any Ethereum address and see the complete transaction history with analytics</li>
                <li><strong><Link href={`${base}/graph-tracer`} className="text-brand-600 hover:text-brand-700">Graph Tracer</Link></strong> — Visualize the flow of funds as an interactive graph, identify known exchanges</li>
              </ul>
              <p>
                These tools show you the same on-chain data that professional investigators start with — though professional-grade tracing requires proprietary attribution databases and certified methodology for legal use.
              </p>

              {/* Section 8 */}
              <h2 id="when-to-hire">When Professional Investigation Makes Sense</h2>
              <p>
                Free tools are a starting point. Professional blockchain forensics is necessary when:
              </p>
              <ul>
                <li><strong>You need legal-grade evidence</strong> — courts require certified methodology, not screenshots</li>
                <li><strong>Funds have been mixed or chain-hopped</strong> — requires specialized demixing tools</li>
                <li><strong>You need to subpoena an exchange</strong> — attorneys need a forensic report identifying the target</li>
                <li><strong>Law enforcement is involved</strong> — professional reports carry authority that DIY analysis doesn't</li>
                <li><strong>The amount is significant</strong> — if you lost $10,000 or more, professional investigation typically pays for itself</li>
              </ul>

              {/* Section 9 */}
              <h2 id="what-happens-after">What Happens After the Trace</h2>
              <p>
                A successful forensic trace identifies <em>where</em> funds went. Recovery requires legal action:
              </p>

              <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
                  <CheckCircle2 size={20} />
                  Recovery Steps After a Trace
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                      Exchange Subpoena
                    </p>
                    <p className="text-sm text-slate-600 ml-8">Your attorney subpoenas the identified exchange for account holder information. Most major exchanges comply within 2-4 weeks.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                      Emergency Freeze Request
                    </p>
                    <p className="text-sm text-slate-600 ml-8">Many exchanges will voluntarily freeze accounts when presented with a professional forensic report and law enforcement referral, before a formal subpoena.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                      Civil Litigation
                    </p>
                    <p className="text-sm text-slate-600 ml-8">With the account holder identified, civil claims can be filed for fraud, conversion, and unjust enrichment.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                      Law Enforcement Referral
                    </p>
                    <p className="text-sm text-slate-600 ml-8">FBI IC3 and state authorities act on forensic reports. Significant cases may qualify for the FBI's Recovery Asset Team (RAT), which has emergency asset freeze authority.</p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
                      DOJ Forfeiture Proceedings
                    </p>
                    <p className="text-sm text-slate-600 ml-8">In cases connected to organized crime, DOJ forfeiture proceedings can result in funds being distributed to victims.</p>
                  </div>
                </div>
              </div>

              {/* Getting Help */}
              <h2>Start Your Trace Today</h2>
              <p>
                <strong>LedgerHound</strong> provides certified blockchain forensic investigations for victims of cryptocurrency theft and fraud. Our team:
              </p>
              <ul>
                <li>Traces stolen funds across all major blockchains</li>
                <li>Identifies exchanges and entities that received your funds</li>
                <li>Delivers court-ready forensic reports within 48-72 hours</li>
                <li>Supports attorney subpoena process and law enforcement referrals</li>
                <li>Conducts consultations in Russian, English, Spanish, Chinese, French, and Arabic</li>
              </ul>
    </>
  );
}
