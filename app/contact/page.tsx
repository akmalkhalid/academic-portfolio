import { getSiteConfig } from '@/lib/content'

export const metadata = { title: 'Contact — Academic Portfolio' }

export default function ContactPage() {
  const cfg = getSiteConfig()
  return (
    <div>
      <h1 className="text-3xl font-medium mb-4">Let's build something intelligent together</h1>
      <p className="text-stone-600 max-w-3xl mb-10 leading-relaxed">
        Whether you're a prospective postgraduate student, a fellow academic interested in collaboration,
        or an industry partner with a problem worth solving — I'd be glad to hear from you. I respond to
        all serious inquiries within 5 working days.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">Office</h3>
            <p className="text-sm text-stone-700 whitespace-pre-line">{cfg.office}</p>
          </div>
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">Email</h3>
            <a href={`mailto:${cfg.email}`} className="text-sm text-indigo-600 hover:underline">{cfg.email}</a>
          </div>
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">Phone (office)</h3>
            <p className="text-sm text-stone-700">{cfg.phone}</p>
          </div>
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-3">Academic profiles</h3>
            <ul className="text-sm space-y-1.5 text-indigo-600">
              {cfg.social.scholar && <li><a href={cfg.social.scholar} target="_blank" rel="noopener noreferrer">→ Google Scholar</a></li>}
              {cfg.social.orcid && <li><a href={cfg.social.orcid} target="_blank" rel="noopener noreferrer">→ ORCID</a></li>}
              {cfg.social.linkedin && <li><a href={cfg.social.linkedin} target="_blank" rel="noopener noreferrer">→ LinkedIn</a></li>}
              {cfg.social.researchgate && <li><a href={cfg.social.researchgate} target="_blank" rel="noopener noreferrer">→ ResearchGate</a></li>}
              {cfg.social.github && <li><a href={cfg.social.github} target="_blank" rel="noopener noreferrer">→ GitHub</a></li>}
            </ul>
          </div>
        </div>

        <div className="p-6 bg-stone-50 border border-stone-200 rounded-lg">
          <h3 className="font-medium mb-3">Considering a Master's or PhD?</h3>
          <p className="text-sm text-stone-600 mb-4">
            Before reaching out, please review available research slots and the postgraduate application
            guide. Strong applications include a brief research proposal aligned with one of my core
            expertise areas.
          </p>
          <div className="flex flex-col gap-2">
            <a href="/teaching" className="text-sm px-4 py-2 bg-stone-900 text-white rounded-md text-center hover:bg-stone-700">
              View available slots
            </a>
            <a href="/postgraduate-guide" className="text-sm px-4 py-2 border border-stone-300 rounded-md text-center hover:bg-white">
              Read application guide
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
