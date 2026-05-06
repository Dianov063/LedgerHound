'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Shield,
  Award,
  CheckCircle2,
  Globe,
  Users,
  ArrowRight,
  MapPin,
  Briefcase,
  Search,
  X,
  Filter,
  Star,
  BadgeCheck,
} from 'lucide-react';
import type {
  PublicInvestigator,
  Certification,
  Specialization,
  Language,
  Availability,
} from '@/lib/investigators/schema';
import { CERTIFICATIONS, SPECIALIZATIONS, LANGUAGES } from '@/lib/investigators/schema';

const AVAILABILITY_LABEL: Record<Availability, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-emerald-500' },
  limited: { label: 'Limited', color: 'bg-amber-500' },
  unavailable: { label: 'Unavailable', color: 'bg-slate-400' },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function InvestigatorsPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [investigators, setInvestigators] = useState<PublicInvestigator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterCert, setFilterCert] = useState<Certification | ''>('');
  const [filterSpec, setFilterSpec] = useState<Specialization | ''>('');
  const [filterLang, setFilterLang] = useState<Language | ''>('');
  const [filterAvail, setFilterAvail] = useState<Availability | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/investigators/list?pageSize=100')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInvestigators(data.investigators || []);
      })
      .catch((e) => setError(e.message || 'Failed to load investigators'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return investigators.filter((inv) => {
      if (filterCert && !inv.certifications.includes(filterCert)) return false;
      if (filterSpec && !inv.specializations.includes(filterSpec)) return false;
      if (filterLang && !inv.languages.includes(filterLang)) return false;
      if (filterAvail && inv.availability !== filterAvail) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !inv.name.toLowerCase().includes(q) &&
          !inv.country.toLowerCase().includes(q) &&
          !inv.city.toLowerCase().includes(q) &&
          !inv.bio.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [investigators, filterCert, filterSpec, filterLang, filterAvail, searchQuery]);

  const stats = useMemo(() => {
    const countries = new Set(investigators.map((i) => i.country));
    const certs = new Set<Certification>();
    investigators.forEach((i) => i.certifications.forEach((c) => certs.add(c)));
    return {
      total: investigators.length,
      countries: countries.size,
      certifications: certs.size,
    };
  }, [investigators]);

  const hasActiveFilter = filterCert || filterSpec || filterLang || filterAvail || searchQuery;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-5">
              <Shield size={12} />
              <span>Certified Investigator Network</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl mb-4 leading-tight">
              Our Certified Investigator Network
            </h1>
            <p className="text-base md:text-lg text-slate-300 mb-8">
              LedgerHound partners with certified blockchain forensics experts worldwide. Every investigator in our network is verified and accountable.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="font-display font-bold text-3xl text-white mb-1">{stats.total}</div>
                <div className="text-xs text-slate-400">Investigators</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="font-display font-bold text-3xl text-white mb-1">{stats.countries}</div>
                <div className="text-xs text-slate-400">Countries</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="font-display font-bold text-3xl text-white mb-1">{stats.certifications}</div>
                <div className="text-xs text-slate-400">Certifications</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-6">
            Certifications We Recognize
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {CERTIFICATIONS.filter((c) => c.value !== 'Other').map((cert) => (
              <div
                key={cert.value}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5"
              >
                <Award size={16} className="text-brand-600" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{cert.label}</div>
                  <div className="text-[10px] text-slate-500">{cert.full}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-12 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filters</span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterCert('');
                    setFilterSpec('');
                    setFilterLang('');
                    setFilterAvail('');
                    setSearchQuery('');
                  }}
                  className="ml-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <X size={11} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <div className="relative col-span-2 md:col-span-1 lg:col-span-1">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, city, bio..."
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400"
                />
              </div>
              <select
                value={filterCert}
                onChange={(e) => setFilterCert(e.target.value as Certification | '')}
                className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:border-slate-400"
              >
                <option value="">All certifications</option>
                {CERTIFICATIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — {c.full}</option>
                ))}
              </select>
              <select
                value={filterSpec}
                onChange={(e) => setFilterSpec(e.target.value as Specialization | '')}
                className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:border-slate-400"
              >
                <option value="">All specializations</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value as Language | '')}
                className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:border-slate-400"
              >
                <option value="">All languages</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
              <select
                value={filterAvail}
                onChange={(e) => setFilterAvail(e.target.value as Availability | '')}
                className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:border-slate-400"
              >
                <option value="">Any availability</option>
                <option value="available">Available now</option>
                <option value="limited">Limited availability</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-slate-500">
              {loading
                ? 'Loading...'
                : `${filtered.length} investigator${filtered.length === 1 ? '' : 's'}${hasActiveFilter ? ` (filtered from ${investigators.length})` : ''}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Users size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold mb-1">No investigators match your filters</p>
              <p className="text-xs text-slate-400">Try clearing some filters or broadening your search.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((inv) => {
              const avail = AVAILABILITY_LABEL[inv.availability];
              return (
                <Link
                  key={inv.id}
                  href={`${base}/investigators/${inv.id}`}
                  className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all block"
                >
                  {/* Header: photo + name + availability */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      {inv.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inv.photo} alt={inv.name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-base">
                          {getInitials(inv.name)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${avail.color} rounded-full border-2 border-white`}
                        title={avail.label}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors flex items-center gap-1.5 flex-wrap">
                        {inv.name}
                        {inv.isTeam && <Shield size={11} className="text-brand-600" />}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin size={10} />
                        <span className="truncate">{inv.city}, {inv.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification badges */}
                  {(inv.identityVerified || inv.certificationVerified || inv.topInvestigator) && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {inv.identityVerified && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                          <BadgeCheck size={9} /> ID Verified
                        </span>
                      )}
                      {inv.certificationVerified && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 size={9} /> Certs Verified
                        </span>
                      )}
                      {inv.topInvestigator && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                          <Star size={9} /> Top Investigator
                        </span>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {inv.certifications.filter((c) => c !== 'Other').map((cert) => (
                      <span
                        key={cert}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">{inv.bio}</p>

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {inv.specializations.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-700"
                      >
                        {spec.split(' / ')[0]}
                      </span>
                    ))}
                    {inv.specializations.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{inv.specializations.length - 3}</span>
                    )}
                  </div>

                  {/* Footer: languages + experience + stats */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px]">
                      {inv.languages.slice(0, 5).map((lang) => {
                        const l = LANGUAGES.find((x) => x.code === lang);
                        return l ? <span key={lang} title={l.label}>{l.flag}</span> : null;
                      })}
                      {inv.languages.length > 5 && (
                        <span className="text-slate-400">+{inv.languages.length - 5}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><Briefcase size={10} /> {inv.yearsExperience}y</span>
                      {inv.showStats && inv.casesCompleted !== undefined && (
                        <span>· {inv.casesCompleted} cases</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA: Join network */}
      <section className="py-16 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
            Are you a certified investigator?
          </h2>
          <p className="text-brand-100 mb-6 text-sm md:text-base">
            Join our network. Get qualified case leads, access to LedgerHound tools, and a transparent referral structure.
          </p>
          <Link
            href={`${base}/join-network`}
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
          >
            Join Our Network <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
