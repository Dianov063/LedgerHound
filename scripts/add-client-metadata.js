const fs = require('fs');
const path = require('path');

// Client component pages that need a layout.tsx with metadata
// Format: [dirPath, pagePath, title, description, keywords?]
const clientPages = [
  [
    'app/[locale]/contact',
    '/contact',
    'Contact LedgerHound | Blockchain Forensics Consultation',
    'Contact our blockchain forensics team for a free case evaluation. We respond within 24 hours.',
    ['contact ledgerhound', 'crypto investigation contact'],
  ],
  [
    'app/[locale]/free-evaluation',
    '/free-evaluation',
    'Free Case Evaluation | Crypto Recovery Assessment | LedgerHound',
    'Get a free evaluation of your cryptocurrency recovery case. Our blockchain forensics experts assess traceability, recovery potential, and next steps.',
    ['free crypto recovery evaluation', 'crypto case assessment'],
  ],
  [
    'app/[locale]/report',
    '/report',
    'Report Crypto Fraud | File Investigation Request | LedgerHound',
    'Report cryptocurrency fraud or submit an investigation request. Our blockchain forensics team will assess your case.',
    ['report crypto fraud', 'crypto investigation request'],
  ],
  [
    'app/[locale]/scam-checker',
    '/scam-checker',
    'Free Crypto Address Scam Checker | Risk Assessment | LedgerHound',
    'Check any Bitcoin, Ethereum, TRON, or Solana address against our scam database. Instant risk assessment with OFAC sanctions check.',
    ['crypto scam checker', 'check scam address', 'crypto address risk', 'OFAC sanctions check'],
  ],
  [
    'app/[locale]/tx-lookup',
    '/tx-lookup',
    'Multi-Chain Transaction Lookup | Trace Any TX Hash | LedgerHound',
    'Look up any transaction across Ethereum, Bitcoin, TRON, BNB Chain, and more. Auto-detect chain, verify amounts, and check for scam addresses.',
    ['crypto transaction lookup', 'trace tx hash', 'blockchain transaction search'],
  ],
  [
    'app/[locale]/scam-database',
    '/scam-database',
    'Scam Address Database | Community Crypto Fraud Registry | LedgerHound',
    'Community-driven database of reported crypto scam platforms. Search by platform name or wallet address. Report scams and help protect others.',
    ['crypto scam database', 'scam address database', 'report crypto scam', 'scam platform list'],
  ],
  [
    'app/[locale]/scam-database/report',
    '/scam-database/report',
    'Report a Crypto Scam | Submit Evidence | LedgerHound',
    'Submit a scam report with blockchain evidence. Transaction auto-verification, recovery score assessment, and community fraud registry.',
    ['report crypto scam', 'submit scam evidence', 'crypto fraud report'],
  ],
];

const root = path.resolve(__dirname, '..');

for (const [dirPath, pagePath, title, description, keywords] of clientPages) {
  const layoutPath = path.join(root, dirPath, 'layout.tsx');

  // Skip if layout already exists
  if (fs.existsSync(layoutPath)) {
    console.log(`SKIP (layout exists): ${dirPath}/layout.tsx`);
    continue;
  }

  const keywordsStr = keywords
    ? `\n    keywords: ${JSON.stringify(keywords)},`
    : '';

  const content = `import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '${pagePath}',
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},${keywordsStr}
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;

  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log(`DONE: ${dirPath}/layout.tsx`);
}

console.log('\nAll client component page layouts created.');
