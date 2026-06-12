// app/tools/page.tsx
export const metadata = { title: 'Tools — Academic Portfolio' }

type Tool = {
  title: string
  blurb: string
  href: string
  tag: string
  status?: 'live' | 'beta'
}

// Add a future utility by appending one entry here and dropping its
// folder into public/tools/<slug>/index.html
const TOOLS: Tool[] = [
  {
    title: 'Gaya UKM Reference Formatter',
    blurb:
      'Format citations and reference lists to the UKM (Gaya UKM) house style, in English or Malay.',
    href: '/tools/gaya-ukm-formatter/',
    tag: 'Reference / citation',
    status: 'live',
  },
]

export default function ToolsPage() {
  return (
    <div>
      <h1 className="text-3xl font-medium mb-2">Tools</h1>
      <p className="text-stone-600 mb-8 text-sm">
        Small utilities I build for research and teaching. Free to use.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className="block p-5 bg-white border border-stone-200 rounded-lg hover:border-stone-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-stone-500">{t.tag}</p>
              {t.status && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 capitalize">
                  {t.status}
                </span>
              )}
            </div>
            <h3 className="font-medium leading-snug mb-1">{t.title}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{t.blurb}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
