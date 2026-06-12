import { getCourses, getStudents, getOpenResearchSlots, expandTags } from '@/lib/content'
import { TopicTag } from '@/components/TopicTag'

export const metadata = { title: 'Teaching & Mentorship — Academic Portfolio' }

export default function TeachingPage() {
  const courses = getCourses()
  const students = getStudents()
  const slots = getOpenResearchSlots()

  const currentCourses = courses.filter((c) => c.isCurrentlyTeaching)
  const pastCourses = courses.filter((c) => !c.isCurrentlyTeaching)
  const ongoing = students.filter((s) => s.status === 'Ongoing')
  const graduated = students.filter((s) => s.status === 'Graduated')

  return (
    <div className="space-y-14">
      <div>
        <h1 className="text-3xl font-medium mb-2">Teaching & mentorship</h1>
        <p className="text-stone-600 max-w-3xl">
          Courses I teach at FTSM, postgraduate students I supervise, interactive
          self-instructional materials, and research opportunities for prospective applicants.
        </p>
      </div>

      {/* Interactive teaching materials — featured prominently */}
      <section>
        <h2 className="text-2xl font-medium mb-4">Interactive teaching materials</h2>
        <p className="text-stone-600 mb-6 max-w-2xl">
          Self-paced learning modules I've designed to complement my courses. Open access,
          no registration required.
        </p>
        <a
          href="/courses/prompt-engineering/"
          className="block p-6 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border border-stone-200 rounded-lg hover:border-stone-400 hover:shadow-md transition group"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🧠</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wider">
                  Self-instructional module
                </span>
                <span className="tag-green text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                  Free
                </span>
              </div>
              <h3 className="text-lg font-medium mb-1 group-hover:text-indigo-700 transition">
                Prompt Engineering Architect
              </h3>
              <p className="text-sm text-stone-600 mb-3">
                An interactive course on designing effective prompts for large language models.
                Includes quizzes, drag-and-drop exercises, hands-on analytics, and a global leaderboard.
              </p>
              <p className="text-xs text-stone-500">
                Authored at CAIT, FTSM, UKM · English & Bahasa Melayu · Opens in this tab →
              </p>
            </div>
          </div>
        </a>
      </section>

      {/* Courses */}
      <section>
        <h2 className="text-2xl font-medium mb-4">Courses</h2>
        {currentCourses.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Currently teaching</h3>
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {currentCourses.map((c) => <CourseCard key={c._slug} c={c} highlight />)}
            </div>
          </>
        )}
        {pastCourses.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Previously taught</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {pastCourses.map((c) => <CourseCard key={c._slug} c={c} />)}
            </div>
          </>
        )}
      </section>

      {/* Supervision */}
      <section>
        <h2 className="text-2xl font-medium mb-4">Postgraduate supervision</h2>
        {ongoing.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Ongoing students</h3>
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {ongoing.map((s, i) => (
                <article key={i} className="p-4 bg-white border border-stone-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-blue text-[10px] px-1.5 py-0.5 rounded-md font-medium">{s.degree}</span>
                    <span className="text-xs text-stone-500">{s.role}</span>
                  </div>
                  <h3 className="font-medium leading-snug mb-1">{s.studentName}</h3>
                  <p className="text-sm text-stone-600 italic mb-2">{s.thesisTitle}</p>
                  <p className="text-xs text-stone-500">Started {s.startYear}</p>
                </article>
              ))}
            </div>
          </>
        )}
        {graduated.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Graduated students</h3>
            <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Thesis</th>
                    <th className="text-left p-3">Degree</th>
                    <th className="text-left p-3">Year</th>
                    <th className="text-left p-3">Now at</th>
                  </tr>
                </thead>
                <tbody>
                  {graduated.map((s, i) => (
                    <tr key={i} className="border-t border-stone-200">
                      <td className="p-3 font-medium">{s.studentName}</td>
                      <td className="p-3 text-stone-600 italic">{s.thesisTitle}</td>
                      <td className="p-3 text-stone-600">{s.degree}</td>
                      <td className="p-3 text-stone-600">{s.completionYear}</td>
                      <td className="p-3 text-stone-600">{s.currentPosition || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Research opportunities */}
      <section className="bg-stone-50 border border-stone-200 rounded-lg p-6">
        <h2 className="text-2xl font-medium mb-4">Opportunities for prospective students</h2>
        <p className="text-stone-600 mb-6 max-w-2xl">
          I welcome strong applicants for PhD and Master's research. Open slots below are aligned with my active research areas.
        </p>
        {slots.length === 0 ? (
          <p className="text-sm text-stone-500">
            No specific slots open right now, but I review unsolicited applications. See the Postgraduate Application Guide.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {slots.map((s, i) => {
              const areas = expandTags(s.researchArea)
              return (
                <article key={i} className="p-4 bg-white border border-stone-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-amber text-[10px] px-1.5 py-0.5 rounded-md font-medium">{s.degreeLevel}</span>
                    <span className="text-[10px] text-stone-500">{s.fundingStatus}</span>
                  </div>
                  <h3 className="font-medium leading-snug mb-1">{s.slotTitle}</h3>
                  {s.applicationDeadline && (
                    <p className="text-xs text-stone-500 mb-2">Apply by {new Date(s.applicationDeadline).toLocaleDateString()}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {areas.map((t) => <TopicTag key={t.id} tag={t} size="xs" />)}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        <a href="/postgraduate-guide" className="inline-block mt-6 text-sm text-indigo-600 hover:underline">
          Read the full Postgraduate Application Guide →
        </a>
      </section>
    </div>
  )
}

function CourseCard({ c, highlight }: { c: any; highlight?: boolean }) {
  return (
    <article className={`p-4 bg-white border rounded-lg ${highlight ? 'border-indigo-400/50' : 'border-stone-200'}`}>
      <p className="text-xs font-mono text-stone-500 mb-1">{c.courseCode}</p>
      <h3 className="font-medium leading-snug mb-1">{c.courseTitle}</h3>
      <p className="text-xs text-stone-500">{c.level} {c.program ? `· ${c.program}` : ''}</p>

      {c.labs && c.labs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">
            Companion lab tools
          </p>
          <div className="space-y-1">
            {c.labs.map((lab: { title: string; href: string; blurb?: string; emoji?: string }) => (
              <a
                key={lab.href}
                href={lab.href}
                className="flex items-start gap-2 p-2 -mx-1 rounded-md hover:bg-stone-50 transition group"
              >
                {lab.emoji && <span className="text-base leading-none mt-0.5">{lab.emoji}</span>}
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug group-hover:text-indigo-700 transition">
                    {lab.title}
                  </span>
                  {lab.blurb && (
                    <span className="block text-xs text-stone-500 leading-snug mt-0.5">{lab.blurb}</span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
