import Link from 'next/link'
import Image from 'next/image'
import { getSiteConfig, getRecentPublications, getActiveProjects, expandTags } from '@/lib/content'
import { TopicTag } from '@/components/TopicTag'
import { AuthorList } from '@/components/AuthorList'

export default function HomePage() {
  const cfg = getSiteConfig()
  const recent = getRecentPublications(3)
  const active = getActiveProjects()

  return (
    <div className="space-y-16">
      {/* Hero: text + portrait with ambient blurred halo */}
      <section className="pt-6 grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-medium leading-tight mb-4">
            {cfg.heroHeadline}
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed mb-6">{cfg.heroSubheadline}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/research" className="px-4 py-2 bg-stone-900 text-white text-sm rounded-md hover:bg-stone-700">Explore my research</Link>
            <Link href="/publications" className="px-4 py-2 border border-stone-300 text-sm rounded-md hover:bg-stone-50">View publications</Link>
            <Link href="/contact" className="px-4 py-2 border border-stone-300 text-sm rounded-md hover:bg-stone-50">Collaborate with me</Link>
          </div>
        </div>

        {/* Portrait: blurred copy underneath creates an ambient halo;
            the sharp foreground is masked into a circle so the busy
            backdrop of the original photo is naturally cropped out. */}
        <div className="order-1 md:order-2 relative w-56 h-56 md:w-72 md:h-72 mx-auto md:mx-0 flex-shrink-0">
          <Image
            src="/profile.jpg"
            alt=""
            aria-hidden="true"
            width={400}
            height={400}
            className="absolute inset-0 w-full h-full object-cover rounded-full blur-2xl opacity-50 scale-110 -z-10 pointer-events-none"
          />
          <Image
            src="/profile.jpg"
            alt={cfg.authorName}
            width={400}
            height={400}
            priority
            className="relative w-full h-full object-cover rounded-full ring-4 ring-white shadow-xl"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium mb-6">Research pillars</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Generative AI & Expert Systems', anchor: 'generative-ai' },
            { title: 'Evolutionary Computing & Optimization', anchor: 'evolutionary' },
            { title: 'Games Informatics & Simulation', anchor: 'games' },
          ].map((p) => (
            <Link key={p.title} href={`/research#${p.anchor}`}
              className="block p-5 bg-white border border-stone-200 rounded-lg hover:border-stone-400 transition">
              <p className="text-sm text-stone-500 mb-2">Pillar</p>
              <h3 className="font-medium leading-snug">{p.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-medium">Latest from the lab</h2>
            <Link href="/publications" className="text-sm text-indigo-600 hover:underline">All publications →</Link>
          </div>
          <div className="space-y-3">
            {recent.map((p) => {
              const tags = expandTags(p.topicTags)
              return (
                <article key={p._slug} className="p-4 bg-white border border-stone-200 rounded-lg">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {p.quartile && <span className="tag-green text-[10px] px-1.5 py-0.5 rounded-md font-medium">{p.quartile}</span>}
                    <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md">{p.category}</span>
                    {tags.map((t) => <TopicTag key={t.id} tag={t} size="xs" />)}
                  </div>
                  <h3 className="text-sm font-medium mb-1 leading-snug">{p.title}</h3>
                  <p className="text-xs text-stone-600 mb-1">
                    <AuthorList authors={p.authors} highlightName={cfg.authorShortName} />
                  </p>
                  <p className="text-xs text-stone-600"><em>{p.venue}</em> · {p.year}</p>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-medium">Currently funded research</h2>
            <Link href="/projects" className="text-sm text-indigo-600 hover:underline">All projects →</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {active.slice(0, 4).map((g) => (
              <article key={g._slug} className="p-4 bg-white border border-stone-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag-green text-[10px] px-1.5 py-0.5 rounded-md font-medium">Active</span>
                  <span className="text-xs text-stone-500">{g.role}</span>
                </div>
                <h3 className="text-sm font-medium mb-1 leading-snug">{g.title}</h3>
                <p className="text-xs text-stone-600 mb-2">{g.fundingAgency}</p>
                <p className="text-xs text-stone-500">
                  {new Date(g.startDate).getFullYear()} – {new Date(g.endDate).getFullYear()}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="bg-stone-50 border border-stone-200 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-2">Open to collaboration</h2>
        <p className="text-stone-600 text-sm mb-4">
          Postgraduate supervision (Master's & PhD), industry research collaboration, and conference invitations welcome.
        </p>
        <Link href="/contact" className="inline-block px-4 py-2 bg-stone-900 text-white text-sm rounded-md hover:bg-stone-700">
          Get in touch
        </Link>
      </section>
    </div>
  )
}
