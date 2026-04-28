#!/usr/bin/env node
// Rebuilds official_practice_area for all attorneys and firms in all state JSONs.
// Matches each practice_areas entry against the official list using multiple strategies.
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../src/data')

// ─── Official list ────────────────────────────────────────────────────────────
const OFFICIAL = [
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

const OFFICIAL_SET = new Set(OFFICIAL)

// ─── Normalization ────────────────────────────────────────────────────────────
function norm(s) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NORM_TO_OFFICIAL = new Map(OFFICIAL.map(o => [norm(o), o]))

// ─── Synonym / alias map → official ──────────────────────────────────────────
// Keys are lowercase normalized fragments; values are official names.
const SYNONYMS = {
  // Truck / 18-wheeler
  '18 wheeler': 'Truck Accident',
  'tractor trailer': 'Truck Accident',
  'semi truck': 'Truck Accident',
  'commercial truck': 'Truck Accident',
  'trucking accident': 'Truck Accident',
  'big rig': 'Truck Accident',
  'large truck': 'Truck Accident',
  'freight truck': 'Truck Accident',

  // Car accidents
  'auto accident': 'Car Accidents',
  'automobile accident': 'Car Accidents',
  'motor vehicle accident': 'Car Accidents',
  'vehicle accident': 'Car Accidents',
  'traffic accident': 'Car Accidents',
  'car crash': 'Car Accidents',
  'auto collision': 'Car Accidents',
  'car wreck': 'Car Accidents',
  'car collision': 'Car Accidents',
  'road accident': 'Car Accidents',

  // DUI/DWI
  'drunk driving': 'DUI and DWI',
  'dui': 'DUI and DWI',
  'dwi': 'DUI and DWI',
  'driving under the influence': 'DUI and DWI',
  'driving while intoxicated': 'DUI and DWI',
  'owi': 'DUI and DWI',

  // Divorce
  'divorce': 'Divorce and Separation',
  'separation law': 'Divorce and Separation',

  // Brain/birth/spinal injuries
  'brain injur': 'Brain Injury',
  'traumatic brain': 'Brain Injury',
  'tbi': 'Brain Injury',
  'birth injur': 'Birth Injury',
  'birth trauma': 'Birth Injury',
  'cerebral palsy': 'Birth Injury',
  'erbs palsy': 'Birth Injury',

  // Nursing home
  'nursing home': 'Nursing Home Abuse',
  'elder abuse': 'Nursing Home Abuse',

  // Workers comp
  "workers compensation": "Workers' Compensation",
  "workers' comp": "Workers' Compensation",
  "workers comp": "Workers' Compensation",
  "workmens comp": "Workers' Compensation",
  "work injury": "Workers' Compensation",
  "workplace injury": "Workers' Compensation",
  "on the job injur": "Workers' Compensation",

  // Personal injury
  'personal injury': 'Personal Injury',
  'slip and fall': 'Premises Liability',
  'trip and fall': 'Premises Liability',
  'premises liabilit': 'Premises Liability',

  // Social security
  'social security disability': 'Social Security Disability',
  'ssd': 'Social Security Disability',
  'ssdi': 'Social Security Disability',
  'ssi': 'Social Security',

  // Criminal
  'criminal defense': 'Criminal Defense',
  'criminal law': 'Criminal Defense',
  'white collar': 'Federal and White Collar Crimes',
  'federal crime': 'Federal and White Collar Crimes',

  // Drug
  'drug crime': 'Drug Crime',
  'drug charge': 'Drug Crime',
  'drug offense': 'Drug Crime',
  'drug possession': 'Drug Crime',
  'drug trafficking': 'Drug Crime',
  'narcotics': 'Drug Crime',

  // Immigration
  'immigration': 'Immigration',
  'deportation': 'Immigration',
  'visa': 'Immigration',
  'citizenship': 'Immigration',
  'asylum': 'Immigration',
  'green card': 'Immigration',

  // Real estate
  'real estate': 'Real Estate',
  'property law': 'Real Estate',
  'landlord tenant': 'Landlord and Tenant',
  'landlord and tenant': 'Landlord and Tenant',
  'eviction': 'Landlord and Tenant',

  // Bankruptcy
  'bankruptcy': 'Bankruptcy',
  'chapter 7': 'Bankruptcy',
  'chapter 11': 'Bankruptcy',
  'chapter 13': 'Bankruptcy',
  'chapter 12': 'Bankruptcy',

  // Medical malpractice
  'medical malpractice': 'Medical Malpractice',
  'surgical error': 'Medical Malpractice',
  'hospital negligence': 'Medical Malpractice',
  'misdiagnosis': 'Medical Malpractice',
  'failure to diagnose': 'Medical Malpractice',

  // Employment
  'employment': 'Employment Rights',
  'wrongful termination': 'Wrongful Termination',
  'wrongful discharge': 'Wrongful Termination',
  'sexual harassment': 'Sexual Harassment',
  'workplace discrimination': 'Discrimination',
  'wage and hour': 'Wage and Hour',
  'overtime': 'Wage and Hour',
  'unpaid wage': 'Wage and Hour',

  // Family
  'child custody': 'Child Custody',
  'child support': 'Child Support',
  'family law': 'Family Law',
  'adoption': 'Adoption',
  'domestic violence': 'Domestic Violence',
  'restraining order': 'Domestic Violence',
  'prenuptial': 'Family Law',

  // Estate
  'estate planning': 'Estate Planning',
  'wills and trust': 'Estate Planning',
  'trust': 'Trusts',
  'probate': 'Probate',
  'will contest': 'Probate',
  'guardianship': 'Elder Law',
  'elder law': 'Elder Law',

  // IP
  'patent': 'Patents',
  'trademark': 'Trademarks',
  'copyright': 'Copyrights',
  'intellectual property': 'Patents',

  // Environmental / toxic
  'environmental': 'Environmental Law',
  'toxic tort': 'Toxic Torts',
  'asbestos': 'Asbestos Mesothelioma',
  'mesothelioma': 'Asbestos Mesothelioma',
  'toxic mold': 'Toxic Mold',

  // Construction
  'construction defect': 'Housing and Construction Defects',
  'construction accident': 'Construction Accident',
  'construction law': 'Construction',

  // Misc
  'civil rights': 'Civil Rights',
  'class action': 'Class Actions',
  'product liabilit': 'Dangerous Products',
  'defective product': 'Dangerous Products',
  'dangerous product': 'Dangerous Products',
  'aviation': 'Aviation',
  'airplane': 'Airplane Bus and Helicopter Accidents',
  'helicopter': 'Airplane Bus and Helicopter Accidents',
  'maritime': 'Admiralty and Maritime',
  'admiralty': 'Admiralty and Maritime',
  'tax law': 'Tax Law',
  'tax': 'Tax Law',
  'securities': 'Securities',
  'banking': 'Banking and Finance Law',
  'finance law': 'Banking and Finance Law',
  'antitrust': 'Antitrust',
  'defamation': 'Defamation',
  'libel': 'Defamation',
  'slander': 'Defamation',
  'wrongful death': 'Wrongful Death',
  'insurance defense': 'Insurance Defense',
  'insurance law': 'Insurance Law',
  'bad faith': 'Bad Faith Insurance',
  'lemon law': 'Lemon Law',
  'foreclosure': 'Foreclosure and Alternatives',
  'sex crime': 'Sex Crime',
  'sexual abuse': 'Sexual Abuse',
  'sex offend': 'Sex Crime',
  'dog bite': 'Animal and Dog Bites',
  'animal bite': 'Animal and Dog Bites',
  'motorcycle accident': 'Car Accidents',
  'bicycle accident': 'Car Accidents',
  'pedestrian accident': 'Car Accidents',
  'bus accident': 'Airplane Bus and Helicopter Accidents',
  'train accident': 'Railroad Worker Injury and FELA',
  'railroad': 'Railroad Worker Injury and FELA',
  'fela': 'Railroad Worker Injury and FELA',
  'mediation': 'ADR Arbitration and Mediation',
  'arbitration': 'ADR Arbitration and Mediation',
  'whistleblower': 'Whistleblower and Qui Tam',
  'qui tam': 'Whistleblower and Qui Tam',
  'veteran': "Veteran's Benefits",
  'military divorce': 'Military Divorce',
  'military law': 'Military',
  'administrative law': 'Administrative Law',
  'land use': 'Land Use and Zoning',
  'zoning': 'Land Use and Zoning',
  'oil and gas': 'Oil Gas and Energy',
  'oil gas': 'Oil Gas and Energy',
  'energy law': 'Oil Gas and Energy',
  'natural resources': 'Natural Resources',
  'native': 'Native Peoples',
  'tribal': 'Native Peoples',
  'government contract': 'Government Contracts',
  'erisa': 'ERISA',
  'cannabis': 'Cannabis Law',
  'marijuana': 'Cannabis Law',
  'gaming': 'Gaming',
  'internet': 'Internet',
  'technology law': 'Science and Technology Law',
  'international law': 'International Law',
  'immigration law': 'Immigration',
  'traffic ticket': 'Traffic Ticket',
  'speeding ticket': 'Traffic Ticket',
  'collections': 'Collections',
  'debt collection': 'Collections',
  'contract': 'Contracts',
  'business law': 'Business and Commercial Law',
  'commercial law': 'Business and Commercial Law',
  'mergers': 'Mergers and Acquisitions',
  'acquisitions': 'Mergers and Acquisitions',
  'franchise': 'Franchising',
  'health care': 'Health Care Law',
  'healthcare': 'Health Care Law',
  'medical law': 'Health Care Law',
  'education law': 'Education',
  'school law': 'Education',
  'consumer protection': 'Consumer Protection',
  'lender liabilit': 'Banking and Finance Law',
  'credit': 'Credit Repair',
  'nursing home neglect': 'Nursing Home Abuse',
  'assault': 'Assault and Battery (Plaintiff)',
  'battery': 'Assault and Battery (Plaintiff)',
  'discrimination': 'Discrimination',
  'civil right': 'Civil Rights',
  'constitutional': 'Constitutional Law',
  'social security': 'Social Security',
  'disability': 'Disability Insurance',
  'motor vehicle defect': 'Motor Vehicle Defects',
  'auto defect': 'Motor Vehicle Defects',
  'auto dealer fraud': 'Auto Dealer Fraud',
  'car dealer fraud': 'Auto Dealer Fraud',
  'eminent domain': 'Eminent Domain',
  'condemnation': 'Eminent Domain',
  'father': "Father's Rights",
  'paternity': "Father's Rights",
  'legal malpractice': 'Legal Malpractice',
  'attorney malpractice': 'Legal Malpractice',
  'professional malpractice': 'Professional Malpractice',
  'same sex': 'Same Sex',
  'lgbt': 'Same Sex',
  'election': 'Election Campaign and Political Law',
  'campaign finance': 'Election Campaign and Political Law',
  'drugs and medical device': 'Drugs and Medical Devices',
  'pharmaceutical': 'Drugs and Medical Devices',
  'debtor': 'Debtor and Creditor',
  'creditor': 'Debtor and Creditor',
  'class actions': 'Class Actions',
  'collaborative': 'Collaborative Law',
  'communications': 'Communications and Media Law',
  'media law': 'Communications and Media Law',
  'entertainment': 'Entertainment Sports and Leisure Law',
  'sports law': 'Entertainment Sports and Leisure Law',
  'agriculture': 'Agriculture',
  'farming': 'Agriculture',
  'ethics': 'Ethics and Professional Responsibility',
  'business organization': 'Business Organizations',
  'corporate law': 'Business Organizations',
  'corporation': 'Business Organizations',
  'tax increment': 'Tax Increment Financing',
  'transportation': 'Transportation',
  'state and local': 'State Local and Municipal Law',
  'municipal law': 'State Local and Municipal Law',
  'housing': 'Housing and Construction Defects',
  'spinal cord': 'Personal Injury',
  'burn injur': 'Personal Injury',
  'catastrophic injur': 'Personal Injury',
  'serious injur': 'Personal Injury',
  'accident': 'Personal Injury',
}

// Build word-boundary regexes for each synonym key (longest first for priority)
function escRe(s) { return s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
const SYNONYM_PATTERNS = Object.entries(SYNONYMS)
  .sort(([a], [b]) => b.length - a.length)
  .map(([key, val]) => [new RegExp('\\b' + escRe(key) + '\\b'), val])

// ─── Matching logic ───────────────────────────────────────────────────────────
const cache = new Map()

function matchOne(raw) {
  if (cache.has(raw)) return cache.get(raw)

  // 1. Exact match
  if (OFFICIAL_SET.has(raw)) { cache.set(raw, raw); return raw }

  const n = norm(raw)

  // 2. Normalized exact match
  if (NORM_TO_OFFICIAL.has(n)) {
    const m = NORM_TO_OFFICIAL.get(n)
    cache.set(raw, m); return m
  }

  // 3. Plural → singular variants ("Brain Injuries" → "Brain Injury", etc.)
  const singular = n.replace(/ies$/, 'y').replace(/s$/, '')
  if (NORM_TO_OFFICIAL.has(singular)) {
    const m = NORM_TO_OFFICIAL.get(singular)
    cache.set(raw, m); return m
  }
  // Try adding 's'
  const plural = n + 's'
  if (NORM_TO_OFFICIAL.has(plural)) {
    const m = NORM_TO_OFFICIAL.get(plural)
    cache.set(raw, m); return m
  }

  // 4. Strip common trailing noise words
  for (const noise of [' law', ' lawyer', ' lawyers', ' attorney', ' attorneys',
                        ' cases', ' claims', ' matters', ' practice', ' litigation']) {
    if (n.endsWith(noise)) {
      const stripped = n.slice(0, n.length - noise.length).trim()
      if (NORM_TO_OFFICIAL.has(stripped)) {
        const m = NORM_TO_OFFICIAL.get(stripped)
        cache.set(raw, m); return m
      }
    }
  }

  // 5. Synonym word-boundary scan
  for (const [re, m] of SYNONYM_PATTERNS) {
    if (re.test(n)) {
      cache.set(raw, m); return m
    }
  }

  // 6. Official substring: value is contained inside an official name
  for (const [on, ov] of NORM_TO_OFFICIAL) {
    if (on.includes(n) && n.length >= 6) {
      cache.set(raw, ov); return ov
    }
  }

  cache.set(raw, null); return null
}

// One raw practice_areas entry may map to multiple official areas in edge cases,
// but matchOne returns at most one. Wrap so callers always get an array.
function matchOfficial(paArray) {
  const results = new Set()
  for (const pa of (paArray || [])) {
    const m = matchOne(pa)
    if (m) results.add(m)
  }
  return [...results]
}

// ─── Apply to all state files ─────────────────────────────────────────────────
const index = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8'))

let totalAttorneys = 0, totalFirms = 0

for (const s of index.states) {
  const stateFile = path.join(DATA_DIR, s.file)
  const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))

  for (const a of data.attorneys) {
    a.official_practice_area = matchOfficial(a.practice_areas)
    totalAttorneys++
  }
  for (const f of data.firms) {
    f.official_practice_area = matchOfficial(f.practice_areas)
    totalFirms++
  }

  fs.writeFileSync(stateFile, JSON.stringify(data, null, 2))
  process.stdout.write(`\r${s.file.replace('.json','')} done`)
}

console.log(`\n\nDone. Attorneys updated: ${totalAttorneys} | Firms updated: ${totalFirms}`)
