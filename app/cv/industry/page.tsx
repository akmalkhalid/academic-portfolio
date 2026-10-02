// /cv/industry — the trainer-first (industry-facing) CV: AI training and
// workshops delivered, training expertise, certifications, then a compact
// research record. Same data and template as the academic CV at /cv.
import CVView from "@/components/CVView";

export const metadata = {
  title: "Industry CV (AI Trainer) — Mohd Nor Akmal Khalid",
  description:
    "Trainer-first CV of Dr. Mohd Nor Akmal Khalid — generative and agentic AI training for government, healthcare, industry and universities. Always current; download as PDF.",
};

export default function IndustryCVPage() {
  return <CVView profile="industry" />;
}
