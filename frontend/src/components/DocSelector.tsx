'use client';

import { useState } from 'react';
import { CatalogEntry } from '@/types/document';

interface Props {
  catalog: CatalogEntry[];
  onSelect: (entry: CatalogEntry) => void;
}

export default function DocSelector({ catalog, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? catalog.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.description.toLowerCase().includes(query.toLowerCase()),
      )
    : catalog;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header
        className="h-14 flex items-center px-6 shrink-0"
        style={{ backgroundColor: '#032147' }}
      >
        <span className="text-white text-base font-bold tracking-tight">Prelegal</span>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <h1
            className="text-3xl font-bold mb-2 text-center"
            style={{ color: '#032147' }}
          >
            What document would you like to create?
          </h1>
          <p className="text-center mb-8" style={{ color: '#888888' }}>
            Select a document type and our AI will guide you through filling it in.
          </p>

          {/* Search */}
          <div className="relative mb-8 max-w-md mx-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Document grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-8">
              No documents match your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => onSelect(entry)}
                  className="text-left bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  {/* Document icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: '#209dd720' }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      style={{ color: '#209dd7' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <h3
                    className="font-semibold text-sm mb-1.5 group-hover:text-blue-600 transition-colors"
                    style={{ color: '#032147' }}
                  >
                    {entry.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#888888' }}>
                    {entry.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
