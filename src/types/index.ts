export interface AttorneySection {
  title: string
  type: 'text' | 'list' | 'grouped_list'
  content: string | string[] | { label: string; items: string[] }[]
}

export interface AttorneyLocation {
  state: string | null
  state_abbr: string | null
  city: string | null
  address: string | null
  address2: string | null
  zip: string | null
}

export interface AttorneyContact {
  phones: string[]
  fax: string | null
  websites: string[]
  hours: string | null
  features: string[]
}

export interface Attorney {
  slug: string
  type: 'attorney'
  name: string
  firm_name: string | null
  firm_slug: string | null
  practice_type: string | null
  years_experience: number | null
  free_consultation: boolean
  super_lawyers: number | null
  photo: string
  bio: string
  location: AttorneyLocation
  contact: AttorneyContact
  practice_areas: string[]
  sections: AttorneySection[]
}

export interface FirmLocation {
  state: string | null
  city: string | null
  address: string | null
  address2: string | null
  zip: string | null
  lat: number | null
  lng: number | null
}

export interface FirmContact {
  phone: string | null
  fax: string | null
  email_url: string | null
  websites: string[]
  features: string[]
}

export interface FirmAdditionalLocation {
  city: string | null
  state: string | null
  zip: string | null
  address: string | null
  phone: string | null
  lat: number | null
  lng: number | null
}

export interface Firm {
  official_practice_area: string[];
  additional_locations: FirmAdditionalLocation[]
  slug: string
  type: 'firm'
  name: string | null
  practice_type: string | null
  last_updated: string | null
  years_experience: number | null
  free_consultation: boolean
  super_lawyers: number | null
  photo: string
  profile_image_url: string | null
  location: FirmLocation
  contact: FirmContact
  practice_areas: string[]
  attorneys: string[]
}

export interface StateData {
  state: string
  state_abbr: string
  cities: string[]
  counties: string[]
  attorneys: Attorney[]
  firms: Firm[]
}

export interface StateIndex {
  state: string
  state_abbr: string
  file: string
  attorney_count: number
  firm_count: number
  city_count: number
  county_count: number
}

export interface Index {
  total_attorneys: number
  total_firms: number
  state_count: number
  states: StateIndex[]
}
