export interface PartyDetails {
  company: string;
  name: string;
  title: string;
  noticeAddress: string;
}

export interface NDAFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: 'expires' | 'continues';
  mndaTermYears: string;
  confidentialityTermType: 'years' | 'perpetuity';
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyDetails;
  party2: PartyDetails;
}

export const initialFormData: NDAFormData = {
  purpose: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  mndaTermType: 'expires',
  mndaTermYears: '1',
  confidentialityTermType: 'years',
  confidentialityTermYears: '1',
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1: { company: '', name: '', title: '', noticeAddress: '' },
  party2: { company: '', name: '', title: '', noticeAddress: '' },
};
