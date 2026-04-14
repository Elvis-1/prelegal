'use client';

import { NDAFormData, PartyDetails } from '@/types/nda';

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-gray-100 pb-2 mb-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

interface PartyFieldsProps {
  label: string;
  party: PartyDetails;
  onChange: (party: PartyDetails) => void;
}

function PartyFields({ label, party, onChange }: PartyFieldsProps) {
  const set = (key: keyof PartyDetails) => (v: string) =>
    onChange({ ...party, [key]: v });

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <Field label="Company" value={party.company} onChange={set('company')} placeholder="Acme Inc." />
      <Field label="Signatory Name" value={party.name} onChange={set('name')} placeholder="Jane Smith" />
      <Field label="Title" value={party.title} onChange={set('title')} placeholder="CEO" />
      <TextArea
        label="Notice Address (email or postal)"
        value={party.noticeAddress}
        onChange={set('noticeAddress')}
        placeholder="legal@acme.com"
        rows={2}
      />
    </div>
  );
}

export default function NDAForm({ data, onChange }: Props) {
  const set = <K extends keyof NDAFormData>(key: K) =>
    (value: NDAFormData[K]) => onChange({ ...data, [key]: value });

  return (
    <div className="p-6 space-y-8">
      {/* Document Details */}
      <section>
        <SectionHeader
          title="Document Details"
          subtitle="Core terms of the NDA"
        />
        <div className="space-y-4">
          <TextArea
            label="Purpose"
            value={data.purpose}
            onChange={set('purpose')}
            placeholder="Evaluating whether to enter into a business relationship with the other party."
            rows={3}
          />
          <Field
            label="Effective Date"
            value={data.effectiveDate}
            onChange={set('effectiveDate')}
            type="date"
          />
        </div>
      </section>

      {/* MNDA Term */}
      <section>
        <SectionHeader title="MNDA Term" subtitle="Length of this agreement" />
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              value="expires"
              checked={data.mndaTermType === 'expires'}
              onChange={() => onChange({ ...data, mndaTermType: 'expires' })}
              className="mt-0.5 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Expires after</span>
            {data.mndaTermType === 'expires' && (
              <div className="flex items-center gap-2 -mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={data.mndaTermYears}
                  onChange={(e) => onChange({ ...data, mndaTermYears: e.target.value })}
                  className="w-16 border border-gray-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">year(s) from Effective Date</span>
              </div>
            )}
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              value="continues"
              checked={data.mndaTermType === 'continues'}
              onChange={() => onChange({ ...data, mndaTermType: 'continues' })}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Continues until terminated</span>
          </label>
        </div>
      </section>

      {/* Term of Confidentiality */}
      <section>
        <SectionHeader title="Term of Confidentiality" subtitle="How long confidential information is protected" />
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              value="years"
              checked={data.confidentialityTermType === 'years'}
              onChange={() => onChange({ ...data, confidentialityTermType: 'years' })}
              className="mt-0.5 accent-blue-600"
            />
            <span className="text-sm text-gray-700">Expires after</span>
            {data.confidentialityTermType === 'years' && (
              <div className="flex items-center gap-2 -mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={data.confidentialityTermYears}
                  onChange={(e) => onChange({ ...data, confidentialityTermYears: e.target.value })}
                  className="w-16 border border-gray-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">year(s) from Effective Date</span>
              </div>
            )}
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              value="perpetuity"
              checked={data.confidentialityTermType === 'perpetuity'}
              onChange={() => onChange({ ...data, confidentialityTermType: 'perpetuity' })}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">In perpetuity</span>
          </label>
        </div>
      </section>

      {/* Jurisdiction */}
      <section>
        <SectionHeader title="Governing Law & Jurisdiction" />
        <div className="space-y-4">
          <Field
            label="Governing Law (State)"
            value={data.governingLaw}
            onChange={set('governingLaw')}
            placeholder="Delaware"
          />
          <Field
            label="Jurisdiction (City/County & State)"
            value={data.jurisdiction}
            onChange={set('jurisdiction')}
            placeholder="courts located in New Castle, DE"
          />
        </div>
      </section>

      {/* Modifications */}
      <section>
        <SectionHeader title="Modifications" subtitle="Optional — list any changes to standard terms" />
        <TextArea
          label="MNDA Modifications"
          value={data.modifications}
          onChange={set('modifications')}
          placeholder="None."
          rows={3}
        />
      </section>

      {/* Party 1 */}
      <section>
        <SectionHeader title="Party 1" />
        <PartyFields
          label="Disclosing / Receiving Party 1"
          party={data.party1}
          onChange={set('party1')}
        />
      </section>

      {/* Party 2 */}
      <section>
        <SectionHeader title="Party 2" />
        <PartyFields
          label="Disclosing / Receiving Party 2"
          party={data.party2}
          onChange={set('party2')}
        />
      </section>
    </div>
  );
}
