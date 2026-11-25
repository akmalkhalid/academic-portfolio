// /cv/industry — retired. The Industry (trainer-first) CV is now the "Industry or training
// client" reader of the CV engine at /cv. This address forwards there with that reader chosen.
import type { Metadata } from "next";
import MovedTo from "@/components/MovedTo";

export const metadata: Metadata = {
  title: "Industry CV — Mohd Nor Akmal Khalid",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cv/" },
};

export default function Page() {
  return <MovedTo to="/cv/?reader=industry" label="The Industry CV is now part of the CV page." />;
}
