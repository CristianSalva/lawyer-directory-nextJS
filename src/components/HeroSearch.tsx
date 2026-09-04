'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toSlug } from '@/lib/slugs'

interface StateEntry { state: string; state_abbr: string; slug: string }

const PRACTICE_AREAS = [
  'Administrative Law','Admiralty and Maritime','Adoption','ADR Arbitration and Mediation',
  'Agriculture','Airplane Bus and Helicopter Accidents','Animal and Dog Bites','Antitrust',
  'Asbestos Mesothelioma','Assault and Battery (Plaintiff)','Auto Dealer Fraud','Aviation',
  'Bad Faith Insurance','Banking and Finance Law','Bankruptcy','Birth Injury','Brain Injury',
  'Business and Commercial Law','Business Organizations','Cannabis Law','Car Accidents',
  'Child Custody','Child Support','Civil Rights','Class Actions','Collaborative Law',
  'Collections','Communications and Media Law','Constitutional Law','Construction',
  'Construction Accident','Consumer Protection','Contracts','Copyrights','Credit Repair',
  'Criminal Defense','Dangerous Products','Debtor and Creditor','Defamation',
  'Disability Insurance','Discrimination','Divorce and Separation','Domestic Violence',
  'Drug Crime','Drugs and Medical Devices','DUI and DWI','Education','Elder Law',
  'Election Campaign and Political Law','Eminent Domain','Employment Law (Employer)',
  'Employment Rights','Entertainment Sports and Leisure Law','Environmental Law','ERISA',
  'Estate Planning','Ethics and Professional Responsibility','Family Law',"Father's Rights",
  'Federal and White Collar Crimes','Foreclosure and Alternatives','Franchising','Gaming',
  'Government Agencies and Programs','Government Contracts','Health Care Law',
  'Housing and Construction Defects','Immigration','Insurance Defense','Insurance Law',
  'International Law','Internet','Labor Law','Land Use and Zoning','Landlord and Tenant',
  'Legal Malpractice','Lemon Law','Litigation and Appeals','Medical Malpractice',
  'Mergers and Acquisitions','Military','Military Divorce','Motor Vehicle Defects',
  'Native Peoples','Natural Resources','Nursing Home Abuse','Oil Gas and Energy','Patents',
  'Personal Injury','Personal Injury Defense','Premises Liability','Probate',
  'Professional Malpractice','Railroad Worker Injury and FELA','Real Estate','Same Sex',
  'Science and Technology Law','Securities','Sex Crime','Sexual Abuse','Sexual Harassment',
  'Social Security','Social Security Disability','State Local and Municipal Law',
  'Tax Increment Financing','Tax Law','Toxic Mold','Toxic Torts','Trademarks',
  'Traffic Ticket','Transportation','Truck Accident','Trusts',"Veteran's Benefits",
  'Wage and Hour','Whistleblower and Qui Tam','Wills',"Workers' Compensation",
  'Wrongful Death','Wrongful Termination',
]

export default function HeroSearch({ states }: { states: StateEntry[] }) {
  const router = useRouter()
  const [stateSlug, setStateSlug] = useState('')
  const [area, setArea] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stateSlug && area) {
      router.push(`/${stateSlug}/${toSlug(area)}`)
    } else if (stateSlug) {
      router.push(`/${stateSlug}`)
    } else if (area) {
      router.push(`/attorneys/${toSlug(area)}`)
    } else {
      router.push('/attorneys')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hero-search-form">
      <div className="hsf-field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#AAAAAA"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>
        <select
          value={stateSlug}
          onChange={e => setStateSlug(e.target.value)}
          aria-label="Select State"
          className={`hsf-select${stateSlug === '' ? ' hsf-select--empty' : ''}`}
        >
          <option value="">Select a State</option>
          {states.map(s => (
            <option key={s.slug} value={s.slug}>{s.state}</option>
          ))}
        </select>
      </div>
      <div className="hsf-field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6h-2.18c.07-.44.18-.87.18-1.32C18 3.19 16.81 2 15.32 2c-.98 0-1.75.67-2.48 1.36L12 4.19l-.84-.84C10.44 2.67 9.67 2 8.68 2 7.19 2 6 3.19 6 4.68c0 .45.1.88.18 1.32H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" fill="#AAAAAA"/></svg>
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          aria-label="Select Legal Issue"
          className={`hsf-select${area === '' ? ' hsf-select--empty' : ''}`}
        >
          <option value="">Select a Legal Issue</option>
          {PRACTICE_AREAS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="hsf-btn">Find Attorney</button>
    </form>
  )
}
