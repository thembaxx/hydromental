import type { ScienceRecord } from "@/lib/science";

export function ScienceProperties({
  science,
  className,
}: {
  science: ScienceRecord;
  className: string;
}) {
  return (
    <dl className={className}>
      {science.properties.map((property) => (
        <div key={property.label}>
          <dt>{property.displayLabel ?? property.label}</dt>
          <dd>
            <span className="n">
              {property.value}
              {property.unit ? ` ${property.unit}` : ""}
            </span>
            <small>
              {property.status === "predicted" && "Prediction · "}
              {property.note}
            </small>
            <small>
              <a href={property.source.url} target="_blank" rel="noreferrer">
                {property.source.label} ↗
              </a>{" "}
              · Retrieved {property.source.retrievedAt}
            </small>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function IsotopeReference({ science, symbol }: { science: ScienceRecord; symbol: string }) {
  return (
    <section className="panel-section isotope-reference">
      <h3>Isotopes, abundance and decay</h3>
      <p className="panel-copy">
        Isotopes share a proton count but have different neutron counts. This selection includes
        naturally tabulated compositions and a reference isotope for other elements. It is not a
        list of every known isotope.
      </p>
      <details>
        <summary>
          Explore {science.isotopes.length} isotope{science.isotopes.length === 1 ? "" : "s"} of{" "}
          {symbol}
        </summary>
        <div
          className="comparison-scroll"
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users need to scroll the reference table horizontally.
          tabIndex={0}
          role="region"
          aria-label={`${symbol} isotope data`}
        >
          <table className="comparison-table">
            <caption>Evaluated ground-state isotopes of {symbol}</caption>
            <thead>
              <tr>
                <th scope="col">Isotope</th>
                <th scope="col">Relative atomic mass</th>
                <th scope="col">Natural fraction</th>
                <th scope="col">Half-life</th>
                <th scope="col">Decay</th>
              </tr>
            </thead>
            <tbody>
              {science.isotopes.map((isotope) => (
                <tr key={isotope.massNumber}>
                  <th scope="row">
                    {symbol}-{isotope.massNumber}
                    {isotope.representative && <small>Reference isotope</small>}
                  </th>
                  <td className="n">{isotope.relativeAtomicMass ?? "Not tabulated"}</td>
                  <td className="n">{isotope.abundance ?? "Not tabulated"}</td>
                  <td>
                    {isotope.halfLife === "stbl"
                      ? "No decay observed"
                      : `${isotope.halfLife || "Not reported"}${isotope.halfLifeUnit ? ` ${isotope.halfLifeUnit}` : ""}${isotope.halfLifeUncertainty ? ` (uncertainty ${isotope.halfLifeUncertainty})` : ""}`}
                    {isotope.estimated && " · estimated"}
                  </td>
                  <td>
                    {isotope.decay
                      ?.replace(/B-/g, "β−")
                      .replace(/B\+/g, "β+")
                      .replace(/A=/g, "α=") ?? "No decay tabulated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-copy">
          Fractions use NIST’s terrestrial isotopic compositions, which can vary by sample.
          Parentheses denote uncertainty in the last digits. Half-lives and decay branches use
          NUBASE2020; # marks estimates, &gt;/&lt; mark limits. “No decay observed” follows that
          evaluation and does not prove permanent stability. Decay branch intensities are
          percentages; SF means spontaneous fission, EC electron capture, IT an isomeric transition.
        </p>
        <p className="panel-copy">
          <a href={science.isotopes[0].sources.nuclear.url} target="_blank" rel="noreferrer">
            NUBASE2020 ↗
          </a>{" "}
          ·{" "}
          <a
            href="https://physics.nist.gov/PhysRefData/Compositions/index.html"
            target="_blank"
            rel="noreferrer"
          >
            NIST compositions ↗
          </a>
        </p>
      </details>
    </section>
  );
}
