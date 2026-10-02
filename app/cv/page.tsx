// On-site living CV at /cv — the ACADEMIC profile. The trainer-first version
// lives at /cv/industry. Both render through components/CVView.tsx from the
// same data (content/cv.yml) as their downloadable PDFs.
import CVView from "@/components/CVView";

export const metadata = {
  title: "Curriculum Vitae — Mohd Nor Akmal Khalid",
  description:
    "Full academic CV of Dr. Mohd Nor Akmal Khalid — Computational Intelligence for games and engagement modelling. Always current; download as PDF, or switch to the trainer-first industry CV.",
};

export default function CVPage() {
  return <CVView profile="academic" />;
}
