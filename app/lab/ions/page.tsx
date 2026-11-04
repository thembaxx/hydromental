import type { Metadata } from "next";
import { IonFigure } from "@/components/ion-figure";

export const metadata: Metadata = {
  title: "Ions · Interactive science experiment",
  description: "Predict ion charge, add or remove electrons in a 3D teaching model, and explain what changes.",
  alternates: { canonical: "/lab/ions" },
};

export default function Page() {
  return <IonFigure />;
}
