'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error_page');

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('body')}
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {t('retry')}
        </button>
        <p className="mt-4 text-sm text-gray-500">
          {t('contact_prefix')}{' '}
          <a href="mailto:contact@ledgerhound.vip" className="text-blue-600">
            {t('support')}
          </a>
        </p>
      </div>
    </div>
  );
}
