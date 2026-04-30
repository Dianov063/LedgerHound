import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentEn({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Kyle Holder thought she was talking to a real person named Niamh. Two months of conversations. A fake "customer service team" coached her on wallets and transfers. By the time she caught on, her savings were gone — siphoned through layers of blockchain transactions. This isn't some isolated story. It's the new face of crypto fraud, and it's powered by artificial intelligence.</p>
      <p className="text-lg text-slate-700 leading-relaxed">The numbers are staggering. According to the <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI's 2025 IC3 report</a>, Americans lost $7.2 billion to crypto investment scams in 2025 — making it the most costly type of fraud reported to the agency. And IRS investigators say AI is a key driver. In a <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News report</a>, officials revealed how deepfake voices, AI-generated profiles, and automated chat scripts are making scams more convincing than ever.</p>
      <p className="text-lg text-slate-700 leading-relaxed">This article breaks down how AI is supercharging crypto fraud, what IRS investigators are seeing on the ground, and — most importantly — how you can fight back using blockchain forensics and free tools like <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">LedgerHound's Wallet Tracker</Link>.</p>

      <h2 id="the-ai-powered-scam-machine">The AI-Powered Scam Machine</h2>

      <p>Scammers have always been good at manipulation. But AI gives them scale. Instead of one con artist typing messages, AI chatbots now run thousands of conversations simultaneously, adapting in real-time to victims' responses. IRS investigators told <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a> that these bots can mimic empathy, urgency, and even romantic interest — all while collecting personal data to refine the attack.</p>

      <p>Deepfake voice and video calls are the next frontier. In 2025, the FBI warned about scammers using AI-cloned voices of family members or authority figures to demand urgent crypto payments. The technology is cheap and accessible — a 30-second audio sample from social media is enough to clone a voice. We've seen cases where victims received a "video call" from what looked like a trusted exchange support agent, only to lose their entire portfolio.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$7.2 billion</p>
        <p className="text-sm text-slate-600">Total losses from crypto investment scams reported to the FBI IC3 in 2025 — the highest of any fraud category.</p>
      </div>

      <p>The result? A record $7.2 billion in losses from crypto investment scams alone, per the <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3 2025 report</a>. That's not counting romance scams, ransomware, or business email compromise — all of which increasingly demand crypto.</p>

      <h2 id="irs-investigators-on-the-front-lines">IRS Investigators on the Front Lines</h2>

      <p>The IRS Criminal Investigation unit (IRS-CI) is uniquely positioned to tackle crypto fraud because money laundering almost always leaves a tax trail. In 2025, IRS-CI agents investigated hundreds of crypto-related cases, many involving AI-generated fake identities and shell companies. According to <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a>, the agency has seen a sharp uptick in cases where scammers use AI to create realistic investment platforms that exist only on paper.</p>

      <p>One IRS agent described a case where a victim was lured into a fake mining pool that promised daily returns. The website looked professional, complete with AI-generated testimonials and a live chat bot that answered questions 24/7. When the victim tried to withdraw, the bot demanded additional "verification fees" — a classic pig-butchering tactic, now automated.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Think you've been scammed?</h3>
        <p className="text-brand-100 text-sm mb-5">Don't wait. The first 72 hours are critical for freezing funds at exchanges. Use our free Wallet Tracker to map the flow of your stolen crypto — no account required.</p>
        <Link href={`${base}/wallet-tracker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Try Wallet Tracker Free <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-ai-enables-pig-butchering-at-scale">How AI Enables Pig Butchering at Scale</h2>

      <p>Pig butchering — a scam where fraudsters build trust over weeks or months before draining victims — has been around for years. But AI supercharges it. Instead of one scammer managing a handful of victims, AI can run dozens of "relationships" simultaneously, using natural language processing to remember past conversations and adjust tactics.</p>

      <p>The <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">US Treasury sanctions against Cambodian senator Kok An</a> and 28 others in 2026 exposed a massive network of scam centers using AI to target Americans. These operations employed deepfake video calls, AI-generated voice messages, and even fake news articles to make their schemes look legitimate. The Treasury Department alleged Kok An used political connections to protect these centers, which stole millions from US citizens.</p>

      <ul>
        <li>AI chatbots that mimic romantic partners or financial advisors</li>
        <li>Deepfake video calls with fake "support agents"</li>
        <li>AI-generated fake news and testimonials to build credibility</li>
        <li>Automated trading platforms that show fake profits</li>
      </ul>

      <h2 id="the-role-of-blockchain-forensics">The Role of Blockchain Forensics</h2>

      <p>AI may help scammers, but blockchain forensics is catching up. Every crypto transaction is permanently recorded on the ledger. Even when funds move through mixers or cross-chain bridges, forensic tools can trace the flow — if you act fast.</p>

      <p>At LedgerHound, we've traced stolen funds from AI-run scams through multiple blockchains, including Bitcoin, Ethereum, and TRC20 USDT. In one case, a victim lost $47,000 to a deepfake "exchange support" call. Our analysis showed the funds moved through three chains in under an hour, landing at a KYC-compliant exchange. We helped freeze the account before the scammer could withdraw.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Immediate Steps If You've Been Scammed
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Stop all communication</p>
            <p className="text-sm text-slate-600">Don't engage further. Scammers may try to extract more money or personal info.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Document everything</p>
            <p className="text-sm text-slate-600">Save screenshots, wallet addresses, transaction IDs, and any messages. This is evidence.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Use a wallet tracker</p>
            <p className="text-sm text-slate-600">Enter the scammer's wallet address into our <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">free Wallet Tracker</Link> to see where funds went.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Report to authorities</p>
            <p className="text-sm text-slate-600">File a report with the <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3</a> and your local law enforcement. Also notify the exchange where funds landed.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Pro tip</p>
            <p className="text-xs text-slate-600">Many exchanges freeze accounts only after receiving a preservation letter. Use our <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Exchange Preservation Letter Generator</Link> for free.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">5</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Consider professional tracing</p>
            <p className="text-sm text-slate-600">If the amount is significant, a <Link href={`${base}/report`} className="text-brand-600 hover:underline">forensic report</Link> can provide a court-ready chain of custody for recovery efforts.</p>
          </div>
        </div>
      </div>

      <h2 id="what-the-future-holds">What the Future Holds</h2>

      <p>AI fraud is only getting more sophisticated. IRS investigators predict that by 2027, deepfake video calls will be indistinguishable from real ones. Scammers will use AI to personalize attacks based on victims' social media profiles, financial history, and even biometric data.</p>

      <p>But there's hope. Regulatory pressure is increasing. The <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">US Treasury sanctions against Kok An</a> show that the government is targeting the infrastructure behind these scams. And blockchain forensics companies like LedgerHound are building tools that level the playing field.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">28 individuals and entities sanctioned</p>
        <p className="text-sm text-slate-600">The US Treasury sanctioned 28 individuals and entities in 2026 for running crypto-romance scams, including a Cambodian senator.</p>
      </div>

      <p>The key is speed. AI moves fast, but blockchain data is permanent. If you act within hours — not days — you have a real chance of recovering funds. That's why we built <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">LedgerHound's Emergency Preservation Pack</Link> — a step-by-step kit that helps victims freeze assets at exchanges before they disappear.</p>

      <h2 id="protect-yourself-in-the-ai-era">Protect Yourself in the AI Era</h2>

      <p>Prevention is still the best defense. Here are practical tips to avoid AI-powered crypto scams:</p>

      <ol>
        <li>Verify identity through a separate channel. If someone claims to be from an exchange, call the official number — don't trust the number they give you.</li>
        <li>Never share your seed phrase or private keys. No legitimate service will ask for them.</li>
        <li>Be skeptical of unsolicited investment opportunities, especially with guaranteed returns.</li>
        <li>Use our <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Scam Checker</Link> to verify any wallet address or platform before sending funds.</li>
      </ol>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Red Flags for AI Scams
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Too-perfect communication</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>No typos, always available, remembers every detail — AI chatbots are flawless, humans aren't.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Pressure to act fast</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Scammers create urgency to bypass your critical thinking. Legitimate investments don't expire in 24 hours.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Fake video calls</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>If the person on screen looks slightly off or repeats phrases, it might be a deepfake. Ask them to turn their head or wave a hand.</span></li>
          </ul>
        </div>
      </div>

      <h2 id="ledgerhound-is-here-to-help">LedgerHound Is Here to Help</h2>

      <p>We know how devastating these scams are. Our team of certified forensic analysts has traced billions in stolen crypto across dozens of blockchains. Whether you need a quick check or a full <Link href={`${base}/report`} className="text-brand-600 hover:underline">forensic report</Link> for legal action, we're here.</p>

      <p>Start with a <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">free case evaluation</Link> — no obligation. We'll review your situation and recommend the best next steps. And if you're in a hurry, our <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Emergency Preservation Pack</Link> can be deployed in minutes.</p>

      <p>AI may be fueling the fraud, but with the right tools and expertise, you can fight back. The blockchain doesn't lie — and we know how to read it.</p>
    </>
  );
}
