// The three versions of the CV, shown as clickable tiles above the sheet on every CV page.
// Same visual family as the "books and tools" tiles on the home page (.bt-* in app/globals.css),
// in a compact size (.cvv-* in app/globals.css) so the CV itself stays near the top.
//
//   /cv/           Academic   the complete scholarly record        (components/CVView.tsx)
//   /cv/industry/  Industry   trainer-first, for organisations     (components/CVView.tsx)
//   /cv/custom/    Tailored   built in the browser for one reader  (components/CVBuilder.tsx)

export type CVVariant = "academic" | "industry" | "custom";

const VARIANTS: { id: CVVariant; href: string; chip: string; tag: string; title: string; line: string; cta: string }[] = [
  { id: "academic", href: "/cv/", chip: "PDF · full record", tag: "Academic",
    title: "Academic CV", line: "The complete scholarly record: appointments, grants, publications, supervision and service.", cta: "Read the full CV →" },
  { id: "industry", href: "/cv/industry/", chip: "PDF · trainer-first", tag: "Industry · Trainer",
    title: "Industry CV", line: "For organisations: AI training and workshops delivered, what I teach, and a compact research record.", cta: "See the trainer CV →" },
  { id: "custom", href: "/cv/custom/", chip: "Live · 1 to 5 pages", tag: "Tailored for you",
    title: "Tailored CV", line: "Say who is reading and how many pages. The best entries for that reader are packed into the space.", cta: "Build yours →" },
];

// `wide` matches the tile row to the wider layout of the tailored builder (1120px instead of the 900px sheet).
export default function CVVariants({ current, wide = false }: { current: CVVariant; wide?: boolean }) {
  return (
    <nav aria-label="CV version" className="cvv-grid" style={{ maxWidth: wide ? 1120 : 900 }}>
      {VARIANTS.map((v) => {
        const here = v.id === current;
        return (
          <a key={v.id} href={v.href} aria-current={here ? "page" : undefined} className={`bt-tile cvv-tile cvv-${v.id}`}>
            {/* stage: a small sheet of paper rising out of a panel tinted with the variant's palette */}
            <div className="bt-stage cvv-stage">
              <span className="bt-chip">{v.chip}</span>
              <div className="cvv-paper cvv-paper-back" aria-hidden="true" />
              <div className="cvv-paper" aria-hidden="true">
                <i className="cvv-head" />
                <i /><i /><i className="cvv-short" /><i /><i className="cvv-short" /><i />
              </div>
              {v.id === "custom" ? <span className="cvv-dial" aria-hidden="true"><b /></span> : null}
            </div>
            <div className="bt-body cvv-body">
              <span className="bt-tag">{v.tag}{here ? " · viewing" : ""}</span>
              <h3>{v.title}</h3>
              <p>{v.line}</p>
              <span className="bt-cta">{here ? "You are here ↓" : v.cta}</span>
            </div>
          </a>
        );
      })}
    </nav>
  );
}
