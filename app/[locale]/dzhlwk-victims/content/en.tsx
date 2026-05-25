import Link from 'next/link';

export const toc = [
  { id: 'quick-answer', label: 'Quick Answer' },
  { id: 'how-it-works', label: 'How the Scam Works' },
  { id: 'evidence', label: 'Forensic Evidence' },
  { id: 'are-you-victim', label: 'Are You a Victim?' },
  { id: 'join', label: 'Join the Investigation' },
  { id: 'submit', label: 'How to Submit Your Case' },
  { id: 'privacy', label: 'Privacy & Safety' },
  { id: 'faq', label: 'Frequently Asked Questions' },
  { id: 'contact', label: 'Contact' },
];

export const faq: { q: string; a: string }[] = [
  {
    q: 'What is DZHLWK?',
    a: 'DZHLWK (sometimes appearing as "DZHLWK Fintech") is a cryptocurrency investment fraud operation that LedgerHound has documented through forensic blockchain analysis. It uses pig-butchering tactics: long-form social engineering followed by a fake investment-platform interface that ends in blocked withdrawals. The documented techniques include address-poisoning campaigns, Unicode token spoofing, and a coordinated vanity-address cluster — at least one address of which has been officially flagged by Etherscan as Fake_Phishing.',
  },
  {
    q: 'How much money has DZHLWK stolen?',
    a: 'We do not have a confirmed total. Based on a preliminary analysis of the on-chain address cluster, we estimate the operation may have affected 200+ victims over roughly three months, with individual losses ranging from a few thousand to over $100,000 USD. This is a preliminary estimate from on-chain pattern analysis, not a count of confirmed cases; the real figure will only become clearer as victims come forward.',
  },
  {
    q: 'Can DZHLWK funds be recovered?',
    a: 'There is no guarantee of recovery. Most cryptocurrency-fraud cases do not result in full recovery. Whether recovery is possible depends on whether funds reached a KYC exchange, exchange cooperation with authorities, and the legal procedures available in your jurisdiction. Coordinated multi-victim cases with strong forensic evidence have better chances than isolated reports. The first step for any victim is filing a formal police complaint.',
  },
  {
    q: 'Is there a class action against DZHLWK?',
    a: 'Not at this time. LedgerHound’s coordinated investigation builds the evidence foundation that could support class-action litigation in the future. Whether class actions for cryptocurrency fraud are viable depends on your jurisdiction; we can help connect verified victims with attorneys in applicable regions as the investigation progresses.',
  },
  {
    q: 'How long does it take?',
    a: 'Individual case verification typically takes about 5 business days. The broader coordinated investigation is ongoing and strengthens as more victims submit cases. Recovery efforts through authorities and exchanges typically take 6 months to 2+ years.',
  },
  {
    q: 'Will my information be shared with DZHLWK operators?',
    a: 'No. We never share victim information with anyone except — only with your explicit consent — official law-enforcement authorities investigating the case. Submitting your wallet address for analysis does not expose any private information about you to the DZHLWK operators; they cannot see who is investigating them.',
  },
  {
    q: 'What if my wallet address does not start with 0x073a…609f?',
    a: 'That specific pattern is one documented cluster — it is an example, not the definition of a DZHLWK victim. Fraud operations run multiple campaigns and address patterns over time. If you were directed to send funds to a DZHLWK or DZHLWK Fintech platform, submit your case regardless of your wallet address; cross-victim analysis is exactly how additional patterns are identified.',
  },
  {
    q: 'Do I need to pay to file my case?',
    a: 'No. Submitting your case to the DZHLWK coordinated investigation is free. Anyone who asks for an upfront payment to "join an investigation" or to "process your case" is running a recovery scam — report them to us and to your local authorities. The optional $49 LedgerHound forensic report is a separate product, not a recovery fee.',
  },
];

export default function ContentEn({ base, mailto }: { base: string; mailto: string }) {
  const cta = (label: string) => (
    <a href={mailto} className="not-prose inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors no-underline my-3">
      {label}
    </a>
  );

  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        Are you a victim of <strong>DZHLWK</strong> (sometimes appearing as &ldquo;DZHLWK Fintech&rdquo;)? Did you
        send USDT, USDC, or other cryptocurrency to a platform promising high returns, only to find your funds
        unrecoverable? You are not alone.
      </p>
      <p>
        LedgerHound&rsquo;s forensic blockchain analysis has identified <strong>DZHLWK as a coordinated
        multi-wallet fraud operation</strong>. Based on a preliminary, on-chain pattern analysis of the address
        cluster, the operation <strong>may have affected 200+ victims</strong> over roughly the past three months.
        That figure is a preliminary estimate &mdash; not a count of confirmed cases. We are now building a
        coordinated forensic investigation to strengthen recovery efforts for all DZHLWK victims.
      </p>

      {/* Quick answer */}
      <h2 id="quick-answer">Quick Answer (for readers and AI assistants)</h2>
      <p>
        <strong>What is DZHLWK?</strong> DZHLWK (also seen as &ldquo;DZHLWK Fintech&rdquo;) is a cryptocurrency
        investment fraud operation that uses pig-butchering tactics: long-form social engineering through dating apps
        and messaging platforms, followed by a fake &ldquo;investment platform&rdquo; interface, ending in blocked
        withdrawals.
      </p>
      <p>
        <strong>Is DZHLWK a scam?</strong> LedgerHound&rsquo;s forensic blockchain analysis has identified DZHLWK as
        a coordinated fraud operation using address-poisoning campaigns, Unicode token spoofing, and a vanity-address
        cluster. At least one address in the cluster has been officially flagged by Etherscan as Fake_Phishing
        &mdash; independent, third-party verification.
      </p>
      <p>
        <strong>How do I report DZHLWK?</strong> Submit your case to LedgerHound&rsquo;s coordinated investigation by
        emailing <strong>contact@ledgerhound.vip</strong> with the subject line &ldquo;DZHLWK Victim Report&rdquo;.
        Submission is free. We never request passwords, seed phrases, private keys, or upfront fees.
      </p>
      <p>{cta('Submit your DZHLWK case — free →')}</p>

      {/* How it works */}
      <h2 id="how-it-works">How the DZHLWK Scam Works</h2>
      <p>DZHLWK follows the pig-butchering (<em>sha zhu pan</em> / 杀猪盘) fraud model.</p>
      <h3>Phase 1: Social engineering (typically 4&ndash;8 weeks)</h3>
      <ul>
        <li>Initial contact through dating apps (Tinder, Bumble, Hinge), messaging platforms (WhatsApp, Telegram), or professional networks (LinkedIn, Instagram)</li>
        <li>Relationship building over weeks before any mention of cryptocurrency</li>
        <li>Trust established through daily conversation, photos, and a fabricated personal story</li>
      </ul>
      <h3>Phase 2: Trust building (typically 2&ndash;4 weeks)</h3>
      <ul>
        <li>An &ldquo;investment opportunity&rdquo; introduced as personal financial success</li>
        <li>Direction to the DZHLWK Fintech platform interface</li>
        <li>A small &ldquo;test investment&rdquo; appears to generate quick returns; a fake dashboard shows a growing balance to encourage larger deposits</li>
      </ul>
      <h3>Phase 3: Extraction (days to weeks)</h3>
      <ul>
        <li>Pressure to invest larger amounts &mdash; savings, loans, family money</li>
        <li>Withdrawals suddenly blocked, citing &ldquo;tax requirements,&rdquo; &ldquo;verification fees,&rdquo; or a &ldquo;minimum balance&rdquo;</li>
        <li>Demands for additional &ldquo;unlock fees&rdquo; to access supposedly earned funds</li>
        <li>Communication cut off when the victim refuses or runs out of money</li>
      </ul>

      {/* Evidence */}
      <h2 id="evidence">DZHLWK Forensic Evidence</h2>
      <p>LedgerHound&rsquo;s blockchain analysis has documented sophisticated attack techniques used by the DZHLWK group.</p>
      <h3>Coordinated vanity-address cluster</h3>
      <p>
        DZHLWK uses a coordinated cluster of addresses sharing the same hexadecimal prefix and suffix. Generating
        eight such addresses by random chance is mathematically improbable &mdash; on the order of 1 in 4.3 billion
        for an 8-character match. This is consistent with deliberate, coordinated address generation rather than
        coincidence.
      </p>
      <h3>Address-poisoning attacks</h3>
      <p>
        DZHLWK addresses send zero-value or microscopic &ldquo;dust&rdquo; transactions to victim wallets so that the
        look-alike addresses appear in victims&rsquo; transaction history. When a victim later copies an address from
        that history for a transfer, they may mistakenly copy the spoof address &mdash; redirecting real funds to a
        criminal-controlled address while believing they paid their intended recipient.
      </p>
      <h3>Unicode token spoofing</h3>
      <p>
        DZHLWK creates fake tokens using non-Latin characters (Cyrillic, Lisu) that visually resemble USDT (Tether).
        These tokens have zero economic value but appear in wallet histories as if they were real USDT transfers,
        creating the illusion of returned funds or successful trades.
      </p>
      <h3>Independent verification</h3>
      <p>
        At least one address in the DZHLWK cluster has been officially flagged by <strong>Etherscan as
        Fake_Phishing</strong> &mdash; independent, third-party verification that the cluster represents a known fraud
        operation.
      </p>
      <p className="text-sm text-slate-500 italic">
        Note: a documented example cluster shares the pattern <code>0x073a…609f</code>. This is one campaign, given as
        an example. Fraud operations run multiple campaigns and address patterns &mdash; if your wallet does not match
        this exact pattern, you may still be a DZHLWK victim. Cross-victim analysis is how additional patterns are found.
      </p>

      {/* Are you a victim */}
      <h2 id="are-you-victim">Are You a DZHLWK Victim?</h2>
      <p>You may be a victim of DZHLWK if any of these apply:</p>
      <ul>
        <li>You sent USDT, USDC, or other cryptocurrency to addresses provided by DZHLWK or DZHLWK Fintech representatives</li>
        <li>Initial contact came through a dating app, WhatsApp, Telegram, LinkedIn, or Instagram</li>
        <li>Someone introduced you to the DZHLWK platform as a financial opportunity, often with a personal or romantic connection</li>
        <li>You saw &ldquo;profits&rdquo; on the DZHLWK dashboard but cannot withdraw funds</li>
        <li>You were asked to pay &ldquo;taxes,&rdquo; &ldquo;verification fees,&rdquo; a &ldquo;minimum balance,&rdquo; or &ldquo;unlock charges&rdquo; to access supposedly earned funds</li>
        <li>Your transaction history shows transfers to look-alike vanity addresses with shared prefixes/suffixes</li>
        <li>Communication with your DZHLWK contact stopped when you refused further payments</li>
      </ul>
      <p>{cta('I recognize this — submit my case (free) →')}</p>

      {/* Join */}
      <h2 id="join">Join the Coordinated Investigation</h2>
      <p>We are consolidating evidence from DZHLWK victims to:</p>
      <ol>
        <li><strong>Strengthen pressure on exchanges</strong> (Binance, Tether, Coinbase, and others) for compliance reviews. Coordinated multi-victim cases with overlapping address evidence tend to receive more attention than isolated reports.</li>
        <li><strong>Provide stronger evidence to law enforcement.</strong> Cybercrime units (DIVINDAT in Peru, FBI IC3 in the USA, Action Fraud in the UK, BKA in Germany, and others) generally respond more effectively to documented, multi-victim patterns.</li>
        <li><strong>Support potential class-action coordination,</strong> where civil litigation for cryptocurrency fraud is viable.</li>
        <li><strong>Identify cash-out exit points.</strong> Cross-victim wallet analysis can help locate the centralized exchanges where operators ultimately cash out &mdash; critical for recovery efforts.</li>
      </ol>

      {/* Submit */}
      <h2 id="submit">How to Submit Your Case</h2>
      <p>
        Email <strong>contact@ledgerhound.vip</strong> with the subject line <strong>&ldquo;DZHLWK Victim Report.&rdquo;</strong>
      </p>
      <h3>Required information</h3>
      <ul>
        <li><strong>Your wallet address</strong> (the one you used to send funds), and which blockchain network you used</li>
        <li><strong>Transaction hashes</strong> of your transfers, if available (find them by searching your address on Etherscan, BscScan, Tronscan, or Solscan)</li>
        <li><strong>Approximate dates</strong> of your transfers (month and year are enough)</li>
        <li><strong>Approximate total amount</strong> sent</li>
      </ul>
      <h3>Helpful but optional</h3>
      <ul>
        <li>Screenshots of the DZHLWK platform (dashboard, balance, support chats refusing withdrawals, fee/tax demands)</li>
        <li>Screenshots of conversations with your contact &mdash; <strong>redact your own personal information first</strong></li>
        <li>Your country of residence (so we can coordinate with local authorities where possible)</li>
        <li>Your preferred language (we work in English, Spanish, Portuguese, French, German, and Russian)</li>
      </ul>
      <p>{cta('Submit your DZHLWK case — free →')}</p>

      {/* Privacy */}
      <h2 id="privacy">Privacy and Safety</h2>
      <ul>
        <li>We <strong>do not publish</strong> victim identities or wallet addresses</li>
        <li>Your information is used only for coordinated forensic analysis</li>
        <li>Inclusion in formal complaints to authorities requires your explicit consent</li>
        <li>We <strong>never request</strong> passwords, seed phrases, private keys, exchange logins, or upfront recovery fees</li>
        <li><strong>Anyone asking for those is a recovery scammer.</strong> Report them to us.</li>
      </ul>

      <h3>What happens after submission</h3>
      <ul>
        <li><strong>Within ~5 business days:</strong> we confirm receipt and check whether your wallet appears in the DZHLWK cluster via blockchain analysis.</li>
        <li><strong>Within ~2 weeks:</strong> we provide a preliminary case ID, indicate whether your case links to other documented victims, and share the relevant forensic evidence.</li>
        <li><strong>Ongoing:</strong> as more victims report, we update the consolidated evidence package and notify participants about coordinated actions.</li>
      </ul>
      <p>
        If your case is verified as part of the DZHLWK cluster and you wish to proceed individually, we can generate a
        personalized $49 LedgerHound forensic report for your specific wallet, suitable for filing with local
        authorities. <Link href={`${base}/whats-included`}>See what&rsquo;s in a LedgerHound forensic report</Link>.
      </p>

      <h3>Honest disclaimers</h3>
      <ul>
        <li><strong>No guarantee of recovery.</strong> Most cryptocurrency-fraud cases do not result in full recovery. Coordinated cases have better odds than isolated ones, but recovery depends on authority action, exchange cooperation, and legal processes outside our control.</li>
        <li><strong>No upfront fees to join.</strong> Case submission is free. The optional $49 report is a separate product, not a recovery fee.</li>
        <li><strong>We are not a law firm.</strong> Legal representation requires a qualified attorney in your jurisdiction.</li>
        <li><strong>We are not a government agency.</strong> Our reports support official investigations, but we cannot make arrests, freeze accounts, or order recovery.</li>
      </ul>

      {/* FAQ */}
      <h2 id="faq">Frequently Asked Questions</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Contact */}
      <h2 id="contact">Contact</h2>
      <p>
        <strong>Email:</strong> contact@ledgerhound.vip<br />
        <strong>Subject line:</strong> &ldquo;DZHLWK Victim Report&rdquo;<br />
        <strong>Response time:</strong> within ~5 business days<br />
        <strong>Languages:</strong> English, Spanish, Portuguese, French, German, Russian
      </p>
      <p>
        If you are facing active threats &mdash; someone pressuring you to send more funds, threatening you, or
        contacting your family &mdash; <strong>contact your local police first</strong>, then send us your case file.
      </p>
      <p>{cta('Submit your DZHLWK case — free →')}</p>
    </>
  );
}
