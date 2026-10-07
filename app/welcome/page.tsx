import type { Metadata } from "next";
import { WelcomePage } from "@/components/welcome-page";

export const metadata: Metadata = {
  title: "Welcome to Elementals",
  description:
    "Learn to explore all 118 elements: swipe through interactive atoms, find everyday uses, save favorites and build your discovery journal.",
  alternates: { canonical: "/welcome" },
};

export default function Page() {
  return <WelcomePage />;
}
