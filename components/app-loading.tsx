import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
export function AppLoading() {
  return (
    <main className="launch-screen" aria-busy="true">
      <BrandMark />
      <h1>Elementals</h1>
      <p>Explore all 118 elements, their atoms, and their everyday uses.</p>
      <p className="panel-copy" role="status">
        Loading your element explorer…
      </p>
      <Link href="/elements">Browse the element library</Link>
    </main>
  );
}
