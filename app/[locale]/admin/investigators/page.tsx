'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2, CheckCircle2, X, Users, Mail, Globe, Award, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { Investigator } from '@/lib/investigators/schema';

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/check-env', { headers: { 'x-admin-key': pw } });
      if (res.ok) {
        localStorage.setItem('admin-pw', pw);
        onAuth(pw);
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Connection error');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-5">
          <Lock size={20} className="text-slate-500" />
        </div>
        <h1 className="font-bold text-lg text-slate-900 text-center mb-1">Admin: Investigators</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Enter admin password</p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-3 outline-none focus:border-slate-400" autoFocus />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} disabled={!pw || checking}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40">
          {checking ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

function AdminUI({ adminPw }: { adminPw: string }) {
  const [tab, setTab] = useState<'applications' | 'approved'>('applications');
  const [items, setItems] = useState<Investigator[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/investigators/admin?type=${tab}`, {
        headers: { 'x-admin-key': adminPw },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function action(id: string, act: 'approve' | 'reject' | 'delete' | 'update', updates?: any) {
    if (act === 'reject' && !confirm('Reject and delete this application?')) return;
    if (act === 'delete' && !confirm('Permanently delete this investigator profile?')) return;
    setActioningId(id);
    try {
      const res = await fetch('/api/investigators/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminPw },
        body: JSON.stringify({ action: act, id, updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setActioningId('');
  }

  async function toggleActive(inv: Investigator) {
    await action(inv.id, 'update', { isActive: !inv.isActive });
  }
  async function toggleVerified(inv: Investigator, field: 'identityVerified' | 'certificationVerified' | 'topInvestigator') {
    await action(inv.id, 'update', { [field]: !inv[field] });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Investigator Network · Admin</h1>
              <p className="text-xs text-slate-400">Review applications, manage approved profiles</p>
            </div>
          </div>
          <button type="button" onClick={load} className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          <button type="button" onClick={() => setTab('applications')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${tab === 'applications' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            Pending Applications
          </button>
          <button type="button" onClick={() => setTab('approved')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg ${tab === 'approved' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            Approved Profiles
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Loader2 size={20} className="text-slate-400 animate-spin mx-auto" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Users size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {tab === 'applications' ? 'No pending applications' : 'No approved investigators yet'}
            </p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {items.map((inv) => (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900">{inv.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <a href={`mailto:${inv.email}`} className="flex items-center gap-1 hover:text-slate-900">
                      <Mail size={11} /> {inv.email}
                    </a>
                    {inv.phone && <span>· {inv.phone}</span>}
                    <span>· {inv.city}, {inv.country}</span>
                    <span>· {inv.yearsExperience}y</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {inv.certifications.map((c) => (
                      <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {tab === 'applications' ? (
                    <>
                      <button type="button" onClick={() => action(inv.id, 'approve')} disabled={actioningId === inv.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-1">
                        {actioningId === inv.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Approve
                      </button>
                      <button type="button" onClick={() => action(inv.id, 'reject')} disabled={actioningId === inv.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 flex items-center gap-1">
                        <X size={11} /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => toggleActive(inv)} disabled={actioningId === inv.id || inv.isTeam}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${inv.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'} disabled:opacity-40`}>
                        {inv.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        {inv.isActive ? 'Visible' : 'Hidden'}
                      </button>
                      <button type="button" onClick={() => action(inv.id, 'delete')} disabled={actioningId === inv.id || inv.isTeam}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 flex items-center gap-1">
                        <X size={11} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{inv.bio}</p>

              <div className="grid sm:grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">Specializations</p>
                  <p className="text-slate-700">{inv.specializations.join(', ')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider mb-1 text-[10px]">Languages</p>
                  <p className="text-slate-700">{inv.languages.join(', ')}</p>
                </div>
              </div>

              {inv.sampleCaseStudy && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-900">Sample case study</summary>
                  <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{inv.sampleCaseStudy}</p>
                </details>
              )}

              {(inv.linkedinUrl || inv.websiteUrl) && (
                <div className="flex gap-3 mt-3 text-xs">
                  {inv.linkedinUrl && <a href={inv.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600">LinkedIn ↗</a>}
                  {inv.websiteUrl && <a href={inv.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-600">Website ↗</a>}
                </div>
              )}

              {tab === 'approved' && !inv.isTeam && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleVerified(inv, 'identityVerified')}
                    className={`text-[10px] font-semibold px-2 py-1 rounded ${inv.identityVerified ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {inv.identityVerified ? '✓' : '○'} ID Verified
                  </button>
                  <button type="button" onClick={() => toggleVerified(inv, 'certificationVerified')}
                    className={`text-[10px] font-semibold px-2 py-1 rounded ${inv.certificationVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {inv.certificationVerified ? '✓' : '○'} Certs Verified
                  </button>
                  <button type="button" onClick={() => toggleVerified(inv, 'topInvestigator')}
                    className={`text-[10px] font-semibold px-2 py-1 rounded ${inv.topInvestigator ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {inv.topInvestigator ? '✓' : '○'} Top Investigator
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminInvestigatorsPage() {
  const [authed, setAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const saved = localStorage.getItem('admin-pw');
    if (saved) {
      fetch('/api/check-env', { headers: { 'x-admin-key': saved } }).then((res) => {
        if (res.ok) {
          setAdminPw(saved);
          setAuthed(true);
        } else {
          localStorage.removeItem('admin-pw');
        }
      });
    }
  }, []);

  if (!hydrated) return null;
  if (!authed) {
    return <PasswordGate onAuth={(pw) => { setAdminPw(pw); setAuthed(true); }} />;
  }
  return <AdminUI adminPw={adminPw} />;
}
