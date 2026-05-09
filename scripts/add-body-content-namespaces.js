/**
 * One-shot: add body-content namespaces to messages/en.json:
 *   - about_page
 *   - pricing_page (only NEW keys; existing `pricing` namespace stays untouched)
 *   - services_divorce_page
 *
 * Run once: node scripts/add-body-content-namespaces.js
 * Then: npx tsx scripts/translate-body-content.ts
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'messages', 'en.json');

const aboutPage = {
  hero: {
    tag: 'About LedgerHound',
    title_line1: 'Certified Investigators.',
    title_line2: 'Real Results.',
    subtitle: 'LedgerHound is a blockchain forensics firm bringing certified investigation capabilities to fraud victims, attorneys, and businesses who need to trace, document, and act on misappropriated cryptocurrency.',
  },
  mission: {
    tag: 'Our Mission',
    title: 'Why We Built LedgerHound',
    p1: "Cryptocurrency fraud costs victims billions every year. Yet most people who lose funds have nowhere to turn — law enforcement is overwhelmed, existing firms are expensive and opaque, and victims often don't know where to start.",
    p2: 'We built LedgerHound to change that. We believe every victim deserves honest answers: Can my funds be traced? What evidence can we build? What will it cost? What are the realistic outcomes?',
    p3: 'Our team combines blockchain forensics expertise with a commitment to transparency — publishing our prices, providing free evaluations, and serving clients in six languages including Russian, the native language of a large segment of crypto fraud victims in the US.',
  },
  stats: {
    delivery_value: '48h',
    delivery_label: 'Average report delivery',
    chains_value: '10+',
    chains_label: 'Blockchains covered',
    languages_value: '6',
    languages_label: 'Languages served',
    court_value: '100%',
    court_label: 'Court-ready reports',
  },
  values: {
    tag: 'Our Values',
    title: 'How We Work',
    integrity_title: 'Integrity First',
    integrity_desc: "We provide honest assessments. If we can't help, we say so — upfront, before you spend a dollar.",
    certified_title: 'Certified Excellence',
    certified_desc: 'Every investigation is led by CTCE and CFE certified professionals using industry-standard tools.',
    client_title: 'Client-Centered',
    client_desc: 'We explain everything in plain language. No jargon, no mystery — just clear communication throughout.',
    multilingual_title: 'Multilingual Team',
    multilingual_desc: 'We serve clients in English, Russian, Spanish, Chinese, French, and Arabic — no translators needed.',
  },
  credentials: {
    tag: 'Credentials',
    title: 'Certifications We Hold',
    issued_by: 'Issued by',
    ctce_full: 'Cryptocurrency Tracing Certified Examiner',
    cfe_full: 'Certified Fraud Examiner',
    cci_full: 'Certified Cryptocurrency Investigator',
  },
  tech: {
    tag: 'Technology',
    title: 'Tools We Use',
    note_label: 'Note:',
    note_text: 'We use industry-standard professional tools. Our reports are generated using court-admissible blockchain intelligence data — not free consumer tools.',
  },
  corporate: {
    tag: 'Legal Entity',
    title: 'Corporate Information',
    company_label: 'Company',
    ein_label: 'EIN',
    state_label: 'State of Formation',
    dos_label: 'DOS ID',
    website_label: 'Website',
    contact_label: 'Contact',
    description: 'LedgerHound is a registered brand operating under USPROJECT LLC, a New York limited liability company. All forensic investigations are conducted by certified professionals operating under applicable US law and professional standards.',
    not_law_firm: 'Not a law firm. We do not provide legal advice. Forensic investigation services only.',
  },
  cta: {
    title: 'Ready to work with us?',
    subtitle: 'Start with a free, confidential case evaluation. We respond within 24 hours.',
    button: 'Get Free Evaluation',
  },
};

// pricing_page — only the keys that are CURRENTLY hardcoded in pricing/page.tsx,
// not duplicates of the existing `pricing` namespace.
const pricingPage = {
  best_for: {
    basic: 'Best for: Single scam, one blockchain',
    full: 'Best for: Romance scams, divorce, litigation',
    expert: 'Best for: Attorneys & legal proceedings',
  },
  not_sure: {
    title: 'Not sure which package you need?',
    body: "Start with our free evaluation. We'll assess your case and recommend the right service — no pressure.",
    link: 'Get free evaluation →',
  },
  all_plans: {
    title: 'All Plans Include',
    confidential_title: 'Confidential Investigation',
    confidential_desc: 'Your case details are strictly confidential.',
    certified_title: 'Certified Investigators',
    certified_desc: 'CTCE and CFE certified professionals on every case.',
    fast_title: 'Fast Turnaround',
    fast_desc: '48–72 hours for most investigations.',
    attorney_title: 'Attorney Collaboration',
    attorney_desc: 'We work directly with your legal team.',
  },
  faq: {
    title: 'Pricing Questions',
    q1: 'Do you charge upfront?',
    a1: 'The initial case evaluation is completely free. If you decide to proceed with an investigation, we require 50% upfront and 50% upon delivery of the report.',
    q2: 'What if my case is more complex than expected?',
    a2: 'We assess complexity during the free evaluation and quote accordingly. If unforeseen complexity arises mid-investigation, we discuss scope changes transparently before proceeding.',
    q3: 'Do you offer contingency arrangements?',
    a3: 'For select cases involving significant recoverable assets, we discuss contingency or success-fee arrangements. Contact us to discuss your specific situation.',
    q4: 'What is your refund policy?',
    a4: 'If we determine funds are not traceable during the investigation, we provide a partial refund of work not yet completed. We are transparent about this from the start.',
    q5: 'How do you accept payment?',
    a5: 'We accept bank transfers, credit cards, and cryptocurrency. For sensitive cases, we can discuss alternative arrangements.',
    q6: 'Do you offer discounts for attorneys or law firms?',
    a6: 'Yes, we offer volume pricing for law firms and attorneys who refer multiple cases. Contact us to discuss a partnership arrangement.',
  },
};

const servicesDivorcePage = {
  breadcrumb: {
    home: 'Home',
    services: 'Services',
    current: 'Divorce & Crypto',
  },
  hero: {
    badge: 'Family Law · Probate & Estates',
    title_line1: 'Cryptocurrency in',
    title_line2: 'Divorce & Estates',
    subtitle: "Hidden crypto assets are increasingly common in divorce proceedings and estate disputes. Our blockchain forensics uncover what your spouse or beneficiary claims doesn't exist.",
    cta: 'Start Free Evaluation',
  },
  scenarios: {
    tag: 'How We Help',
    title: 'Forensic Crypto Analysis for Family Law',
    hidden_title: 'Hidden Wallet Discovery',
    hidden_desc: 'Your spouse claims they have no crypto, or that it was lost. We analyze the blockchain to find wallets linked to their known addresses.',
    valuation_title: 'Asset Valuation',
    valuation_desc: 'We identify all cryptocurrency holdings — including staking rewards, DeFi positions, and NFTs — and document their value for court.',
    transfer_title: 'Transfer Tracing',
    transfer_desc: 'Did your spouse move funds before or during proceedings? We trace transfers and establish when and where assets were moved.',
    historical_title: 'Historical Documentation',
    historical_desc: 'We compile a complete, chronological record of all cryptocurrency activity — essential for establishing the marital estate.',
  },
  deliverables: {
    title: 'What We Deliver to Attorneys',
    item1: 'Court-admissible forensic report with methodology documentation',
    item2: 'Complete list of identified cryptocurrency addresses and balances',
    item3: 'Transaction history with timestamps and USD values at time of transfer',
    item4: 'Expert witness availability for depositions and trial',
    item5: 'Ongoing collaboration with your legal team throughout proceedings',
  },
  cta: {
    title: 'Working on a divorce or estate case?',
    subtitle: 'Attorney inquiries welcome. We respond within 24 hours and offer volume pricing for law firms.',
    button_evaluation: 'Free Evaluation',
    button_attorney: 'Attorney Inquiry',
  },
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
data.about_page = aboutPage;
data.pricing_page = pricingPage;
data.services_divorce_page = servicesDivorcePage;
fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

const flatten = (obj, prefix = '') => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
};

console.log('✅ Added 3 namespaces to messages/en.json:');
console.log('   - about_page:', flatten(aboutPage).length, 'keys');
console.log('   - pricing_page:', flatten(pricingPage).length, 'keys');
console.log('   - services_divorce_page:', flatten(servicesDivorcePage).length, 'keys');
console.log('   Total:', flatten(aboutPage).length + flatten(pricingPage).length + flatten(servicesDivorcePage).length, 'new keys');
