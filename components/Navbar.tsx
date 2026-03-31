'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
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

  const getLocalePath = (newLocale: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const isLocaleSegment = locales.includes(segments[0] as any);
    const pathWithoutLocale = isLocaleSegment ? segments.slice(1) : segments;
    return newLocale === 'en'
      ? `/${pathWithoutLocale.join('/')}`
      : `/${newLocale}${pathWithoutLocale.length ? '/' + pathWithoutLocale.join('/') : ''}`;
  };

  const navLinks = [
    { href: `/${locale === 'en' ? '' : locale + '/'}services`.replace(/\/$/, ''), label: t('services') },
    { href: `/${locale === 'en' ? '' : locale + '/'}cases`.replace(/\/$/, ''), label: t('cases') },
    { href: `/${locale === 'en' ? '' : locale + '/'}pricing`.replace(/\/$/, ''), label: t('pricing') },
    { href: `/${locale === 'en' ? '' : locale + '/'}about`.replace(/\/$/, ''), label: t('about') },
    { href: `/${locale === 'en' ? '' : locale + '/'}blog`.replace(/\/$/, ''), label: t('blog') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={locale === 'en' ? '/' : `/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">LH</span>
            </div>
            <span className="font-display font-bold text-slate-900 text-lg">
              Ledger<span className="text-brand-600">Hound</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href || '/'}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Globe size={14} />
                <span>{localeFlags[locale]} {localeNames[locale]}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        router.push(getLocalePath(l));
                        setLangOpen(false);
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
              href={`/${locale === 'en' ? '' : locale + '/'}free-evaluation`.replace(/\/$/, '') || '/free-evaluation'}
              className="btn-primary text-sm py-2 px-4"
            >
              {t('cta')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
            <div className="pt-3 border-t border-slate-100">
              <p className="px-3 py-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Language</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      router.push(getLocalePath(l));
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
