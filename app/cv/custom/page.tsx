// /cv/custom — retired. The tailored CV builder grew into the CV engine at /cv.
import type { Metadata } from "next";
import MovedTo from "@/components/MovedTo";

export const metadata: Metadata = {
  title: "Tailored CV — Mohd Nor Akmal Khalid",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cv/" },
};

export default function Page() {
  return <MovedTo to="/cv/?reader=promotion" label="The tailored CV is now part of the CV page." />;
}
