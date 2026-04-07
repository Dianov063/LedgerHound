const fs = require('fs');
const path = require('path');

const blogPosts = [
  {
    slug: 'how-to-trace-stolen-bitcoin',
    title: 'How to Trace Stolen Bitcoin: Complete Guide | LedgerHound',
    description: 'Step-by-step guide on tracing stolen Bitcoin using blockchain forensics. Learn how investigators follow the money across the Bitcoin network.',
    keywords: ['trace stolen bitcoin', 'bitcoin tracing guide', 'stolen crypto recovery'],
  },
  {
    slug: 'pig-butchering-scam-recovery',
    title: 'Pig Butchering Scam Recovery: What Victims Can Do | LedgerHound',
    description: 'Comprehensive guide for pig butchering scam victims. Learn how blockchain forensics can help trace stolen cryptocurrency and support recovery efforts.',
    keywords: ['pig butchering scam recovery', 'romance scam crypto', 'pig butchering help'],
  },
  {
    slug: 'how-to-identify-fake-crypto-trading-platform',
    title: 'How to Identify a Fake Crypto Trading Platform | LedgerHound',
    description: 'Learn the red flags of fake cryptocurrency trading platforms. Protect yourself from common crypto scam tactics used by fraudulent exchanges.',
    keywords: ['fake crypto exchange', 'identify scam platform', 'crypto trading scam signs'],
  },
  {
    slug: 'usdt-trc20-scam-recovery-guide-2026',
    title: 'USDT TRC20 Scam Recovery Guide 2026 | LedgerHound',
    description: 'Complete guide to recovering USDT sent via TRON TRC20 to scammers. Exchange freeze strategies, blockchain tracing, and legal options for victims.',
    keywords: ['USDT TRC20 scam recovery', 'TRON scam recovery', 'USDT recovery guide'],
  },
];

const root = path.resolve(__dirname, '..');

for (const post of blogPosts) {
  const layoutPath = path.join(root, 'app', '[locale]', 'blog', post.slug, 'layout.tsx');

  if (fs.existsSync(layoutPath)) {
    console.log(`SKIP (exists): ${post.slug}/layout.tsx`);
    continue;
  }

  const content = `import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/${post.slug}',
    title: ${JSON.stringify(post.title)},
    description: ${JSON.stringify(post.description)},
    keywords: ${JSON.stringify(post.keywords)},
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;

  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log(`DONE: blog/${post.slug}/layout.tsx`);
}

console.log('Blog metadata layouts done.');
