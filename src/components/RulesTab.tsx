import { RULES, RULE_NOTES } from '../data/content'

export function RulesTab() {
  return (
    <section className="rules-layout">
      <h2 className="section-title">Utlånsforskriften — de tre hovedkravene</h2>
      <p className="section-intro">
        Reglene banken må følge når de vurderer boliglånet ditt. Fra 2025 er egenkapitalkravet senket fra 15 % til 10 %.
      </p>
      <div className="rules-grid">
        {RULES.map((r) => (
          <div key={r.title} className="card rule-card">
            <div className="rule-card__big">{r.big}</div>
            <h3>{r.title}</h3>
            <p>{r.body}</p>
          </div>
        ))}
      </div>
      <div className="notes-grid">
        {RULE_NOTES.map((n) => (
          <div key={n.title} className="card note-card">
            <h4>{n.title}</h4>
            <p>{n.body}</p>
          </div>
        ))}
      </div>
      <p className="disclaimer">Kilder: Finansdepartementet / Finanstilsynet (utlånsforskriften), gjeldende 2026.</p>
    </section>
  )
}
