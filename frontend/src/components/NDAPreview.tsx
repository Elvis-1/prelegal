'use client';

import { NDAFormData, pluralYears } from '@/types/nda';

interface Props {
  data: NDAFormData;
}

/** Renders a filled value or a highlighted placeholder if empty. */
function Val({ value, placeholder }: { value: string; placeholder: string }) {
  if (value.trim()) {
    return <span className="text-blue-800 font-semibold">{value.trim()}</span>;
  }
  return (
    <span className="bg-amber-100 text-amber-700 rounded px-0.5 italic text-[0.95em]">
      [{placeholder}]
    </span>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getMndaTerm(data: NDAFormData): string {
  if (data.mndaTermType === 'continues') return 'continues until terminated';
  const y = pluralYears(data.mndaTermYears);
  return y ? `${y} from Effective Date` : '';
}

function getConfidentialityTerm(data: NDAFormData): string {
  if (data.confidentialityTermType === 'perpetuity') return 'in perpetuity';
  const y = pluralYears(data.confidentialityTermYears);
  return y ? `${y} from Effective Date` : '';
}

function Divider() {
  return <hr className="my-8 border-gray-300" />;
}

export default function NDAPreview({ data }: Props) {
  const effectiveDate = formatDate(data.effectiveDate);
  const mndaTerm = getMndaTerm(data);
  const confidentialityTerm = getConfidentialityTerm(data);

  const P = ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 text-justify leading-relaxed">{children}</p>
  );

  return (
    <div className="py-8 px-6">
      <div
        id="nda-document"
        className="bg-white shadow-lg max-w-3xl mx-auto p-14 font-serif text-gray-900 text-[14px] leading-relaxed"
      >
        {/* ── COVER PAGE ── */}
        <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          Common Paper Mutual NDA Standard Terms Version 1.0
        </p>

        <P>
          This Mutual Non-Disclosure Agreement (the &ldquo;<strong>MNDA</strong>&rdquo;) consists of: (1) this
          Cover Page (&ldquo;<strong>Cover Page</strong>&rdquo;) and (2) the Common Paper Mutual NDA Standard
          Terms Version 1.0 (&ldquo;<strong>Standard Terms</strong>&rdquo;) identical to those posted at{' '}
          <a
            href="https://commonpaper.com/standards/mutual-nda/1.0"
            className="text-blue-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            commonpaper.com/standards/mutual-nda/1.0
          </a>
          . Any modifications of the Standard Terms should be made on the Cover Page, which will
          control over conflicts with the Standard Terms.
        </P>

        <div className="space-y-5 mb-8">
          {/* Purpose */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Purpose</h3>
            <p className="text-xs text-gray-500 mb-1">How Confidential Information may be used</p>
            <p>
              <Val value={data.purpose} placeholder="Purpose — how Confidential Information may be used" />
            </p>
          </div>

          {/* Effective Date */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Effective Date</h3>
            <p>
              <Val value={effectiveDate} placeholder="Effective Date" />
            </p>
          </div>

          {/* MNDA Term */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">MNDA Term</h3>
            <p className="text-xs text-gray-500 mb-1">The length of this MNDA</p>
            <p>
              <Val value={mndaTerm} placeholder="MNDA Term" />
              {mndaTerm && '.'}
            </p>
          </div>

          {/* Term of Confidentiality */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Term of Confidentiality</h3>
            <p className="text-xs text-gray-500 mb-1">How long Confidential Information is protected</p>
            <p>
              <Val value={confidentialityTerm} placeholder="Term of Confidentiality" />
              {data.confidentialityTermType !== 'perpetuity' && confidentialityTerm && (
                <>, but in the case of trade secrets until Confidential Information is no
                longer considered a trade secret under applicable laws.</>
              )}
            </p>
          </div>

          {/* Governing Law */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Governing Law &amp; Jurisdiction</h3>
            <p>
              <span className="font-semibold">Governing Law:</span>{' '}
              <Val value={data.governingLaw} placeholder="State" />
            </p>
            <p className="mt-1">
              <span className="font-semibold">Jurisdiction:</span>{' '}
              <Val value={data.jurisdiction} placeholder="City or county and state" />
            </p>
          </div>

          {/* Modifications */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-1">MNDA Modifications</h3>
            <p>
              {data.modifications.trim() ? data.modifications : (
                <span className="text-gray-400 italic">None.</span>
              )}
            </p>
          </div>
        </div>

        {/* Signature Table */}
        <p className="mb-4 text-sm">
          By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
        </p>
        <table className="w-full border-collapse text-sm mb-2">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2 text-left w-1/4 bg-gray-50"></th>
              <th className="border border-gray-400 p-2 text-center bg-gray-50">PARTY 1</th>
              <th className="border border-gray-400 p-2 text-center bg-gray-50">PARTY 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">Signature</td>
              <td className="border border-gray-400 p-2 h-12"></td>
              <td className="border border-gray-400 p-2 h-12"></td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">Print Name</td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party1.name} placeholder="Name" />
              </td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party2.name} placeholder="Name" />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">Title</td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party1.title} placeholder="Title" />
              </td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party2.title} placeholder="Title" />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">Company</td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party1.company} placeholder="Company" />
              </td>
              <td className="border border-gray-400 p-2">
                <Val value={data.party2.company} placeholder="Company" />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">
                Notice Address
                <span className="block text-xs font-normal text-gray-500">Email or postal</span>
              </td>
              <td className="border border-gray-400 p-2 whitespace-pre-wrap">
                <Val value={data.party1.noticeAddress} placeholder="Email or address" />
              </td>
              <td className="border border-gray-400 p-2 whitespace-pre-wrap">
                <Val value={data.party2.noticeAddress} placeholder="Email or address" />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-medium bg-gray-50">Date</td>
              <td className="border border-gray-400 p-2 h-10"></td>
              <td className="border border-gray-400 p-2 h-10"></td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-gray-500 mb-2">
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>

        <Divider />

        {/* ── STANDARD TERMS ── */}
        <h2 className="text-xl font-bold mb-6 text-center">Standard Terms</h2>

        <P>
          <strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates
          these Standard Terms and the Cover Page (defined below)) (&ldquo;<strong>MNDA</strong>&rdquo;) allows
          each party (&ldquo;<strong>Disclosing Party</strong>&rdquo;) to disclose or make available information
          in connection with the <Val value={data.purpose} placeholder="Purpose" /> which (1) the
          Disclosing Party identifies to the receiving party (&ldquo;<strong>Receiving Party</strong>&rdquo;) as
          &ldquo;confidential&rdquo;, &ldquo;proprietary&rdquo;, or the like or (2) should be reasonably understood
          as confidential or proprietary due to its nature and the circumstances of its disclosure
          (&ldquo;<strong>Confidential Information</strong>&rdquo;). Each party&rsquo;s Confidential Information also
          includes the existence and status of the parties&rsquo; discussions and information on the Cover
          Page. Confidential Information includes technical or business information, product designs
          or roadmaps, requirements, pricing, security and compliance documentation, technology,
          inventions and know-how. To use this MNDA, the parties must complete and sign a cover
          page incorporating these Standard Terms (&ldquo;<strong>Cover Page</strong>&rdquo;). Each party is
          identified on the Cover Page and capitalized terms have the meanings given herein or on
          the Cover Page.
        </P>

        <P>
          <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party
          shall: (a) use Confidential Information solely for the{' '}
          <Val value={data.purpose} placeholder="Purpose" />; (b) not disclose Confidential Information
          to third parties without the Disclosing Party&rsquo;s prior written approval, except that the
          Receiving Party may disclose Confidential Information to its employees, agents, advisors,
          contractors and other representatives having a reasonable need to know for the{' '}
          <Val value={data.purpose} placeholder="Purpose" />, provided these representatives are bound by
          confidentiality obligations no less protective of the Disclosing Party than the applicable
          terms in this MNDA and the Receiving Party remains responsible for their compliance with
          this MNDA; and (c) protect Confidential Information using at least the same protections
          the Receiving Party uses for its own similar information but no less than a reasonable
          standard of care.
        </P>

        <P>
          <strong>3. Exceptions.</strong> The Receiving Party&rsquo;s obligations in this MNDA do not apply
          to information that it can demonstrate: (a) is or becomes publicly available through no
          fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from
          the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from
          a third party without confidentiality restrictions; or (d) it independently developed
          without using or referencing the Confidential Information.
        </P>

        <P>
          <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose
          Confidential Information to the extent required by law, regulation or regulatory
          authority, subpoena or court order, provided (to the extent legally permitted) it
          provides the Disclosing Party reasonable advance notice of the required disclosure and
          reasonably cooperates, at the Disclosing Party&rsquo;s expense, with the Disclosing Party&rsquo;s
          efforts to obtain confidential treatment for the Confidential Information.
        </P>

        <P>
          <strong>5. Term and Termination.</strong> This MNDA commences on the{' '}
          <Val value={effectiveDate} placeholder="Effective Date" /> and expires at the end of the{' '}
          <Val value={mndaTerm} placeholder="MNDA Term" />. Either party may terminate this MNDA
          for any or no reason upon written notice to the other party. The Receiving Party&rsquo;s
          obligations relating to Confidential Information will survive for the{' '}
          <Val value={confidentialityTerm} placeholder="Term of Confidentiality" />, despite any
          expiration or termination of this MNDA.
        </P>

        <P>
          <strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or
          termination of this MNDA or upon the Disclosing Party&rsquo;s earlier request, the Receiving
          Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing
          Party&rsquo;s written request, destroy all Confidential Information in the Receiving Party&rsquo;s
          possession or control or return it to the Disclosing Party; and (c) if requested by the
          Disclosing Party, confirm its compliance with these obligations in writing. As an
          exception to subsection (b), the Receiving Party may retain Confidential Information in
          accordance with its standard backup or record retention policies or as required by law,
          but the terms of this MNDA will continue to apply to the retained Confidential
          Information.
        </P>

        <P>
          <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its
          intellectual property and other rights in its Confidential Information and its disclosure
          to the Receiving Party grants no license under such rights.
        </P>

        <P>
          <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS IS&rdquo;, WITH ALL
          FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY
          AND FITNESS FOR A PARTICULAR PURPOSE.
        </P>

        <P>
          <strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating
          hereto are governed by, and construed in accordance with, the laws of the State of{' '}
          <Val value={data.governingLaw} placeholder="Governing Law" />, without regard to the conflict
          of laws provisions of such{' '}
          <Val value={data.governingLaw} placeholder="Governing Law" />. Any legal suit, action, or
          proceeding relating to this MNDA must be instituted in the federal or state{' '}
          <Val value={data.jurisdiction} placeholder="Jurisdiction" />. Each party irrevocably submits
          to the exclusive jurisdiction of such{' '}
          <Val value={data.jurisdiction} placeholder="Jurisdiction" /> in any such suit, action, or
          proceeding.
        </P>

        <P>
          <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm
          for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the
          Disclosing Party is entitled to seek appropriate equitable relief, including an
          injunction, in addition to its other remedies.
        </P>

        <P>
          <strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose
          Confidential Information to the other or proceed with any proposed transaction. Neither
          party may assign this MNDA without the prior written consent of the other party, except
          that either party may assign this MNDA in connection with a merger, reorganization,
          acquisition or other transfer of all or substantially all its assets or voting securities.
          Any assignment in violation of this Section is null and void. This MNDA will bind and
          inure to the benefit of each party&rsquo;s permitted successors and assigns. Waivers must be
          signed by the waiving party&rsquo;s authorized representative and cannot be implied from
          conduct. If any provision of this MNDA is held unenforceable, it will be limited to the
          minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including
          the Cover Page) constitutes the entire agreement of the parties with respect to its
          subject matter, and supersedes all prior and contemporaneous understandings, agreements,
          representations, and warranties, whether written or oral, regarding such subject matter.
          This MNDA may only be amended, modified, waived, or supplemented by an agreement in
          writing signed by both parties. Notices, requests and approvals under this MNDA must be
          sent in writing to the email or postal addresses on the Cover Page and are deemed
          delivered on receipt. This MNDA may be executed in counterparts, including electronic
          copies, each of which is deemed an original and which together form the same agreement.
        </P>

        <p className="text-xs text-gray-500 mt-8">
          Common Paper Mutual Non-Disclosure Agreement{' '}
          <a
            href="https://commonpaper.com/standards/mutual-nda/1.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Version 1.0
          </a>{' '}
          free to use under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
      </div>
    </div>
  );
}
