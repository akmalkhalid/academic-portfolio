// This module reads from disk and must only run on the server.
// Importing it from a client component will throw a clear error at build time.
import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'

const CONTENT_DIR = path.join(process.cwd(), 'content')

// ---- Site config & tags ---------------------------------------------------

export type SiteConfig = {
  authorName: string; authorShortName: string; jobTitle: string
  affiliation: string; email: string; office: string; phone: string
  siteUrl: string
  social: { scholar?: string; orcid?: string; linkedin?: string; github?: string; researchgate?: string }
  heroHeadline: string; heroSubheadline: string
}

export type Tag = { id: string; name: string; color: string; description?: string }

let _config: SiteConfig | null = null
let _tags: Tag[] | null = null

export function getSiteConfig(): SiteConfig {
  if (_config) return _config
  const raw = fs.readFileSync(path.join(CONTENT_DIR, 'site.yml'), 'utf-8')
  _config = yaml.load(raw) as SiteConfig
  return _config
}

export function getTags(): Tag[] {
  if (_tags) return _tags
  const raw = fs.readFileSync(path.join(CONTENT_DIR, 'tags.yml'), 'utf-8')
  _tags = yaml.load(raw) as Tag[]
  return _tags
}

export function tagById(id: string): Tag | undefined {
  return getTags().find((t) => t.id === id)
}

export function expandTags(ids?: string[]): Tag[] {
  if (!ids) return []
  return ids.map((id) => tagById(id)).filter(Boolean) as Tag[]
}

// ---- Markdown loader ------------------------------------------------------

function readMarkdownDir<T>(subdir: string): (T & { _slug: string; _body: string })[] {
  const dir = path.join(CONTENT_DIR, subdir)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), 'utf-8')
      const { data, content } = matter(raw)
      return { ...(data as T), _slug: filename.replace(/\.md$/, ''), _body: content.trim() }
    })
}

// ---- Publications ---------------------------------------------------------

export type Publication = {
  title: string; authors: string; year: number
  venue: string; venueShort?: string; category: string
  quartile?: string; volume?: string; issue?: string; pages?: string
  doi?: string; externalLink?: string; pdfUrl?: string
  indexing?: string[]; topicTags?: string[]
  isFirstAuthor?: boolean; isCorrespondingAuthor?: boolean
  citationCount?: number; featured?: boolean
  _slug: string; _body: string
}

export function getAllPublications(): Publication[] {
  return readMarkdownDir<Publication>('publications').sort((a, b) => b.year - a.year)
}

export function getRecentPublications(limit = 3): Publication[] {
  return getAllPublications().slice(0, limit)
}

// ---- Projects -------------------------------------------------------------

export type Project = {
  title: string; shortDescription: string
  fundingAgency: string; grantCode?: string; amountMyr?: number
  role: string; startDate: string; endDate: string
  status: 'Active' | 'Completed' | 'Pending'
  researchTags?: string[]; teamMembers?: string[]
  externalLink?: string; featured?: boolean
  _slug: string; _body: string
}

export function getAllProjects(): Project[] {
  return readMarkdownDir<Project>('projects').sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )
}

export function getActiveProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === 'Active')
}

// ---- Courses --------------------------------------------------------------

export type Course = {
  courseCode: string; courseTitle: string; level: string; program?: string
  semestersTaught?: string[]; isCurrentlyTeaching?: boolean
  syllabusLink?: string; topicTags?: string[]
  _slug: string; _body: string
}

export function getCourses(): Course[] {
  return readMarkdownDir<Course>('courses').sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode)
  )
}

// ---- Students -------------------------------------------------------------

export type Student = {
  studentName: string; thesisTitle: string
  degree: string; status: 'Ongoing' | 'Graduated' | 'Withdrawn'
  startYear: number; completionYear?: number
  role: string; researchTags?: string[]
  currentPosition?: string; studentLink?: string
  showPublicly: boolean
}

export function getStudents(): Student[] {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, 'students/students.yml'), 'utf-8')
  const students = yaml.load(raw) as Student[]
  return students.filter((s) => s.showPublicly)
}

// ---- Research slots -------------------------------------------------------

export type ResearchSlot = {
  slotTitle: string; degreeLevel: 'PhD' | 'MSc'
  fundingStatus: string; researchArea: string[]
  applicationDeadline?: string; isOpen: boolean
  description: string; requirements?: string
}

export function getOpenResearchSlots(): ResearchSlot[] {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, 'research-slots/slots.yml'), 'utf-8')
  const slots = yaml.load(raw) as ResearchSlot[]
  return slots.filter((s) => s.isOpen)
}
