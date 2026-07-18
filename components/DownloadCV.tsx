// Reusable "Download CV" button. Drop into the nav, hero, or About page.
// Points at the build-time PDF, which is regenerated from content/cv.yml on
// every push — so it is always current.
//
// Usage:
//   import DownloadCV from "@/components/DownloadCV";
//   <DownloadCV />                       // default: "Download CV"
//   <DownloadCV variant="outline" />     // outline style
//   <DownloadCV label="Download CV (PDF)" />

type Props = {
  label?: string;
  variant?: "solid" | "outline";
  className?: string;
};

export default function DownloadCV({ label = "Download CV", variant = "solid", className = "" }: Props) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
    fontSize: 14,
    padding: "9px 16px",
    borderRadius: 8,
    textDecoration: "none",
    lineHeight: 1,
    transition: "opacity .15s ease",
  };
  const solid: React.CSSProperties = { ...base, background: "#1b2a5c", color: "#fff" };
  const outline: React.CSSProperties = {
    ...base, background: "transparent", color: "#1b2a5c", border: "1.5px solid #1b2a5c",
  };

  return (
    <a
      href="/cv/Akmal_CV_2026.pdf"
      download
      className={className}
      style={variant === "outline" ? outline : solid}
      aria-label="Download the latest CV as a PDF"
    >
      <span aria-hidden>↓</span>
      {label}
    </a>
  );
}
