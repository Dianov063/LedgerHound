'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { locales } from '@/i18n';

const localeNames: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  zh: '中文',
  fr: 'Français',
  ar: 'العربية',
};

const localeFlags: Record<string, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  es: '🇪🇸',
  zh: '🇨🇳',
  fr: '🇫🇷',
  ar: '🇸🇦',
};

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const prefix = locale === 'en' ? '' : `/${locale}`;
  /* The first two links are the visitor's two states — hasn't paid yet, already
   * paid. The third is the other product. Everything else is one level down. */
  const navLinks = [
    { href: `${prefix}/payment-safety`, label: t('report_scam') },
    { href: `${prefix}/payment-safety#check`, label: t('check_recipient') },
    { href: `${prefix}/crypto`, label: t('crypto_recovery') },
    { href: `${prefix}/pricing`, label: t('pricing') },
    { href: `${prefix}/blog`, label: t('blog') },
  ];

  /* The tools row is crypto-side furniture. Hiding it on the payment pages keeps
   * the front door to a single row, and showing it everywhere else means no tool
   * is orphaned — they are still the only navigation those pages have. */
  const pathNoLocale = pathname.replace(/^\/(ru|es|zh|fr|ar)(?=\/|$)/, '') || '/';
  const showToolLinks = pathNoLocale !== '/' && !pathNoLocale.startsWith('/payment-');
  const toolLinks = [
    { href: `${prefix}/wallet-tracker`, label: t('tracker'), badge: undefined },
    { href: `${prefix}/graph-tracer`, label: t('graph'), badge: undefined },
    { href: `${prefix}/recovery-calculator`, label: t('calculator'), badge: undefined },
    { href: `${prefix}/scam-checker`, label: t('scam_checker'), badge: undefined },
    { href: `${prefix}/payment-safety`, label: 'Payment Check', badge: 'NEW' },
    { href: `${prefix}/report`, label: t('report'), badge: '$49' },
    { href: `${prefix}/tx-lookup`, label: t('tx'), badge: undefined },
    { href: `${prefix}/scam-database`, label: t('scam_db'), badge: 'NEW' },
    { href: `${prefix}/emergency`, label: t('emergency'), badge: 'SOS' },
    { href: `${prefix}/tools/exchange-letter`, label: t('exchange_letter'), badge: 'NEW' },
  ];

  /* The payment side wears the warm palette, the crypto side keeps the blue.
   * Same bar, two skins — so the visitor can tell which product they are in
   * without reading the heading. */
  const warm = !showToolLinks;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-sm ${
        warm ? 'bg-paper/95 border-clay-600/15' : 'bg-white/95 border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: logo + pages + CTA */}
        <div className="flex items-center justify-between h-14">
          {/* Logo — the artwork carries its own cream background, so it sits in a
              matching card instead of showing as a pale rectangle on white. */}
          <Link
            href={locale === 'en' ? '/' : `/${locale}`}
            aria-label="LedgerHound"
            className="flex items-center shrink-0 rounded-2xl border border-clay-600/20 bg-paper px-3 py-1 shadow-sm"
          >
            <Image
              src="/logo.png"
              alt="LedgerHound"
              width={1693}
              height={929}
              priority
              className="h-9 w-[110px] object-cover object-center"
            />
          </Link>

          {/* Desktop Nav - pages */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href || '/'}
                className={`px-3 py-1.5 text-base font-medium rounded-lg transition-colors ${
                  warm
                    ? 'text-ink-muted hover:text-ink hover:bg-clay-50'
                    : 'text-slate-600 hover:text-brand-600 hover:bg-brand-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                onKeyDown={(e) => { if (e.key === 'Escape') setLangOpen(false); }}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Globe size={14} />
                <span>{localeFlags[locale]} {localeNames[locale]}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div role="listbox" aria-label="Available languages" className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  {locales.map((l) => (
                    <button
                      key={l}
                      role="option"
                      aria-selected={l === locale}
                      tabIndex={0}
                      onClick={() => {
                        switchLocale(l);
                        setLangOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchLocale(l); setLangOpen(false); }
                        if (e.key === 'Escape') setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left ${
                        l === locale ? 'text-brand-600 font-medium bg-brand-50' : 'text-slate-700'
                      }`}
                    >
                      <span>{localeFlags[l]}</span>
                      <span>{localeNames[l]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={
                warm
                  ? `${prefix}/payment-safety`
                  : `/${locale === 'en' ? '' : locale + '/'}free-evaluation`.replace(/\/$/, '') || '/free-evaluation'
              }
              className={
                warm
                  ? 'inline-flex items-center gap-2 bg-clay-600 hover:bg-clay-700 text-white font-semibold text-sm py-2.5 px-5 rounded-full transition-colors'
                  : 'btn-primary text-sm py-2 px-4'
              }
            >
              {warm ? t('report_scam') : t('cta')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Bottom row: tools (compact) — crypto side only */}
        <div className={`${showToolLinks ? 'hidden md:flex' : 'hidden'} items-center justify-center gap-1 border-t border-slate-100 py-1.5`}>
          {toolLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href || '/'}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-brand-600 rounded-md hover:bg-brand-50 transition-colors flex items-center gap-1.5"
            >
              {link.label}
              {link.badge && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href || '/'}
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <p className="px-3 py-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Tools</p>
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href || '/'}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100">
              <p className="px-3 py-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Language</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      switchLocale(l);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      l === locale ? 'bg-brand-50 text-brand-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{localeFlags[l]}</span>
                    <span>{localeNames[l]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <Link
                href={`/${locale === 'en' ? '' : locale + '/'}free-evaluation`.replace(/\/$/, '') || '/free-evaluation'}
                className="btn-primary w-full justify-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {t('cta')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
