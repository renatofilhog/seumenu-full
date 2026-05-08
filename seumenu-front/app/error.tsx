'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-4xl">😕</p>
      <h2 className="text-xl font-bold text-gray-800">Algo deu errado</h2>
      <p className="text-gray-500">Tivemos um problema ao carregar esta página.</p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Tentar novamente
      </button>
    </div>
  );
}
