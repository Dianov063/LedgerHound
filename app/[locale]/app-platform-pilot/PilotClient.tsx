'use client';

import { useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import {
  getPilotUser,
  loginPilotUser,
  logoutPilotUser,
  registerPilotUser,
  verifyPilotEmail,
} from '@/lib/app-platform/auth';
import {
  createPaymentSafetyDraft,
  deletePaymentSafetyDraft,
  listPaymentSafetyDrafts,
  updatePaymentSafetyDraft,
} from '@/lib/app-platform/drafts';
import type { PaymentMethodType, PaymentSafetyDraft, ScamCategory } from '@/lib/app-platform/types';

const SESSION_KEY = 'ledgerhound:app-platform-pilot-session:v1';

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'apple_cash', label: 'Apple Cash' },
  { value: 'chime', label: 'Chime' },
  { value: 'wise', label: 'Wise' },
  { value: 'revolut', label: 'Revolut' },
  { value: 'bank_account', label: 'Bank account' },
  { value: 'other', label: 'Other' },
];

const SCAM_CATEGORIES: { value: ScamCategory; label: string }[] = [
  { value: 'non_delivery_goods', label: 'Non-delivery goods' },
  { value: 'fake_service', label: 'Fake service' },
  { value: 'deposit_advance_fee', label: 'Deposit / advance fee' },
  { value: 'rental_scam', label: 'Rental scam' },
  { value: 'ticket_scam', label: 'Ticket scam' },
  { value: 'marketplace_scam', label: 'Marketplace scam' },
  { value: 'employment_scam', label: 'Employment scam' },
  { value: 'other', label: 'Other' },
];

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

export default function PilotClient() {
  const [email, setEmail] = useState(() => `lh-pilot-${Date.now()}@example.invalid`);
  const [password, setPassword] = useState('local-password-123');
  const [verificationCode, setVerificationCode] = useState('');
  const [token, setToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [drafts, setDrafts] = useState<PaymentSafetyDraft[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('Payment safety test draft');
  const [method, setMethod] = useState<PaymentMethodType>('zelle');
  const [category, setCategory] = useState<ScamCategory>('marketplace_scam');
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) || null,
    [drafts, selectedId],
  );

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setStatus(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function refresh(nextToken = token) {
    if (!nextToken) return;
    const result = await listPaymentSafetyDrafts(nextToken);
    setDrafts(result.items);
    if (!selectedId && result.items[0]) setSelectedId(result.items[0].id);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    setToken(saved);
    getPilotUser(saved)
      .then((user) => {
        setUserEmail(user.email);
        return refresh(saved);
      })
      .then(() => setStatus('Session restored'))
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setToken('');
      });
    // Restore once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDraft) return;
    setTitle(selectedDraft.title);
    setMethod((selectedDraft.payment_method_type || 'zelle') as PaymentMethodType);
    setCategory((selectedDraft.scam_category || 'marketplace_scam') as ScamCategory);
    setStep(selectedDraft.progress_step);
  }, [selectedDraft]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-bold text-slate-950">Fake user session</h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input className="input mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              className="input mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-secondary justify-center"
              disabled={busy}
              onClick={() => run(async () => {
                const result = await registerPilotUser(email, password);
                if (result.test_verification_code) setVerificationCode(result.test_verification_code);
                setStatus(`Registered: ${result.user_id}`);
              })}
            >
              Register
            </button>
            <button
              className="btn-secondary justify-center"
              disabled={busy}
              onClick={() => run(async () => {
                await verifyPilotEmail(email, verificationCode);
                setStatus('Email verified');
              })}
            >
              Verify
            </button>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Verification code
            <input className="input mt-1.5" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
          </label>
          <button
            className="btn-primary w-full justify-center"
            disabled={busy}
            onClick={() => run(async () => {
              const session = await loginPilotUser(email, password);
              sessionStorage.setItem(SESSION_KEY, session.access_token);
              setToken(session.access_token);
              const me = await getPilotUser(session.access_token);
              setUserEmail(me.email);
              await refresh(session.access_token);
              setStatus(`Logged in: ${me.email}`);
            })}
          >
            Login
          </button>
          <button
            className="btn-secondary w-full justify-center"
            disabled={busy || !token}
            onClick={() => run(async () => {
              await logoutPilotUser(token);
              sessionStorage.removeItem(SESSION_KEY);
              setToken('');
              setUserEmail('');
              setDrafts([]);
              setSelectedId('');
              setStatus('Logged out');
            })}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">Draft metadata</h2>
            <p className="mt-1 text-sm text-slate-500">{userEmail || 'No active App Platform session'}</p>
          </div>
          <button
            className="btn-secondary"
            disabled={busy || !token}
            onClick={() => run(async () => {
              await refresh();
              setStatus('Drafts refreshed');
            })}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Title
              <input className="input mt-1.5" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700">
                Method
                <select className="input mt-1.5 bg-white" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethodType)}>
                  {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Category
                <select className="input mt-1.5 bg-white" value={category} onChange={(e) => setCategory(e.target.value as ScamCategory)}>
                  {SCAM_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Step
                <input
                  className="input mt-1.5"
                  type="number"
                  min={0}
                  max={6}
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                disabled={busy || !token}
                onClick={() => run(async () => {
                  const draft = await createPaymentSafetyDraft(token, {
                    title,
                    payment_method_type: method,
                    scam_category: category,
                    progress_step: step,
                  });
                  setSelectedId(draft.id);
                  await refresh();
                  setStatus(`Created draft ${draft.id}`);
                })}
              >
                <Plus size={16} />
                Create
              </button>
              <button
                className="btn-secondary"
                disabled={busy || !token || !selectedId}
                onClick={() => run(async () => {
                  const draft = await updatePaymentSafetyDraft(token, selectedId, {
                    title,
                    payment_method_type: method,
                    scam_category: category,
                    progress_step: step,
                  });
                  await refresh();
                  setStatus(`Saved draft ${draft.id}`);
                })}
              >
                <Save size={16} />
                Save
              </button>
              <button
                className="btn-secondary text-red-600 hover:text-red-700"
                disabled={busy || !token || !selectedId}
                onClick={() => run(async () => {
                  await deletePaymentSafetyDraft(token, selectedId);
                  setSelectedId('');
                  await refresh();
                  setStatus('Draft deleted');
                })}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {status}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">
              Own drafts
            </div>
            <div className="max-h-[360px] overflow-auto">
              {drafts.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">No account-backed drafts yet.</div>
              ) : drafts.map((draft) => (
                <button
                  key={draft.id}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 ${selectedId === draft.id ? 'bg-brand-50' : ''}`}
                  onClick={() => setSelectedId(draft.id)}
                >
                  <span className="block font-semibold text-slate-900">{draft.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    step {draft.progress_step} · {new Date(draft.updated_at).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
