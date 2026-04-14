'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DocSelector from '@/components/DocSelector';
import DocChat from '@/components/DocChat';
import DocPreview from '@/components/DocPreview';
import { CatalogEntry, DocumentFields } from '@/types/document';
import { clearToken, getToken, isAuthenticated } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<CatalogEntry | null>(null);
  const [fields, setFields] = useState<DocumentFields>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setReady(true);
    fetchCatalog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchCatalog() {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/catalog`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setCatalog(await res.json());
      }
    } catch {
      // Silently fail — catalog will be empty, selector won't show
    }
  }

  function handleSelectDoc(entry: CatalogEntry) {
    setSelectedDoc(entry);
    setFields({});
  }

  function handleComplete() {
    setFields({});
  }

  function handleChangeDoc() {
    setSelectedDoc(null);
    setFields({});
  }

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  if (!ready) return null;

  // Step 0: document selector
  if (!selectedDoc) {
    return <DocSelector catalog={catalog} onSelect={handleSelectDoc} />;
  }

  // Step 1: split-screen workspace
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="text-white h-14 flex items-center justify-between px-6 shrink-0" style={{ backgroundColor: '#032147' }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-bold tracking-tight shrink-0">Prelegal</span>
          <span className="text-slate-500 text-sm select-none">/</span>
          <button
            onClick={handleChangeDoc}
            className="text-slate-300 text-sm hover:text-white transition-colors truncate"
            title="Change document type"
          >
            {selectedDoc.name}
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#209dd7' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
              Chat with the AI to fill in your {selectedDoc.name}. The document updates live on the right as fields are collected.
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <DocChat
              documentType={selectedDoc.key}
              documentName={selectedDoc.name}
              fields={fields}
              onChange={setFields}
              onComplete={handleComplete}
            />
          </div>
        </aside>

        {/* Preview Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <DocPreview documentName={selectedDoc.name} fields={fields} />
        </main>
      </div>
    </div>
  );
}
