'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      language: string;
      theme: 'light';
      size: 'flexible';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'timeout-callback': () => void;
      'error-callback': () => boolean;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ledgerhound-turnstile]');
    const script = existing || document.createElement('script');
    const handleLoad = () => window.turnstile
      ? resolve(window.turnstile)
      : reject(new Error('Turnstile did not initialize'));
    const handleError = () => reject(new Error('Turnstile script failed to load'));
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.ledgerhoundTurnstile = 'true';
      document.head.appendChild(script);
    }
  }).catch((error) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

export default function TurnstileWidget({
  locale,
  onToken,
  onUnavailable,
  unavailableLabel,
}: {
  locale: string;
  onToken: (token: string) => void;
  onUnavailable: () => void;
  unavailableLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const onUnavailableRef = useRef(onUnavailable);
  const [siteKey, setSiteKey] = useState('');
  const [loadError, setLoadError] = useState(false);
  onTokenRef.current = onToken;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/non-crypto-scam-database/challenge', {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.siteKey) throw new Error(body.error || 'Security check unavailable');
        setSiteKey(String(body.siteKey));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setLoadError(true);
        onUnavailableRef.current();
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let active = true;
    let widgetId = '';

    loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: 'payment_report',
          language: locale,
          theme: 'light',
          size: 'flexible',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'timeout-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            onTokenRef.current('');
            setLoadError(true);
            onUnavailableRef.current();
            return true;
          },
        });
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        onUnavailableRef.current();
      });

    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenRef.current('');
    };
  }, [locale, siteKey]);

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px] w-full" />
      {loadError && (
        <p className="mt-2 text-xs font-semibold text-red-700" role="alert">
          {unavailableLabel}
        </p>
      )}
    </div>
  );
}
