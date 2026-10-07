import type { Metadata } from "next";
import { PlaygroundApp } from "@/components/playground-app";
export const metadata: Metadata = {
  title: "Science playground · Elementals",
  description:
    "Eight interactive chemistry games: build molecules and atoms in 3D, balance equations, solve periodic puzzles, explore crystals and find everyday elements. Save your creations and learn at your own pace.",
  alternates: { canonical: "/playground" },
};
export default function Page() {
  return (
    <>
      <PlaygroundApp />
      <noscript>
        <p>
          Enable JavaScript for interactive games.{" "}
          <a href="/elements">Read the complete element reference without JavaScript.</a>
        </p>
      </noscript>
    </>
  );
}
