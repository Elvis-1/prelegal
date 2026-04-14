'use client';

import { useState } from 'react';
import NDAForm from '@/components/NDAForm';
import NDAPreview from '@/components/NDAPreview';
import { initialFormData, NDAFormData } from '@/types/nda';

export default function Home() {
  const [formData, setFormData] = useState<NDAFormData>(initialFormData);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-slate-900 text-white h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight">Prelegal</span>
          <span className="text-slate-500 text-sm select-none">/</span>
          <span className="text-slate-300 text-sm">Mutual NDA Creator</span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download PDF
        </button>
      </header>

      {/* Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form Panel */}
        <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-3 z-10">
            <p className="text-xs text-gray-500">
              Fill in the fields on the left — the document updates live on the right.
              <br />
              <span className="bg-amber-100 text-amber-700 rounded px-0.5 italic text-[0.9em]">
                [highlighted]
              </span>{' '}
              fields in the preview are still empty.
            </p>
          </div>
          <NDAForm data={formData} onChange={setFormData} />
        </aside>

        {/* Preview Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <NDAPreview data={formData} />
        </main>
      </div>
    </div>
  );
}
