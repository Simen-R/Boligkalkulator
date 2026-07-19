import { BSU_CARDS, BSU_STATS } from '../data/content'

export function BsuTab() {
  return (
    <section className="bsu-layout">
      <h2 className="section-title">BSU og førstehjem</h2>
      <p className="section-intro">
        Boligsparing for ungdom (BSU) er den mest lønnsomme risikofrie boligsparingen for deg under 34. Her er satsene
        for 2026.
      </p>

      <div className="bsu-stats">
        {BSU_STATS.map((s) => (
          <div key={s.label} className="card bsu-stat">
            <div className="bsu-stat__value">{s.value}</div>
            <div className="bsu-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="notes-grid">
        {BSU_CARDS.map((c) => (
          <div key={c.title} className="card note-card">
            <h4>{c.title}</h4>
            <p>{c.body}</p>
          </div>
        ))}
      </div>

      <div className="info-box">
        <h4>Førstehjemslån og startlån</h4>
        <p>
          Flere banker tilbyr egne førstehjems-pakker til unge (18–33) med gunstigere vilkår. Får du ikke lån i vanlig
          bank, kan Husbankens startlån via kommunen være et alternativ. Foreldre kan også stille sikkerhet (kausjon) i
          egen bolig for å dekke egenkapitalkravet.
        </p>
      </div>
      <p className="disclaimer">
        Kilde: Skatteetaten (BSU-satser 2026). Skattefradraget forutsetter skattbar inntekt og at du ikke eier bolig ved
        årsskiftet.
      </p>
    </section>
  )
}
