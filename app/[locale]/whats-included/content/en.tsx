import Link from 'next/link';

/** Table-of-contents anchors (H2 sections). */
export const toc = [
  { id: 'quick-answer', label: 'Quick Answer' },
  { id: 'who-uses', label: 'Who Uses These Reports' },
  { id: 'sections', label: "What's in the Report" },
  { id: 'templates', label: 'Email Templates Included' },
  { id: 'faq', label: 'Frequently Asked Questions' },
  { id: 'get-started', label: 'Ready to Get Started' },
];

/** Single source of truth for the FAQ — rendered below AND emitted as FAQPage JSON-LD. */
export const faq: { q: string; a: string }[] = [
  {
    q: 'Is the LedgerHound report admissible in court?',
    a: 'The $49 automated report is designed for police complaints, exchange compliance reviews, civil-litigation support, and insurance claims. For formal expert-witness testimony, LedgerHound offers a separate certified forensic investigation service.',
  },
  {
    q: 'How quickly do I receive the report?',
    a: 'Reports are generated automatically after payment, typically within 5–10 minutes. The PDF and the three email templates are delivered to your email along with the SHA-256 verification hash.',
  },
  {
    q: 'Which languages and blockchains are supported?',
    a: 'Reports are available in English and Spanish. Supported blockchains are Ethereum, Bitcoin, Solana, TRON, BNB Chain, Base, Arbitrum, and Optimism. Country-specific legal guidance is currently most complete for Peru; Mexico, Colombia, Argentina, and Chile are planned.',
  },
  {
    q: 'How many pages is the report?',
    a: 'Typically 18–22 pages, depending on case complexity. Some sections — such as Attack Technique Analysis, Cross-Chain Analysis, and Country-Specific Resources — appear only when they are relevant to your case, so the exact length varies.',
  },
  {
    q: 'Does LedgerHound guarantee fund recovery?',
    a: 'No. The report explicitly states that most cryptocurrency-fraud cases do not result in full recovery. Its purpose is to give law enforcement and legal counsel the strongest possible evidence package. Recovery depends on authority action, exchange cooperation, and legal processes outside LedgerHound’s control.',
  },
  {
    q: 'How is LedgerHound different from "recovery" services?',
    a: 'We provide forensic blockchain analysis with a self-contained chain of custody. We never promise guaranteed recovery, never charge upfront fees beyond the $49 report, and never ask for passwords, seed phrases, or private keys. Any service that promises guaranteed returns or asks for those is likely a scam itself.',
  },
];

export default function ContentEn({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">
        A LedgerHound forensic report is a blockchain analysis of a cryptocurrency wallet involved in fraud,
        delivered as a PDF document for <strong>$49 USD</strong>. It is built for use with law enforcement,
        exchange compliance teams, and legal counsel. This page describes every section of the report and how
        it is intended to be used.
      </p>
      <p>
        The report is <strong>typically 18&ndash;22 pages</strong>, depending on case complexity. Several sections
        appear only when they are relevant to your specific case, so the exact length varies from wallet to wallet.
      </p>

      {/* Quick Answer */}
      <h2 id="quick-answer">Quick Answer</h2>
      <p>A LedgerHound $49 forensic report contains:</p>
      <ul>
        <li>Forensic blockchain analysis as a PDF, <strong>typically 18&ndash;22 pages</strong></li>
        <li><strong>Risk score and recovery-probability</strong> assessments, each with an honest disclaimer</li>
        <li><strong>Attack-technique documentation</strong> &mdash; address poisoning, Unicode spoofing, vanity-cluster detection (included when such attacks are detected)</li>
        <li><strong>Entity identification</strong> &mdash; exchanges, mixers, DeFi protocols, and known scam addresses</li>
        <li><strong>Transaction history and a fund-flow diagram</strong></li>
        <li><strong>Country-specific legal guidance</strong> (currently full Peru support)</li>
        <li><strong>Three ready-to-use email templates</strong> for DIVINDAT, Binance compliance, and Tether legal</li>
        <li>A <strong>SHA-256 chain-of-custody hash</strong> embedded in the PDF</li>
      </ul>
      <p>
        Reports are available in <strong>English and Spanish</strong>. Supported blockchains: Ethereum, Bitcoin,
        Solana, TRON, BNB Chain, Base, Arbitrum, and Optimism.
      </p>

      {/* Who uses */}
      <h2 id="who-uses">Who Uses These Reports</h2>
      <ul>
        <li><strong>Cryptocurrency-fraud victims</strong> filing police complaints and exchange escalations</li>
        <li><strong>Law firms</strong> building blockchain evidence for civil-recovery cases</li>
        <li><strong>Exchange compliance teams</strong> responding to preservation requests</li>
        <li><strong>Law-enforcement agencies</strong> receiving forensic documentation from victims</li>
        <li><strong>Insurance adjusters</strong> evaluating cryptocurrency-fraud claims</li>
      </ul>

      {/* Sections */}
      <h2 id="sections">What&rsquo;s in the Report</h2>
      <p className="text-sm text-slate-500 italic">
        The report flows in the order below. To keep page references accurate as the document length changes
        per case, we describe where each section appears rather than a fixed page number.
      </p>

      <h3>Executive Summary</h3>
      <p>
        An at-a-glance case overview at the front of the report, for prosecutors, lawyers, and compliance
        officers. It contains the risk score (0&ndash;100) with a verifiable factor breakdown, a recovery-probability
        estimate with an honest disclaimer, the confirmed economic loss kept clearly separate from worthless spoof
        tokens, and 3&ndash;5 key findings. For supported countries, a <strong>documents checklist</strong> (which authority
        to contact first, and in what order) appears within this summary. The risk-factor rows sum mathematically
        to the displayed total &mdash; an invariant by construction &mdash; so any reader can verify the score.
      </p>

      <h3>Recovery Readiness Assessment</h3>
      <p>
        A rating of how complete your evidence package is &mdash; deliberately separate from recovery probability.
        Recovery <em>readiness</em> measures how strong your documentation is; recovery <em>probability</em> measures
        how likely you are to get money back. A case can have excellent evidence (high readiness) but low recovery
        probability if no scammer KYC exit point is identified. Includes an evidence inventory and an
        investigation-difficulty rating.
      </p>

      <h3>Investigation Summary</h3>
      <p>
        A behavioral classification of the analyzed wallet (victim, scammer, aggregator, transit) with a confidence
        percentage and the specific data points behind it, plus a flow-of-funds visualization
        (source &rarr; analyzed wallet &rarr; destination) and an evidence-strength score. This section explicitly
        classifies victim wallets as victims, with supporting reasoning &mdash; it protects victims from being
        mischaracterized as perpetrators.
      </p>

      <h3>Asset Summary &amp; Activity Timeline</h3>
      <p>
        A combined section that accounts for assets token by token and lays out the key event chronology.
        Real cryptocurrency and worthless spoof tokens are <strong>never aggregated</strong>: the reported economic
        loss uses real-value assets only, so claims are never inflated with zero-value tokens. The timeline labels
        recipient roles (e.g. MAIN COLLECTOR, SPOOF ADDRESS) and, when address poisoning is present, highlights the
        look-alike address collision (shared prefix/suffix). It is an abbreviated, selected-events timeline, with a
        note pointing to the full transaction history.
      </p>

      <h3>Behavioral Pattern Analysis</h3>
      <p>
        Fraud-pattern detection &mdash; rapid forwarding (the scam-funnel signature, reported with both volume-based
        and deposit-count metrics), round-amount preferences, time-of-day clustering, and counterparty-diversity
        analysis. Each pattern includes a methodology note and a confidence rating.
      </p>

      <h3>Wallet Analytics</h3>
      <p>
        A statistical overview: transaction counts, unique counterparties, and asset-diversity metrics, plus the
        top counterparties with <strong>IN/OUT direction indicators</strong> and aggregated per-destination volumes
        (cumulative totals, not single-transaction maximums).
      </p>

      <h3>Entity Identification &amp; Exit Points</h3>
      <p>
        A combined section that tags known entities for subpoena targeting &mdash; exchange wallets (with KYC-subpoena
        availability), mixer/tumbler contracts, DeFi protocols, and bridge contracts &mdash; alongside the destinations
        that received real outflows, aggregated per destination.
      </p>

      <h3>Address Verification &amp; External Intelligence <span className="text-slate-400 font-normal">(included when matches are found)</span></h3>
      <p>
        Cross-source verification of suspicious addresses against the LedgerHound Scam Database, the OFAC SDN list,
        Chainabuse community reports, GoPlus Security risk indicators, and Etherscan&rsquo;s official Fake_Phishing
        tags (independent third-party verification). Each address shows how many sources confirm it &mdash; agreement
        across sources increases evidentiary weight.
      </p>

      <h3>Attack Technique Analysis <span className="text-slate-400 font-normal">(included when sophisticated attacks are detected)</span></h3>
      <p>
        Detailed documentation of sophisticated attacks: <strong>address-poisoning campaigns</strong> with
        vanity-cluster detection and a mathematical-improbability calculation; <strong>Unicode token spoofing</strong>
        (fake tokens built from non-Latin scripts such as Cyrillic or Lisu) documented in U+XXXX codepoint notation
        with the normalization methodology for independent verification; and an explanation of the
        <strong> dust-transaction mechanism</strong> &mdash; how zero-value transfers planted in the victim&rsquo;s history
        enable later address-confusion. This section makes sophisticated attacks understandable to non-technical
        investigators and judges.
      </p>

      <h3>Cross-Chain Analysis <span className="text-slate-400 font-normal">(included when cross-chain activity is detected)</span></h3>
      <p>
        When funds move across chains through bridge contracts, this section identifies the bridges involved and
        recommends tracing on the connected chains.
      </p>

      <h3>Fund-Flow Graph</h3>
      <p>
        A visual diagram of cryptocurrency movement. Real fund flows are drawn as solid edges (red outgoing, green
        incoming); spoof-token flows are dashed grey edges with &ldquo;no value&rdquo; labels. A legend distinguishes
        real from spoof flows, and connections to exchanges, mixers, and known entities are clearly labeled.
      </p>

      <h3>Transaction History</h3>
      <p>
        A chronologically sorted, representative transaction list &mdash; up to three transactions per asset to avoid
        document bloat, sorted oldest-first for investigative narrative flow, with spoof-token rows highlighted and a
        reference to the total transaction count.
      </p>

      <h3>Recovery Assessment &amp; Legal Recommendations</h3>
      <p>
        A combined section with a three-scenario recovery analysis &mdash; (A) funds reached an identifiable KYC
        exchange exit, (B) funds in unidentified wallets, (C) funds mixed or bridged cross-chain &mdash; each with a
        probability and difficulty rating, followed by actionable next steps: KYC entry-point preservation, counterparty
        exit tracing, an FBI IC3 or local-police filing referencing the case ID, exchange-compliance notification with
        preservation-request language, token-issuer coordination, and the optional certified investigation for court
        testimony.
      </p>

      <h3>Country-Specific Resources <span className="text-slate-400 font-normal">(included when localized guidance is available)</span></h3>
      <p>
        Localized authority contacts and procedures. Currently available for <strong>Peru</strong>: DIVINDAT (the
        cybercrime division) contact and filing procedure, the Public Ministry online complaint portal, SBS escalation,
        INDECOPI consumer-protection procedures, Lima Bar Association lawyer verification, and the RENIEC identity-alert
        system. Mexico, Colombia, Argentina, and Chile are planned.
      </p>

      <h3>Concrete Recovery Steps</h3>
      <p>
        A step-by-step checklist: (1) preserve KYC records at your funding exchange, (2) file with authorities
        (IC3, local police, FTC), (3) legal procedures (subpoena strategy, asset recovery), and (4) evidence-preservation
        best practices.
      </p>

      <h3>Legal Disclaimer &amp; Methodology</h3>
      <p>
        Professional disclaimers and methodology references &mdash; the report is explicit about its own scope and
        limitations.
      </p>

      <h3>Chain of Custody &mdash; SHA-256 Verification</h3>
      <p>
        Cryptographic evidence-integrity verification on the final page. A SHA-256 hash is computed over the report
        content (excluding the verification field itself) and embedded in the PDF; any alteration changes the hash. The
        same hash appears in the delivery email and in all three email templates, and can be verified with standard
        tools (<code>sha256sum</code>). This supports formal court evidence chains, expert-witness testimony, and
        regulatory compliance.
      </p>

      {/* Templates */}
      <h2 id="templates">Email Templates Included (3 Attachments)</h2>
      <p>
        Beyond the PDF, the $49 package includes three ready-to-use email templates in Markdown.
      </p>
      <h3>DIVINDAT Denuncia (Peru cases)</h3>
      <p>
        A pre-written formal complaint for the Peruvian cybercrime division. Includes verified legal references
        (Articles 196&deg; and 196-A&deg; of the Peruvian Penal Code, and Law 30096), current DIVINDAT contact details,
        a loss-computation explanation justifying the total as patrimonial loss, anti-confusion guardrails separating
        real funds from spoof tokens, and the SHA-256 chain-of-custody reference.
      </p>
      <h3>Binance Compliance Request</h3>
      <p>
        A template for Binance&rsquo;s &ldquo;Report fraud/scam&rdquo; support category (the correct, verified channel
        &mdash; not a general compliance email). Includes the UID-field clarification (Binance requires the account UID,
        not just an email), vanity-cluster documentation that also flags dust-only poisoners, compliance-safe preservation
        wording, and anti-bait protection separating real losses from worthless tokens.
      </p>
      <h3>Tether Legal Notification</h3>
      <p>
        A template for Tether Operations Limited&rsquo;s legal team. Includes an honest disclaimer that Tether processes
        freezes primarily on law-enforcement request, a recommendation to send it after obtaining a police case number,
        the full contract addresses for the USDT spoof tokens, and an evidence-package presentation format.
      </p>

      {/* FAQ */}
      <h2 id="faq">Frequently Asked Questions</h2>
      {faq.map((item, i) => (
        <div key={i}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      {/* Get started */}
      <h2 id="get-started">Ready to Get Started?</h2>
      <p>
        <Link href={`${base}/report`} className="text-brand-600 font-semibold hover:underline">
          Generate your forensic report &mdash; $49 &rarr;
        </Link>
      </p>
      <p><strong>What you&rsquo;ll need:</strong></p>
      <ul>
        <li>The wallet address that sent funds to the fraud</li>
        <li>An email address for report delivery</li>
        <li>A payment method (credit card via Stripe)</li>
      </ul>
      <p className="text-sm text-slate-500">
        Supported blockchains: Ethereum, Bitcoin, Solana, TRON, BNB Chain, Base, Arbitrum, Optimism.
      </p>
    </>
  );
}
