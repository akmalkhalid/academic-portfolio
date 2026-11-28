// Books I have published on Amazon (KDP) and Etsy that belong to my research and teaching.
// One source of truth for the home shelf, the Teaching page and the postgraduate guide.
// (The site assistant, toolkit.yml and the talks/workshops index pages carry their own short copies.)
//
// Store-only products that are not part of my academic work (planners, brand kits, pattern packs)
// are deliberately left out.
//
// Covers are served from the stores' own image servers, so a new cover uploaded to KDP needs the
// image id here updated (open the Amazon page, right-click the cover, copy the image address).

export type StoreLink = { label: string; href: string }

export type StoreBook = {
  slug: string
  title: string
  subtitle: string
  format: string // chip on the cover stage
  tag: string // small label above the title
  blurb: string
  cover: string
  links: StoreLink[] // first link is the primary action
}

export const AMAZON_DELEGATE = 'https://www.amazon.com/dp/B0HRFQDL74'
export const AMAZON_PROPOSAL = 'https://www.amazon.com/dp/B0HRFGWH55'
export const ETSY_PROPOSAL = 'https://www.etsy.com/listing/4627503337/thesis-and-research-proposal-workbook'

export const STORE_BOOKS: StoreBook[] = [
  {
    slug: 'delegate',
    title: 'Delegate Tasks, Never Judgment',
    subtitle: 'A Short Guide to Using AI Responsibly in Research',
    format: 'Kindle · 38 pages',
    tag: 'Book · Kindle',
    blurb:
      'The short version of my AI-in-research workshops: what to hand to AI at each of seven research stages, what never to, and how to check every reference.',
    cover: 'https://m.media-amazon.com/images/I/719fFUKxH5L._SL600_.jpg',
    links: [{ label: 'Get it on Kindle', href: AMAZON_DELEGATE }],
  },
  {
    slug: 'proposal',
    title: 'From Idea to Proposal',
    subtitle: "A Thesis and Research Proposal Workbook with Responsible AI Use, for Master's and PhD Students",
    format: 'Workbook · 108 pages',
    tag: 'Workbook · Paperback + printable',
    blurb:
      'Five stages from research problem to a proposal you can defend: aligned questions and methods, an AI-assisted search log, citation checks and a 48-source literature matrix.',
    cover: 'https://m.media-amazon.com/images/I/51eoIrGllML._SL600_.jpg',
    links: [
      { label: 'Paperback on Amazon', href: AMAZON_PROPOSAL },
      { label: 'Printable on Etsy', href: ETSY_PROPOSAL },
    ],
  },
]
