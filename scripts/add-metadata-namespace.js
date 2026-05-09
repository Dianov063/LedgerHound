/**
 * One-shot script: add the `metadata` namespace to messages/en.json.
 * Run once with: node scripts/add-metadata-namespace.js
 * After running, the metadata block exists in en.json and the
 * translate-metadata.ts script can pick it up to generate other locales.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'messages', 'en.json');

const metadata = {
  home: {
    title: 'LedgerHound — Crypto Asset Tracing & Blockchain Forensics',
    description: 'Trace stolen crypto across 14 blockchains. Court-ready forensic reports for fraud victims, attorneys, and businesses. Free case evaluation.',
  },
  about: {
    title: 'About LedgerHound | Blockchain Forensics Experts',
    description: 'Meet the certified team tracing stolen crypto on Bitcoin, Ethereum, TRON, and 10+ networks. CTCE, CFE, CAMS credentials, multilingual support.',
  },
  pricing: {
    title: 'Pricing | Crypto Tracing & Forensic Reports | LedgerHound',
    description: 'Transparent pricing for crypto tracing and court-ready forensic reports. Automated reports from $49. Free case evaluation, no obligation.',
  },
  services: {
    index: {
      title: 'Services | Blockchain Forensics & Crypto Recovery | LedgerHound',
      description: 'Crypto tracing, romance and pig-butchering scam recovery, divorce asset discovery, corporate fraud, expert witness — from certified investigators.',
    },
    cryptoTracing: {
      title: 'Crypto Tracing Services | Stolen Cryptocurrency Recovery | LedgerHound',
      description: 'Trace stolen crypto across Bitcoin, Ethereum, TRON, BNB, and 10+ chains. Identify exchanges, mixers, laundering paths. Court-admissible reports.',
    },
    romanceScams: {
      title: 'Romance Scam & Pig Butchering Recovery | LedgerHound',
      description: 'Lost money to a fake online relationship? We trace pig butchering and romance scam funds, identify exchanges, and prepare evidence for police.',
    },
    divorceCrypto: {
      title: 'Hidden Crypto in Divorce | Forensics for Attorneys | LedgerHound',
      description: 'We uncover hidden cryptocurrency wallets in divorce and estate cases. Court-admissible reports linking spouses to specific addresses and balances.',
    },
    litigation: {
      title: 'Litigation Support & Expert Witness | LedgerHound Forensics',
      description: 'Court-ready forensic reports, expert witness testimony, and evidence preservation for crypto fraud litigation. Trusted by US attorneys.',
    },
    corporateFraud: {
      title: 'Corporate Crypto Fraud Investigation | LedgerHound',
      description: 'Internal embezzlement, treasury drain, vendor fraud — we trace stolen company crypto and produce evidence for civil and criminal action.',
    },
  },
  cases: {
    title: 'Case Results | Crypto Recovery Examples | LedgerHound',
    description: 'Real anonymized examples of crypto fraud investigations: pig butchering, fake exchanges, romance scams. See how forensic tracing leads to recovery.',
  },
  contact: {
    title: 'Contact LedgerHound | Crypto Forensics & Recovery',
    description: 'Get in touch with LedgerHound for crypto tracing, fraud recovery, or expert witness services. 24-hour response, multilingual support.',
  },
  blog: {
    index: {
      title: 'Blog | Crypto Forensics & Blockchain Security | LedgerHound',
      description: 'Expert insights on cryptocurrency scams, blockchain forensics, and crypto recovery from LedgerHound investigators. Practical guides for victims.',
    },
  },
  tools: {
    walletTracker: {
      title: 'Free Crypto Wallet Tracker | Multi-Chain Lookup | LedgerHound',
      description: 'Track any cryptocurrency wallet across Bitcoin, Ethereum, TRON, BNB, Solana, and more. Free transaction history and balance tool.',
    },
    graphTracer: {
      title: 'Crypto Transaction Graph Tracer | Free Visualization | LedgerHound',
      description: 'Visualize cryptocurrency fund flows as an interactive graph. Trace stolen crypto through multiple wallets and chains. Free forensic tool.',
    },
    recoveryCalculator: {
      title: 'Crypto Recovery Calculator | Estimate Your Chances | LedgerHound',
      description: 'Estimate the likelihood of recovering stolen cryptocurrency. Free calculator based on time elapsed, exchange exposure, and case factors.',
    },
    scamChecker: {
      title: 'Crypto Scam Checker | Free Wallet & Platform Lookup | LedgerHound',
      description: 'Check if a wallet, platform, or exchange has been reported as a scam. Free instant lookup against the LedgerHound community database.',
    },
    txLookup: {
      title: 'Transaction Lookup | Multi-Chain Hash Decoder | LedgerHound',
      description: 'Look up any cryptocurrency transaction by hash across 14 blockchains. See sender, recipient, value, and counterparty risk in seconds.',
    },
    exchangeLetter: {
      title: 'Exchange Preservation Letter Generator | Free for Victims | LedgerHound',
      description: 'Generate professional preservation letters and freeze requests for 24+ crypto exchanges. Free tool for fraud victims and attorneys.',
    },
  },
  scamDatabase: {
    index: {
      title: 'Crypto Scam Database | Community Reports | LedgerHound',
      description: 'Search verified reports of fake crypto exchanges, scam platforms, and fraud wallets. Help others by reporting your own case.',
    },
    report: {
      title: 'Report a Crypto Scam | Help Other Victims | LedgerHound',
      description: 'Report a fake crypto exchange, scam platform, or fraud wallet. Your report helps protect others and strengthens recovery cases.',
    },
  },
  report: {
    title: 'Forensic Report $49 | Automated Wallet Analysis | LedgerHound',
    description: 'Professional forensic PDF report with risk score, transaction analysis, and exchange identification. Generated in minutes for $49.',
  },
  freeEvaluation: {
    title: 'Free Crypto Recovery Evaluation | LedgerHound Forensics',
    description: 'Free 24-hour evaluation of your crypto fraud case. Our team reviews wallet, transactions, and recovery prospects — no obligation.',
  },
  emergency: {
    title: 'Emergency Crypto Recovery Pack | LedgerHound',
    description: 'Just lost crypto? Generate police report, exchange preservation letters, and forensic evidence in one urgent package.',
  },
  investigators: {
    index: {
      title: 'Certified Crypto Fraud Investigators | LedgerHound Network',
      description: 'Network of CTCE, CFE, and CAMS certified blockchain forensics experts. Multilingual coverage across dozens of jurisdictions.',
    },
  },
  joinNetwork: {
    title: 'Join Our Investigator Network | LedgerHound',
    description: 'Are you a certified crypto fraud investigator? Apply to the LedgerHound network for qualified leads, tool access, and transparent referrals.',
  },
  legal: {
    investigatorAgreement: {
      title: 'Investigator Network Agreement | LedgerHound',
      description: 'Terms of the LedgerHound Investigator Network — referral fee structure, NDA, code of conduct, and liability framework.',
    },
  },
  privacy: {
    title: 'Privacy Policy | LedgerHound',
    description: 'How LedgerHound collects, uses, and protects your data. GDPR and CCPA compliant. Read our full privacy commitment.',
  },
  terms: {
    title: 'Terms of Service | LedgerHound',
    description: 'Terms and conditions for using LedgerHound services and tools. Read carefully before placing an order.',
  },
  disclaimer: {
    title: 'Disclaimer | LedgerHound',
    description: 'Important legal disclaimers about LedgerHound services, recovery limitations, and independent contractor relationships.',
  },
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
data.metadata = metadata;
fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

const flatten = (obj, prefix = '') => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !('title' in v)) {
      out.push(...flatten(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
};
console.log('✅ Added metadata namespace to en.json');
console.log('Keys:', flatten(metadata).length);
flatten(metadata).forEach((k) => console.log('  -', k));
