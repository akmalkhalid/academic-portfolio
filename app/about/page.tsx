import { getSiteConfig } from '@/lib/content'

export const metadata = { title: 'About — Academic Portfolio' }

export default function AboutPage() {
  const cfg = getSiteConfig()
  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-10">
      <article className="prose-academic">
        <h1 className="text-3xl font-medium mb-6">About</h1>
        <p>
          I am a {cfg.jobTitle.toLowerCase()} at the <strong>Faculty of Information Science and Technology
          (FTSM), Universiti Kebangsaan Malaysia (UKM)</strong>, where I teach and conduct research at the
          convergence of artificial intelligence, computational intelligence, and interactive systems.
        </p>
        <p>
          My academic journey has been shaped by a single guiding question: <em>How can we design intelligent
          systems that adapt, optimize, and create, not just compute?</em> This question runs through my work
          in Generative AI, Evolutionary Computing, Expert Systems, and Game Informatics.
        </p>
        <p>
          At UKM, I am committed to nurturing the next generation of AI researchers and engineers in Malaysia
          and across the region. I supervise postgraduate students working on cutting-edge problems in
          metaheuristic optimization, simulation modeling, and applied generative AI.
        </p>

        <h2>Core competencies</h2>
        <ul>
          <li><strong>Artificial Intelligence:</strong> Generative AI, LLM applications, Expert Systems</li>
          <li><strong>Evolutionary Computing:</strong> Genetic Algorithms, PSO, multi-objective metaheuristics</li>
          <li><strong>Computational Optimization:</strong> Combinatorial optimization, scheduling, AutoML</li>
          <li><strong>Games Informatics:</strong> Procedural Content Generation, NPC AI, serious games</li>
          <li><strong>Simulation & Modelling:</strong> Agent-based simulation, Monte Carlo methods</li>
          <li><strong>Technical Stack:</strong> Python, MATLAB, Unity, PyTorch, R, LaTeX</li>
        </ul>
      </article>

      <aside className="space-y-3">
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Quick facts</h3>
          <ul className="text-sm text-stone-600 space-y-2">
            <li>📍 FTSM, UKM Bangi, Selangor</li>
            <li>🎓 PhD, USM, 2018</li>
          </ul>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Profiles</h3>
          <ul className="text-sm text-indigo-600 space-y-1.5">
            {cfg.social.scholar && <li><a href={cfg.social.scholar} target="_blank" rel="noopener noreferrer">Google Scholar →</a></li>}
            {cfg.social.orcid && <li><a href={cfg.social.orcid} target="_blank" rel="noopener noreferrer">ORCID →</a></li>}
            {cfg.social.linkedin && <li><a href={cfg.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn →</a></li>}
            {cfg.social.researchgate && <li><a href={cfg.social.researchgate} target="_blank" rel="noopener noreferrer">ResearchGate →</a></li>}
            {cfg.social.github && <li><a href={cfg.social.github} target="_blank" rel="noopener noreferrer">GitHub →</a></li>}
          </ul>
        </div>
      </aside>
    </div>
  )
}
