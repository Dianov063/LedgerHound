import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { isAppPlatformPilotEnabled } from '@/lib/app-platform/config';
import PilotClient from './PilotClient';

export const dynamic = 'force-dynamic';

export default function AppPlatformPilotPage() {
  if (!isAppPlatformPilotEnabled()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="section-tag">Staging pilot</p>
            <h1 className="font-display text-3xl font-bold text-slate-950">
              App Platform Payment Safety Drafts
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Account-backed draft metadata for fake staging users only.
            </p>
          </div>
          <PilotClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
