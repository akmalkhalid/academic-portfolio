export const metadata = { title: 'Research & Expertise — Academic Portfolio' }

const PILLARS = [
  {
    id: 'generative-ai',
    title: 'Generative AI & Expert Systems',
    body: `Generative AI and Expert Systems represent two complementary visions of machine intelligence: one that creates and one that reasons. My research investigates how generative models (transformers, diffusion architectures, GAN) can be coupled with structured, symbolic, and rule-based knowledge to produce systems that are both creative and explainable.`,
  },
  {
    id: 'evolutionary',
    title: 'Evolutionary Computing & Computational Optimization',
    body: `Many of the most important problems in engineering, logistics, and AI are NP-hard. My work in evolutionary computing focuses on designing nature-inspired metaheuristics, which include genetic algorithms, swarm intelligence, and hybrid memetic methods, applied for large-scale combinatorial and continuous optimization.`,
  },
  {
    id: 'games',
    title: 'Games Informatics & Simulation',
    body: `Games are demanding testbeds for AI: real-time decision making, adversarial reasoning, content creativity, human-aware adaptation. My research explores data analytics for making sense of the science behind playing, information that culminates in the entertainment as knowledge in human-machine interactions, procedural content generation to explore shared creativity between human and AI players, AI-controlled NPCs to enhance player experience, and serious games for training, education, and policy modeling.`,
  },
]

export default function ResearchPage() {
  return (
    <div>
      <h1 className="text-3xl font-medium mb-2">Research & expertise</h1>
      <p className="text-stone-600 mb-10 max-w-3xl">Three interconnected pillars at the convergence of AI, optimization, and interactive systems.</p>
      <div className="space-y-12">
        {PILLARS.map((p) => (
          <section key={p.id} id={p.id} className="scroll-mt-24">
            <h2 className="text-2xl font-medium mb-4">{p.title}</h2>
            <p className="text-stone-700 leading-relaxed max-w-3xl">{p.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
