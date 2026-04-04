import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GraphTracer from '@/components/GraphTracer';
import { ArrowRight, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Transaction Flow Graph | Ethereum Fund Tracing | LedgerHound',
  description:
    'Visualize Ethereum fund flows with our free transaction graph tool. Multi-hop tracing, known entity detection (exchanges, mixers, DeFi), and export capabilities. Used by investigators and attorneys.',
  keywords: [
    'ethereum transaction graph',
    'crypto fund flow visualization',
    'blockchain tracing tool',
    'trace crypto funds',
    'ethereum flow chart',
    'crypto forensics tool',
    'transaction flow analysis',
  ],
};

export default function GraphTracerPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* SEO Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Shield size={12} />
            Free Blockchain Intelligence Tool
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-white mb-5">
            Transaction Flow <span className="text-indigo-500">Graph</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl mx-auto">
            Enter any Ethereum address to visualize the complete flow of funds. Our graph tracer identifies exchanges, mixers, and DeFi protocols — mapping multi-hop transactions in real time. Used by fraud investigators, attorneys, and law enforcement.
          </p>
        </div>
      </div>

      {/* Graph Tracer */}
      <GraphTracer />

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl text-white mb-3">
            Need a professional forensic investigation?
          </h2>
          <p className="text-indigo-100 mb-6">
            Our certified investigators build court-ready reports with full entity attribution and chain-of-custody documentation. Free case evaluation — no obligation.
          </p>
          <Link
            href="/free-evaluation"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Get Free Case Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
