export interface Bank {
  name: string
  cat: 'Lavprisbank' | 'Storbank'
  rate: string
  note: string
}

export const BANKS: Bank[] = [
  { name: 'Nybygger.no (Sparebanken Øst)', cat: 'Lavprisbank', rate: '4,81 %', note: 'Lån inntil 60 % av boligverdi, uten betingelser' },
  { name: 'Nordnet', cat: 'Lavprisbank', rate: '4,47 %', note: 'Krever investering hos Nordnet' },
  { name: 'Bulder Bank', cat: 'Lavprisbank', rate: '5,03–5,17 %', note: 'Ingen gebyrer, kundeutbytte, høyt rangert av unge' },
  { name: 'Sbanken', cat: 'Lavprisbank', rate: '≈ 5,2 %', note: 'Gode digitale løsninger, førstehjems-pakke' },
  { name: 'DNB', cat: 'Storbank', rate: '5,7–6,0 %', note: 'Grønn rente ned mot 5,24 %. Kan forhandles.' },
  { name: 'Nordea', cat: 'Storbank', rate: '5,7–6,0 %', note: 'Grønn rente ned mot 4,94 % for energiklasse A/B' },
]

export interface Rule {
  big: string
  title: string
  body: string
}

export const RULES: Rule[] = [
  {
    big: '5×',
    title: 'Gjeldsgrad',
    body: 'Samlet gjeld kan ikke overstige 5 ganger brutto årsinntekt. Alt teller med — også studielån, billån og hele kredittkortrammen.',
  },
  {
    big: '10 %',
    title: 'Egenkapital',
    body: 'Du må ha minst 10 % av kjøpesummen selv (senket fra 15 % i 2025). Banken kan låne inntil 90 % av boligverdien.',
  },
  {
    big: '+3',
    title: 'Stresstest',
    body: 'Økonomien din må tåle en rente 3 prosentpoeng over dagens nivå, og aldri under 7 %. Dette er ofte det som stopper unge kjøpere.',
  },
]

export interface RuleNote {
  title: string
  body: string
}

export const RULE_NOTES: RuleNote[] = [
  {
    title: 'Fleksibilitetskvote',
    body: 'Bankene kan gjøre unntak for inntil 10 % av lånene i Oslo (8 % ellers). Du har ikke krav på unntak, men det er verdt å spørre.',
  },
  {
    title: 'Fellesgjeld teller',
    body: 'Fellesgjeld i borettslag regnes som din gjeld og spiser av lånerammen. Sjekk den før du byr.',
  },
  {
    title: 'Avdragskrav',
    body: 'Lån med belåningsgrad over 60 % må ha avdragsbetaling. Rammelån er begrenset til maks 60 %.',
  },
  {
    title: 'Omkostninger',
    body: 'Ved selveierbolig kommer dokumentavgift på 2,5 % og tinglysingsgebyr i tillegg — egenkapitalen må dekke dette også.',
  },
]

export const BSU_STATS = [
  { value: '27 500 kr', label: 'Maks sparing per år' },
  { value: '300 000 kr', label: 'Maks totalt på kontoen' },
  { value: '2 750 kr', label: 'Skattefradrag (10 %) per år' },
  { value: 't.o.m. 33 år', label: 'Øvre aldersgrense' },
]

export const BSU_CARDS: RuleNote[] = [
  {
    title: 'Skattefradraget',
    body: 'Du får 10 % av årets innskudd trukket rett fra skatten — inntil 2 750 kr. Det forutsetter at du har skattbar inntekt (over ca. 100 000 kr).',
  },
  {
    title: 'Forsvinner når du eier',
    body: 'Eier du bolig helt eller delvis ved årsskiftet, mister du skattefradraget det året. Du kan fortsatt spare og beholde renten.',
  },
  {
    title: 'Høy rente',
    body: 'BSU gir bankens beste innskuddsrente — opp mot 6,1–6,4 % i 2026, langt over vanlig sparekonto. Fyll opp før 31. desember.',
  },
  {
    title: 'Teller som egenkapital',
    body: 'BSU-oppsparingen din teller fullt ut som egenkapital når du søker boliglån. Pengene må brukes på bolig.',
  },
]

export interface PlanGroup {
  phase: string
  items: { id: string; text: string }[]
}

export const PLAN: PlanGroup[] = [
  {
    phase: 'Nå — de neste 3 månedene',
    items: [
      { id: 'p1', text: 'Skaff full oversikt over inntekt, gjeld og faste utgifter' },
      { id: 'p2', text: 'Fyll opp BSU før nyttår for skattefradraget (inntil 2 750 kr)' },
      { id: 'p3', text: 'Avslutt ubrukte kredittkort — hele rammen teller som gjeld' },
    ],
  },
  {
    phase: '3–6 måneder',
    items: [
      { id: 'p4', text: 'Sett opp fast månedlig sparing på egen konto' },
      { id: 'p5', text: 'Vurder å nedbetale dyr forbruks- eller billånsgjeld' },
      { id: 'p6', text: 'Sjekk hva du kan låne — bruk kalkulatoren og lek med tallene' },
    ],
  },
  {
    phase: '6–9 måneder',
    items: [
      { id: 'p7', text: 'Innhent rentetilbud fra minst tre banker' },
      { id: 'p8', text: 'Sjekk fagforenings- og førstehjemsavtaler du har rett på' },
      { id: 'p9', text: 'Bli enig med en eventuell medlåntaker om ansvar og andeler' },
    ],
  },
  {
    phase: '9–12 måneder — klar til kjøp',
    items: [
      { id: 'p10', text: 'Søk om finansieringsbevis' },
      { id: 'p11', text: 'Sett et realistisk budsjett inkl. omkostninger (dokumentavgift 2,5 %)' },
      { id: 'p12', text: 'Gå på visninger og øv deg på budrunder' },
    ],
  },
]

/** Sjekkliste før budrunden — avkrysning lagres i samme checked-map som planen. */
export const BID_CHECKS: { id: string; text: string }[] = [
  { id: 'b1', text: 'Les hele tilstandsrapporten — noter alle TG2/TG3 og hva utbedring vil koste' },
  { id: 'b2', text: 'Les salgsoppgaven og selgers egenerklæring, og spør megler om alt som er uklart' },
  { id: 'b3', text: 'Borettslag: sjekk årsregnskap, fellesgjeld, vedlikeholdsplan og om laget har IN-ordning' },
  { id: 'b4', text: 'Sjekk hva sammenlignbare boliger i området faktisk er solgt for' },
  { id: 'b5', text: 'Bekreft at finansieringsbeviset er gyldig og dekker totalprisen' },
  { id: 'b6', text: 'Sett maksgrensen din før budrunden starter — og hold den' },
]

export const NECK_LABELS: Record<string, string> = {
  debt: 'Gjeldsgrad',
  ek: 'Egenkapital',
  stress: 'Betjeningsevne',
}

export const NECK_TIPS: Record<string, string> = {
  debt: 'Samlet gjeld kan ikke overstige 5× bruttoinntekt. Nedbetal eksisterende gjeld, eller øk inntekten — f.eks. ved å kjøpe sammen med noen.',
  ek: 'Du trenger minst 10 % egenkapital. Fortsett å spare (gjerne i BSU), eller undersøk om noen kan stille som kausjonist.',
  stress: 'Banken sjekker at du tåler rente + 3 prosentpoeng (minst 7 %) etter levekostnader. Lavere gjeld eller høyere inntekt gir mer å betjene lånet med.',
}
