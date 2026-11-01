import type { Metadata } from 'next';
import { getPaymentScamScenario } from '@/lib/payment-scam-scenarios';
import { getScenarioCopy, TRANSLATED_SCENARIO_SLUGS } from '@/lib/payment-scam-i18n';
import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: { locale: string; scenario: string } }): Promise<Metadata> {
  const scenario = getPaymentScamScenario(params.scenario);
  if (!scenario) return {};
  const copy = getScenarioCopy(scenario.slug, params.locale);
  return makeMetadata({
    locale: params.locale,
    path: `/payment-scam/${scenario.slug}`,
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    englishOnlyContent: !TRANSLATED_SCENARIO_SLUGS.includes(scenario.slug),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
