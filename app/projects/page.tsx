import { getAllProjects, expandTags } from '@/lib/content'
import { TopicTag } from '@/components/TopicTag'

export const metadata = { title: 'Projects & Grants — Academic Portfolio' }

export default function ProjectsPage() {
  const projects = getAllProjects()
  const active = projects.filter((p) => p.status === 'Active')
  const completed = projects.filter((p) => p.status === 'Completed')

  return (
    <div>
      <h1 className="text-3xl font-medium mb-2">Projects & grants</h1>
      <p className="text-stone-600 mb-10 max-w-3xl">Funded research projects and academic-industry collaborations.</p>

      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-medium mb-4">Active grants</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {active.map((g) => <ProjectCard key={g._slug} g={g} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-xl font-medium mb-4">Completed grants</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {completed.map((g) => <ProjectCard key={g._slug} g={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ProjectCard({ g }: { g: any }) {
  const statusColor = g.status === 'Active' ? 'tag-green' : 'tag-blue'
  const tags = expandTags(g.researchTags)
  return (
    <article className="p-4 bg-white border border-stone-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${statusColor} text-[10px] px-1.5 py-0.5 rounded-md font-medium`}>{g.status}</span>
        <span className="text-xs text-stone-500">{g.role}</span>
      </div>
      <h3 className="font-medium leading-snug mb-1">{g.title}</h3>
      <p className="text-sm text-stone-600 mb-2">{g.shortDescription}</p>
      <p className="text-xs text-stone-500 mb-2">
        {g.fundingAgency} · {new Date(g.startDate).getFullYear()}–{new Date(g.endDate).getFullYear()}
        {g.amountMyr ? ` · MYR ${g.amountMyr.toLocaleString()}` : ''}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => <TopicTag key={t.id} tag={t} size="xs" />)}
        </div>
      )}
    </article>
  )
}
