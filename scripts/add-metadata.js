const fs = require('fs');
const path = require('path');

// Server component pages that need generateMetadata added
// Format: [filePath, pagePath, title, description, keywords?]
const serverPages = [
  // Homepage
  [
    'app/[locale]/page.tsx',
    '',
    'LedgerHound | Crypto Asset Tracing & Blockchain Forensics',
    'Certified blockchain investigators tracing stolen cryptocurrency for fraud victims, attorneys, and businesses. Court-ready reports. Free case evaluation.',
    ['crypto tracing', 'blockchain forensics', 'stolen cryptocurrency', 'crypto recovery', 'blockchain investigation'],
  ],
  // About
  [
    'app/[locale]/about/page.tsx',
    '/about',
    'About LedgerHound | Blockchain Forensics Experts',
    'Meet the certified blockchain forensics team at LedgerHound. Years of experience tracing stolen cryptocurrency across Bitcoin, Ethereum, TRON, and 10+ networks.',
    ['about ledgerhound', 'blockchain forensics team', 'crypto investigators'],
  ],
  // Pricing
  [
    'app/[locale]/pricing/page.tsx',
    '/pricing',
    'Pricing | Crypto Tracing & Blockchain Investigation | LedgerHound',
    'Transparent pricing for cryptocurrency tracing, blockchain forensics, and court-ready investigation reports. Free initial case evaluation.',
    ['crypto tracing pricing', 'blockchain investigation cost', 'crypto forensics pricing'],
  ],
  // Services index
  [
    'app/[locale]/services/page.tsx',
    '/services',
    'Blockchain Investigation Services | LedgerHound',
    'Comprehensive blockchain forensics services: crypto tracing, fraud investigation, divorce crypto analysis, litigation support, and romance scam recovery.',
    ['blockchain investigation services', 'crypto forensics services'],
  ],
  // Services/divorce-crypto
  [
    'app/[locale]/services/divorce-crypto/page.tsx',
    '/services/divorce-crypto',
    'Cryptocurrency in Divorce & Estates | Hidden Crypto Forensics | LedgerHound',
    'Expert blockchain forensics for divorce and estate proceedings. We uncover hidden cryptocurrency wallets, trace transfers, and provide court-admissible reports.',
    ['crypto divorce', 'hidden cryptocurrency', 'divorce crypto forensics', 'estate crypto investigation'],
  ],
  // Services/crypto-tracing
  [
    'app/[locale]/services/crypto-tracing/page.tsx',
    '/services/crypto-tracing',
    'Cryptocurrency Tracing Service | Trace Stolen Crypto | LedgerHound',
    'Professional cryptocurrency tracing across Bitcoin, Ethereum, TRON, and 10+ blockchains. We trace stolen funds to exchange deposit addresses for legal recovery.',
    ['crypto tracing', 'trace stolen crypto', 'cryptocurrency investigation', 'bitcoin tracing'],
  ],
  // Services/romance-scams
  [
    'app/[locale]/services/romance-scams/page.tsx',
    '/services/romance-scams',
    'Romance Scam & Pig Butchering Recovery | LedgerHound',
    'Specialized recovery assistance for romance scam and pig butchering victims. We trace cryptocurrency sent to scammers and identify exchange deposit points.',
    ['romance scam recovery', 'pig butchering scam', 'crypto romance scam', 'pig butchering recovery'],
  ],
  // Services/corporate-fraud
  [
    'app/[locale]/services/corporate-fraud/page.tsx',
    '/services/corporate-fraud',
    'Corporate Crypto Fraud Investigation | LedgerHound',
    'Enterprise-grade blockchain forensics for corporate fraud, embezzlement, insider threats, and cryptocurrency theft investigation.',
    ['corporate crypto fraud', 'blockchain investigation corporate', 'crypto embezzlement'],
  ],
  // Services/litigation
  [
    'app/[locale]/services/litigation/page.tsx',
    '/services/litigation',
    'Litigation Support & Expert Witness | Blockchain Forensics | LedgerHound',
    'Court-ready blockchain forensic reports and expert witness testimony. We support attorneys with cryptocurrency evidence for civil and criminal litigation.',
    ['crypto expert witness', 'blockchain litigation support', 'court ready crypto report'],
  ],
  // Cases
  [
    'app/[locale]/cases/page.tsx',
    '/cases',
    'Case Studies | Crypto Recovery Success Stories | LedgerHound',
    'Real blockchain forensics case studies: cryptocurrency tracing, scam recovery, and fund identification results for our clients.',
    ['crypto recovery case studies', 'blockchain forensics results'],
  ],
  // Blog index
  [
    'app/[locale]/blog/page.tsx',
    '/blog',
    'Blog | Crypto Forensics & Blockchain Security | LedgerHound',
    'Expert insights on cryptocurrency scams, blockchain forensics, crypto recovery, and blockchain security from LedgerHound investigators.',
    ['crypto forensics blog', 'blockchain security blog', 'crypto scam news'],
  ],
];

const root = path.resolve(__dirname, '..');

for (const [filePath, pagePath, title, description, keywords] of serverPages) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip if already has generateMetadata
  if (content.includes('generateMetadata')) {
    console.log(`SKIP (already has metadata): ${filePath}`);
    continue;
  }

  // Build the import + generateMetadata block
  const importLine = `import { makeMetadata } from '@/lib/metadata';\n`;
  const metadataBlock = `
export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '${pagePath}',
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},${keywords ? `\n    keywords: ${JSON.stringify(keywords)},` : ''}
  });
}
`;

  // Check if it has 'use client' — if so, we can't add generateMetadata here
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    console.log(`SKIP (client component): ${filePath}`);
    continue;
  }

  // Add import after existing imports
  // Find the last import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('} from ')) {
      lastImportIdx = i;
    }
    // Stop at first non-import, non-empty line after imports
    if (lastImportIdx > -1 && !lines[i].startsWith('import ') && !lines[i].startsWith('} from ') && lines[i].trim() !== '' && !lines[i].startsWith('//')) {
      break;
    }
  }

  // Insert import after last import
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }

  // Insert generateMetadata before the default export
  const newContent = lines.join('\n');
  const exportIdx = newContent.indexOf('export default function');
  if (exportIdx === -1) {
    console.log(`SKIP (no default export found): ${filePath}`);
    continue;
  }

  const final = newContent.slice(0, exportIdx) + metadataBlock + '\n' + newContent.slice(exportIdx);
  fs.writeFileSync(fullPath, final, 'utf8');
  console.log(`DONE: ${filePath}`);
}

console.log('\nAll server component pages processed.');
