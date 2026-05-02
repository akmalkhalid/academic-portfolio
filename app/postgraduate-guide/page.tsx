import { getSiteConfig } from '@/lib/content'

export const metadata = {
  title: 'Postgraduate Application Guide — Academic Portfolio',
}

export default function PostgraduateGuidePage() {
  const cfg = getSiteConfig()
  return (
    <article className="prose-academic max-w-3xl">
      <h1 className="text-3xl font-medium mb-3">Postgraduate Application Guide</h1>
      <p className="text-stone-500 italic mb-10">
        For prospective MSc by Research and PhD candidates considering supervision under my direction at FTSM, UKM.
      </p>

      <p>Thank you for your interest in pursuing postgraduate research with me. This guide exists to help you decide whether we are a good research fit before we both invest time in an application process.</p>

      <h2>Before you write to me</h2>
      <p>Please read at least three of my recent first-author publications. Your proposal should connect to themes in my actual work — not just a research area title.</p>

      <h2>What I'm looking for</h2>
      <ul>
        <li><strong>Technical foundation.</strong> Comfort with calculus, linear algebra, probability, and at least one of: PyTorch/TensorFlow, evolutionary computing toolkits, or simulation environments.</li>
        <li><strong>Research curiosity over credential collection.</strong> Strong applicants articulate a problem they find genuinely interesting and have begun reading around it.</li>
        <li><strong>Communication discipline.</strong> Postgraduate research is largely a writing exercise. Concise, structured initial emails predict thesis quality.</li>
      </ul>

      <h2>Research areas I currently supervise in</h2>
      <ul>
        <li><strong>Generative AI for domain-specific reasoning</strong> — combining LLMs with structured knowledge.</li>
        <li><strong>Evolutionary neural architecture search</strong> — multi-objective AutoML.</li>
        <li><strong>Procedural content generation in games</strong> — AI-driven generation of levels, quests, narratives.</li>
        <li><strong>Agent-based simulation</strong> — applied to education, public health, sustainability.</li>
        <li><strong>Hybrid metaheuristics for combinatorial optimization</strong> — scheduling, routing, allocation.</li>
      </ul>

      <h2>What to send in your initial email</h2>
      <ul>
        <li>Two-paragraph introduction citing at least one of my papers by title.</li>
        <li>Degree level (PhD / MSc by Research) and intended start semester.</li>
        <li>Funding situation (self-funded, seeking scholarship, secured).</li>
        <li>One-page research proposal (PDF) with problem statement, brief literature context, and proposed approach.</li>
        <li>CV (PDF) with transcripts and English proficiency evidence.</li>
      </ul>

      <h2>What happens next</h2>
      <p>I respond within roughly 10 working days during teaching semesters. My response is one of: (1) Let's discuss further, (2) Not the right fit, but try X, or (3) Promising but at capacity right now.</p>

      <h2>Final thought</h2>
      <p>A doctorate is several years of your life. The single most important factor in whether those years are productive — beyond funding, beyond institution prestige — is whether you and your supervisor are working on a question you both genuinely care about. Take the time to find that match.</p>

      <p className="mt-10 pt-6 border-t border-stone-200 text-sm text-stone-500">
        Ready to apply? Email me at <a href={`mailto:${cfg.email}`} className="text-indigo-600 hover:underline">{cfg.email}</a>.
      </p>
    </article>
  )
}
