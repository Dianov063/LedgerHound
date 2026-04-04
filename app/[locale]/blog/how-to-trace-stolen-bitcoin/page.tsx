'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  Clock,
  Calendar,
  User,
  Tag,
  ChevronRight,
  Share2,
  Link2,
  Check,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { blogUI, type BlogLocale } from '@/lib/blog-translations';

const tocItems = [
  { id: 'blockchain-transparency', label: 'Blockchain Transparency' },
  { id: 'whats-visible', label: "What's Visible on the Blockchain" },
  { id: 'how-tracing-works', label: 'How Crypto Tracing Works' },
  { id: 'obfuscation-techniques', label: 'Obfuscation Techniques' },
  { id: 'what-you-need', label: 'What You Need to Start' },
  { id: 'how-long', label: 'How Long Does It Take' },
  { id: 'free-tools', label: 'Free Tools' },
  { id: 'when-to-hire', label: 'When to Hire a Professional' },
  { id: 'what-happens-after', label: 'What Happens After' },
];

const relatedPosts = [
  {
    slug: 'pig-butchering-scam-recovery',
    title: 'Pig Butchering Scams in 2026: What They Are, How They Work, and What To Do',
    category: 'Guide',
    readTime: '9 min read',
  },
  {
    slug: 'crypto-divorce-hidden-assets',
    title: 'Crypto in Divorce: How to Find Hidden Digital Assets',
    category: 'Guide',
    readTime: '8 min read',
  },
  {
    slug: 'blockchain-evidence-court',
    title: 'Blockchain Evidence in Court: What Judges and Attorneys Need to Know',
    category: 'Legal',
    readTime: '7 min read',
  },
];

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function HowToTraceStolenBitcoinArticle() {
  const locale = useLocale() as BlogLocale;
  const base = locale === 'en' ? '' : `/${locale}`;
  const ui = blogUI[locale] || blogUI.en;
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = 'How to Trace Stolen Bitcoin and Cryptocurrency: A Step-by-Step Guide (2026)';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href={base || '/'} className="hover:text-brand-600 transition-colors">{ui.home}</Link>
            <ChevronRight size={12} />
            <Link href={`${base}/blog`} className="hover:text-brand-600 transition-colors">{ui.blog}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600">How to Trace Stolen Bitcoin</span>
          </nav>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
              Guide
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={11} /> 10 {ui.minRead}
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-[2.75rem] lg:leading-tight text-slate-900 mb-5">
            How to Trace Stolen Bitcoin and Cryptocurrency: A Step-by-Step Guide
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User size={14} /> {ui.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> March 28, 2026
            </span>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2 mt-6">
            <span className="text-xs text-slate-400 mr-1">{ui.shareArticle}:</span>
            <button onClick={shareTwitter} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              X Twitter
            </button>
            <button onClick={shareLinkedIn} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              in LinkedIn
            </button>
            <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              {copied ? <><Check size={12} className="text-emerald-500" /> {ui.copied}</> : <><Link2 size={12} /> {ui.copyLink}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Content with sidebar TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sticky TOC - desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{ui.tableOfContents}</p>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-slate-500 hover:text-brand-600 py-1.5 border-l-2 border-transparent hover:border-brand-500 pl-3 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-xs font-bold text-brand-700 mb-2">{ui.needHelp}</p>
                <p className="text-xs text-brand-600 mb-3">{ui.needHelpDesc}</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="flex items-center justify-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors w-full"
                >
                  {ui.getFreeEvaluation} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Article */}
          <article className="flex-1 max-w-3xl">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">

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
                <h3 className="font-display font-bold text-xl text-white mb-2">{ui.midCtaTitle}</h3>
                <p className="text-brand-100 text-sm mb-5">{ui.midCtaDesc}</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
                >
                  {ui.midCtaBtn} <ArrowRight size={14} />
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

            </div>

            {/* Bottom CTA */}
            <div className="mt-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
              <Shield className="mx-auto text-brand-200 mb-3" size={32} />
              <h3 className="font-display font-bold text-2xl text-white mb-2">{ui.ctaTitle}</h3>
              <p className="text-brand-100 text-sm mb-5 max-w-lg mx-auto">{ui.ctaDesc}</p>
              <Link
                href={`${base}/free-evaluation`}
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
              >
                {ui.ctaBtn} <ArrowRight size={16} />
              </Link>
              <p className="text-brand-200 text-xs mt-4">{ui.phone} · {ui.speakRussian}</p>
            </div>

            {/* Sources */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 italic">
                {ui.sources}: TRM Labs Blockchain Forensics Overview, Hudson Intelligence Cryptocurrency Tracing Guide, FBI Operation Level Up, Built In Blockchain Forensics Guide, HKA Global Crypto Crimes Analysis.
              </p>
              <p className="text-xs text-slate-400 italic mt-2">
                {ui.legalNote}
              </p>
            </div>

            {/* Share again */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-3">
              <span className="text-sm text-slate-500">{ui.shareArticle}:</span>
              <button onClick={shareTwitter} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                X Twitter
              </button>
              <button onClick={shareLinkedIn} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                in LinkedIn
              </button>
              <button onClick={copyLink} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                {copied ? <><Check size={12} className="text-emerald-500" /> {ui.copied}</> : <><Link2 size={12} /> {ui.copyLink}</>}
              </button>
            </div>
          </article>
        </div>
      </div>

      {/* Related Articles */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-8">{ui.relatedArticles}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {relatedPosts.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-200 transition-colors group">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category]}`}>
                  {post.category}
                </span>
                <h3 className="font-display font-bold text-slate-900 mt-3 mb-2 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} /> {post.readTime}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
