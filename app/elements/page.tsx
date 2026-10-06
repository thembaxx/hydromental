import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categories, elements } from "@/lib/elements";
import { elementSlug } from "@/lib/science";
import { jsonLd, siteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  title: "The 118 elements",
  description:
    "Browse all 118 chemical elements, from hydrogen to oganesson. Discover everyday uses, electron configurations, scientific facts, and original sources.",
  alternates: { canonical: "/elements" },
  openGraph: { title: "Meet the 118 elements", url: "/elements" },
};

export default function ElementsPage() {
  return (
    <main className="reference-page">
      <header className="reference-header">
        <a href="/" className="reference-brand">
          <BrandMark /> Elementals
        </a>
        <Button asChild variant="unstyled" className="reference-action">
          <a href="/">Open the playground</a>
        </Button>
      </header>
      <section className="reference-intro" aria-labelledby="library-title">
        <Badge variant="unstyled" className="reference-eyebrow">
          118 elements · endless curiosity
        </Badge>
        <h1 id="library-title">Meet the elements.</h1>
        <p>
          Every atom has a story. Explore chemical families, everyday uses, electron configurations,
          and facts you can trace to their sources.
        </p>
      </section>
      <nav className="reference-family-nav" aria-label="Element families">
        {Object.entries(categories).map(([key, [name]]) => (
          <a key={key} href={`#family-${key}`}>
            {name}
          </a>
        ))}
      </nav>
      {Object.entries(categories).map(([key, [name, color]]) => (
        <section
          className="reference-family"
          id={`family-${key}`}
          key={key}
          aria-labelledby={`family-title-${key}`}
          style={{ "--family-color": color } as React.CSSProperties}
        >
          <h2 id={`family-title-${key}`}>{name}</h2>
          <div className="reference-grid">
            {elements
              .filter((element) => element.c === key)
              .map((element) => (
                <a
                  className="reference-element-link"
                  href={`/elements/${elementSlug(element)}`}
                  key={element.z}
                >
                  <span className="reference-number">{element.z}</span>
                  <strong className="reference-symbol">{element.s}</strong>
                  <span>{element.n}</span>
                </a>
              ))}
          </div>
        </section>
      ))}
      <footer className="reference-footer">
        <p>
          Our animated atoms are illustrative models. Reference pages include sources and explain
          measurement conditions where available.
        </p>
        <a href="/">Back to the playground</a>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "The 118 chemical elements",
            numberOfItems: elements.length,
            itemListElement: elements.map((element) => ({
              "@type": "ListItem",
              position: element.z,
              name: element.n,
              url: `${siteOrigin()}/elements/${elementSlug(element)}`,
            })),
          }),
        }}
      />
    </main>
  );
}
