// /cv/custom — the TAILORED CV: the third version beside Academic (/cv) and Industry (/cv/industry).
// The visitor picks a reader and a length, and the browser assembles a CV for them from the same
// record as the rest of the site. The builder itself is components/CVBuilder.tsx.
// (It first lived on the engine page; it moved here so the site has one home for the CV.)
import PageBanner from "@/components/PageBanner";
import CVVariants from "@/components/CVVariants";
import CVBuilder from "@/components/CVBuilder";

export const metadata = {
  title: "Tailored CV — Mohd Nor Akmal Khalid",
  description:
    "Build a CV of Dr. Mohd Nor Akmal Khalid for your purpose: choose who is reading (promotion panel, industry client, grant reviewer, prospective student) and how many pages, then print it or copy it. Assembled in your browser from the live record.",
};

export default function TailoredCVPage() {
  return (
    <>
      <PageBanner
        eyebrow="/ curriculum vitae"
        title="A CV tailored for you"
        kicker="Dr. Mohd Nor Akmal Khalid · Senior Lecturer, FTSM, Universiti Kebangsaan Malaysia"
        lede="Say who you are and how many pages you will read. A small optimizer scores every entry in the record for that reader and packs the best ones into the space. It runs in your browser, on the same data as the full CV."
      >
        <a href="/cv/" className="btn-ghost">Full academic CV <span aria-hidden="true">→</span></a>
        <a href="/cv/industry/" className="btn-ghost">Industry (trainer) CV <span aria-hidden="true">→</span></a>
      </PageBanner>

      <div className="cvb-page" style={{ background: "var(--bg)", minHeight: "100vh", padding: "28px 12px 64px" }}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <CVVariants current="custom" wide />
        <div className="cvb-intro" style={{ maxWidth: 900, margin: "0 auto 16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          Tailored CV — pick a reader, set the length, then print or copy. Built from the same data as the other two versions.
        </div>
        <CVBuilder />
      </div>
    </>
  );
}
