'use client';

import { DocumentFields } from '@/types/document';

interface Props {
  documentName: string;
  fields: DocumentFields;
}

/** Renders a filled value or an amber placeholder if empty. */
function Val({ value, label }: { value: string; label: string }) {
  if (value && value.trim() && value !== 'None.' && value !== 'None') {
    return <span className="text-blue-800 font-semibold">{value.trim()}</span>;
  }
  if (value === 'None.' || value === 'None') {
    return <span className="text-gray-500 italic">{value}</span>;
  }
  return (
    <span className="bg-amber-100 text-amber-700 rounded px-0.5 italic text-[0.95em]">
      [{label}]
    </span>
  );
}

/** Format a YYYY-MM-DD date string to a readable form. */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Convert a camelCase or snake_case key to a human-readable label. */
function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

interface FieldGroup {
  title: string;
  keys: string[];
}

function groupFields(fields: DocumentFields): FieldGroup[] {
  const allKeys = Object.keys(fields);

  const party1Keys = allKeys.filter((k) => k.startsWith('party1_'));
  const party2Keys = allKeys.filter((k) => k.startsWith('party2_'));
  const otherKeys = allKeys.filter((k) => !k.startsWith('party1_') && !k.startsWith('party2_'));

  const groups: FieldGroup[] = [];

  if (otherKeys.length > 0) {
    groups.push({ title: 'Document Details', keys: otherKeys });
  }
  if (party1Keys.length > 0) {
    groups.push({ title: 'First Party', keys: party1Keys });
  }
  if (party2Keys.length > 0) {
    groups.push({ title: 'Second Party', keys: party2Keys });
  }

  return groups;
}

function FieldRow({ fieldKey, value }: { fieldKey: string; value: string }) {
  const label = toLabel(fieldKey.replace(/^party\d_/, ''));
  const isDate = fieldKey.toLowerCase().includes('date') && value;
  const displayValue = isDate ? formatDate(value) || value : value;

  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#888888' }}>
        {label}
      </span>
      <span className="text-sm">
        <Val value={displayValue} label={label} />
      </span>
    </div>
  );
}

export default function DocPreview({ documentName, fields }: Props) {
  const groups = groupFields(fields);
  const totalFields = Object.keys(fields).length;
  const filledFields = Object.values(fields).filter((v) => v && v.trim()).length;
  const pct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="min-h-full p-8">
      <div
        id="doc-document"
        className="max-w-3xl mx-auto bg-white shadow-sm rounded-2xl overflow-hidden"
      >
        {/* Document header */}
        <div className="px-8 py-6 border-b border-gray-100" style={{ backgroundColor: '#032147' }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#209dd7' }}>
            Legal Document
          </p>
          <h1 className="text-xl font-bold text-white">{documentName}</h1>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#209dd780' }}>
              <span>{filledFields} of {totalFields} fields collected</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: '#ffffff20' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: '#ecad0a' }}
              />
            </div>
          </div>
        </div>

        {/* Field groups */}
        <div className="divide-y divide-gray-100">
          {groups.map((group) => (
            <div key={group.title} className="px-8 py-5">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#032147' }}>
                {group.title}
              </h2>
              <div>
                {group.keys.map((key) => (
                  <FieldRow key={key} fieldKey={key} value={fields[key] ?? ''} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {pct === 100 && (
          <div className="px-8 py-5 border-t border-gray-100 bg-green-50 text-center">
            <p className="text-sm font-medium text-green-700">
              All fields collected — your document is ready to download.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
