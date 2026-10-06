import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categories, elements, group, period } from "@/lib/elements";
import { elementSlug, findElementBySlug, getScience } from "@/lib/science";
import { jsonLd, siteOrigin } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
// Unknown names are handled by notFound; common spelling aliases redirect canonically.
export const dynamicParams = true;
export function generateStaticParams() {
  return [
    ...elements.map((element) => ({ slug: elementSlug(element) })),
    ...["aluminum", "cesium", "sulphur"].map((slug) => ({ slug })),
  ];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const element = findElementBySlug((await params).slug);
  if (!element) return { title: "Element not found" };
  const description = `${element.n} (${element.s}), atomic number ${element.z}: ${getScience(element.z).everyday}`;
  const url = `/elements/${elementSlug(element)}`;
  return {
    title: `${element.n} (${element.s}) — facts, uses, and electrons`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${element.n} (${element.s}) | Elementals`,
      description,
      url,
      type: "article",
    },
  };
}
export default async function ElementPage({ params }: Props) {
  const { slug } = await params;
  const element = findElementBySlug(slug);
  if (!element) notFound();
  if (slug !== elementSlug(element)) permanentRedirect(`/elements/${elementSlug(element)}`);
  const science = getScience(element.z);
  const mass = science.properties.find((property) => property.label === "Atomic mass")!;
  const connected = elements[science.connection.atomicNumber - 1];
  const previous = elements[element.z - 2];
  const next = elements[element.z];
  const [family, color] = categories[element.c];
  const url = `${siteOrigin()}/elements/${elementSlug(element)}`;
  return (
    <main className="reference-page" style={{ "--family-color": color } as React.CSSProperties}>
      <header className="reference-header">
        <a href="/" className="reference-brand">
          <BrandMark /> Elementals
        </a>
        <a href="/elements">All elements</a>
      </header>
      <article>
        <header className="reference-intro">
          <Badge variant="unstyled" className="reference-eyebrow">
            {family} · Element {element.z}
          </Badge>
          <span className="reference-hero-symbol" aria-hidden="true">
            {element.s}
          </span>
          <h1>{element.n}</h1>
          <p>{science.description}</p>
          <p>{science.story}</p>
          <Button asChild variant="unstyled" className="reference-action">
            <a href={`/?element=${element.s}`}>Explore {element.n}'s atom</a>
          </Button>
        </header>
        <dl className="reference-facts">
          <div>
            <dt>Atomic number</dt>
            <dd className="n">{element.z}</dd>
          </div>
          <div>
            <dt>Atomic mass</dt>
            <dd className="n">
              {mass.value}
              {mass.unit && ` ${mass.unit}`}
            </dd>
          </div>
          <div>
            <dt>Family</dt>
            <dd>{family}</dd>
          </div>
          <div>
            <dt>Period</dt>
            <dd className="n">{period(element)}</dd>
          </div>
          <div>
            <dt>Group</dt>
            <dd className={typeof group(element) === "number" ? "n" : undefined}>
              {group(element) === "—" ? "f-block" : group(element)}
            </dd>
          </div>
          <div>
            <dt>Standard state</dt>
            <dd>
              {science.properties.find((property) => property.label === "Standard state")!.value}
            </dd>
          </div>
        </dl>
        <div className="reference-content-grid">
          <Card variant="unstyled" className="reference-card">
            <CardHeader variant="unstyled">
              <CardTitle variant="unstyled">
                <h2>In everyday life</h2>
              </CardTitle>
            </CardHeader>
            <CardContent variant="unstyled">
              <p>{science.everyday}</p>
            </CardContent>
          </Card>
          <Card variant="unstyled" className="reference-card">
            <CardHeader variant="unstyled">
              <CardTitle variant="unstyled">
                <h2>Something to remember</h2>
              </CardTitle>
            </CardHeader>
            <CardContent variant="unstyled">
              <p>{science.fact}</p>
            </CardContent>
          </Card>
          <Card variant="unstyled" className="reference-card">
            <CardHeader variant="unstyled">
              <CardTitle variant="unstyled">
                <h2>Meet its electrons</h2>
              </CardTitle>
            </CardHeader>
            <CardContent variant="unstyled">
              <p className="reference-configuration">{science.configuration}</p>
              {science.configurationNote && <p>{science.configurationNote}</p>}
              <p>Electrons per shell: {science.shells.join(" · ")}.</p>
              <p>
                The playground shows an illustrative shell model. Real electrons are described by
                quantum orbitals, rather than tiny planets traveling along fixed paths.
              </p>
            </CardContent>
          </Card>
          <Card variant="unstyled" className="reference-card">
            <CardHeader variant="unstyled">
              <CardTitle variant="unstyled">
                <h2>A connection to explore</h2>
              </CardTitle>
            </CardHeader>
            <CardContent variant="unstyled">
              <p>{science.connection.explanation}</p>
              {connected && (
                <a href={`/elements/${elementSlug(connected)}`}>
                  Meet {connected.n} ({connected.s})
                </a>
              )}
            </CardContent>
          </Card>
        </div>
        {science.properties.length > 0 && (
          <section className="reference-section" aria-labelledby="properties-title">
            <h2 id="properties-title">Properties and conditions</h2>
            <dl className="reference-properties">
              {science.properties.map((property) => (
                <div key={property.label}>
                  <dt>{property.label}</dt>
                  <dd>
                    <span className={/^[-+]?\d/.test(property.value) ? "n" : undefined}>
                      {property.value}
                      {property.unit && ` ${property.unit}`}
                    </span>
                    {property.note && <small>{property.note}</small>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        <section className="reference-section" aria-labelledby="sources-title">
          <h2 id="sources-title">Follow the science</h2>
          <p>
            Use these original references to explore the data and context. Atomic weights can vary
            with isotope composition; values for elements without stable isotopes may describe a
            representative isotope rather than a standard atomic weight.
          </p>
          <ul>
            {science.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label}
                  <span className="sr-only"> (opens a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <nav className="reference-pagination" aria-label="Adjacent elements">
        {previous ? <a href={`/elements/${elementSlug(previous)}`}>← {previous.n}</a> : <span />}
        {next && <a href={`/elements/${elementSlug(next)}`}>{next.n} →</a>}
      </nav>
      <footer className="reference-footer">
        <a href="/elements">Browse all 118 elements</a>
        <p>Touch. Explore. Discover.</p>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: element.n,
            alternateName: element.s,
            termCode: String(element.z),
            url,
            description: science.story,
            inDefinedTermSet: `${siteOrigin()}/elements`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Elementals", item: siteOrigin() },
              {
                "@type": "ListItem",
                position: 2,
                name: "Elements",
                item: `${siteOrigin()}/elements`,
              },
              { "@type": "ListItem", position: 3, name: element.n, item: url },
            ],
          }),
        }}
      />
    </main>
  );
}
