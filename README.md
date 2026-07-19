# Boligkalkulator

Planleggingsverktøy for førstegangskjøpere: test tallene dine mot utlånsforskriftens tre krav
(gjeldsgrad 5×, egenkapital 10 %, stresstest +3 pp), sammenlign banker, lær BSU-reglene og
følg en 12-måneders plan frem mot kjøp.

Bygget med **React + TypeScript + Vite**, diagrammer med **Chart.js**. Designet er importert
fra Claude Design (`Boligkalkulator.dc.html`). All inndata lagres automatisk i nettleserens
`localStorage` — ingenting sendes noe sted.

## Kom i gang

```bash
npm install
npm run dev      # utviklingsserver på http://localhost:5173
npm run build    # typesjekk + produksjonsbygg til dist/
npm run preview  # forhåndsvis produksjonsbygget
```

## Struktur

```
src/
  lib/finance.ts        # rene beregningsfunksjoner (annuitet, stresstest, de tre grensene)
  lib/format.ts         # tallformatering (nb-NO)
  state.ts              # app-tilstand + localStorage-persistens
  data/content.ts       # statisk innhold: banker, regler, BSU-satser, 12-mnd-plan
  components/
    CalculatorTab.tsx   # kalkulatoren med KPI-er, flaskehals og diagrammer
    BanksTab.tsx        # bankoversikt + byttekalkulator
    RulesTab.tsx        # utlånsforskriftens krav
    BsuTab.tsx          # BSU og førstehjemslån
    PlanTab.tsx         # avkrysningsplan med fremdrift
    charts.tsx          # Chart.js-innpakninger
    inputs.tsx          # gjenbrukbare skjemafelt (beløp, slider, segmentert velger)
boligdashboard.html     # opprinnelig HTML-prototype (beholdt som referanse)
```

Merk: Estimatene er forenklede (sjablongskatt og SIFO-nære levekostnader) og er planlegging,
ikke finansiell rådgivning. Satser og renter i innholdet er per juli 2026.
