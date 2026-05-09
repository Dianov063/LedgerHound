import type { Metadata } from 'next';
import { makeMetadata } from '@/lib/metadata';
import { getApproved } from '@/lib/investigators/storage';

export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const inv = await getApproved(id);
  if (!inv || !inv.isApproved || !inv.isActive) {
    return await makeMetadata({
      locale,
      path: `/investigators/${id}`,
      title: 'Investigator Profile | LedgerHound Network',
      description: 'Certified blockchain forensics investigator in the LedgerHound network.',
      noIndex: true,
    });
  }

  const certs = inv.certifications.filter((c) => c !== 'Other').join(', ');
  const title = `${inv.name} — ${inv.city}, ${inv.country} | LedgerHound`;
  const description = `${inv.name} is a ${certs} certified blockchain forensics investigator based in ${inv.city}, ${inv.country}. Specializes in ${inv.specializations.slice(0, 3).join(', ')}.`;

  return await makeMetadata({
    locale,
    path: `/investigators/${id}`,
    title: title.slice(0, 70),
    description: description.slice(0, 160),
    keywords: [
      `crypto fraud investigator ${inv.city}`,
      `blockchain forensics expert ${inv.country}`,
      ...inv.certifications.filter((c) => c !== 'Other').map((c) => `${c} certified investigator`),
      ...inv.specializations.slice(0, 3),
    ],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
