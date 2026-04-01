import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Shield, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const services = [
    { href: `${base}/services/crypto-tracing`, label: t('crypto_tracing') },
    { href: `${base}/services/romance-scams`, label: t('romance_scams') },
    { href: `${base}/services/divorce-crypto`, label: t('divorce') },
    { href: `${base}/services/litigation`, label: t('litigation') },
    { href: `${base}/services/corporate-fraud`, label: t('corporate') },
  ];

  const company = [
    { href: `${base}/about`, label: t('about') },
    { href: `${base}/blog`, label: t('blog') },
    { href: `${base}/cases`, label: t('cases') },
    { href: `${base}/contact`, label: t('contact') },
  ];

  const legal = [
    { href: `${base}/privacy`, label: t('privacy') },
    { href: `${base}/terms`, label: t('terms') },
    { href: `${base}/disclaimer`, label: t('disclaimer') },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={base || '/'} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">LH</span>
              </div>
              <span className="font-display font-bold text-white text-lg">
                Ledger<span className="text-brand-400">Hound</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">{t('tagline')}</p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="mailto:contact@ledgerhound.vip" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={14} /> contact@ledgerhound.vip
              </a>
              <a href="tel:+18335591334" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} /> +1 (833) 559-1334
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">{t('services')}</h4>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm hover:text-white transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">{t('company')}</h4>
            <ul className="space-y-2">
              {company.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="text-sm hover:text-white transition-colors">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <Shield size={12} />
              <span>LedgerHound</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs">{t('copyright')}</p>
          <p className="text-xs text-slate-600 max-w-sm">{t('legal_note')}</p>
        </div>
      </div>
    </footer>
  );
}
