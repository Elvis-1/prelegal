'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NDAChat from '@/components/NDAChat';
import NDAPreview from '@/components/NDAPreview';
import { initialFormData, NDAFormData } from '@/types/nda';
import { clearToken, isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState<NDAFormData>(initialFormData);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  function handleComplete() {
    setFormData(initialFormData);
  }

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  if (!ready) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-slate-900 text-white h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight">Prelegal</span>
          <span className="text-slate-500 text-sm select-none">/</span>
          <span className="text-slate-300 text-sm">Mutual NDA Creator</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <aside className="w-[420px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 shrink-0">
            <p className="text-xs text-gray-500">
              Chat with the AI to fill in your NDA. The document updates live on the right as fields are collected.
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <NDAChat data={formData} onChange={setFormData} onComplete={handleComplete} />
          </div>
        </aside>

        {/* Preview Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <NDAPreview data={formData} />
        </main>
      </div>
    </div>
  );
}
