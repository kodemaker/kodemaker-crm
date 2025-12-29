# ADR 0002: Velge Scalingo for produksjonsmiljø med staging/production-oppsett

- Status: Accepted
- Date: 2025-12-29
- Decision makers: Kodemaker CRM-teamet

## Context

Kodemaker CRM kjører i dag på Scalingo med ett enkelt miljø (`kodemaker-crm`) som brukes til testing. For å sikre produksjonskvalitet og GDPR-etterlevelse trenger vi:

1. **To separate miljøer**: Staging for testing og Production for faktiske brukere.
2. **GDPR-sikker hosting**: Data må behandles i henhold til europeisk personvernlovgivning.
3. **Moderne utvikleropplevelse**: Vurdere alternativer som Railway, Fly.io og Vercel.

### Evaluerte alternativer

| Tilbyder | EU-regioner | GDPR-posisjon | MCP/Claude Code | Migrasjonskompleksitet |
|----------|-------------|---------------|-----------------|------------------------|
| **Scalingo** | Frankrike (Paris, Roubaix) | EU-selskap, sterkest | Ingen | N/A |
| **Railway** | Nederland (EU-West) | US-selskap + DPA | Offisiell MCP | Lav |
| **Fly.io** | Amsterdam, Paris, Frankfurt | US-selskap + DPF | Offisiell MCP | Medium |
| **Vercel** | EU-regioner tilgjengelig | US-selskap + DPF | Offisiell MCP | Lav |

### DPA vs DPF: Hva er forskjellen?

For å forstå GDPR-risikoen ved ulike leverandører er det viktig å skille mellom disse mekanismene:

#### DPA (Data Processing Agreement / Databehandleravtale)

- **Hva det er**: En juridisk kontrakt mellom dataansvarlig (deg) og databehandler (hosting-leverandør) som pålegges av GDPR Artikkel 28.
- **Hva det gjør**: Definerer hvordan leverandøren skal behandle persondata på dine vegne, hvilke sikkerhetstiltak som kreves, og hva som skjer ved brudd.
- **Begrensning**: En DPA alene løser **ikke** problemet med dataoverføring til tredjeland (som USA). Den regulerer bare behandlingen, ikke *hvor* dataene befinner seg.

#### DPF (EU-US Data Privacy Framework)

- **Hva det er**: Et rammeverk vedtatt av EU-kommisjonen i juli 2023 som erstatter det ugyldige Privacy Shield.
- **Hva det gjør**: Tillater overføring av persondata fra EU til USA til sertifiserte amerikanske selskaper, basert på at USA har innført tilstrekkelige beskyttelsestiltak.
- **Begrensning**:
  - Rammeverket er **politisk sårbart** - forgjengeren (Privacy Shield) ble ugyldiggjort av EU-domstolen i Schrems II-dommen (2020).
  - Mange personverneksperter forventer at DPF også kan bli utfordret i retten.
  - Amerikanske overvåkingslover som FISA 702 gir fortsatt amerikanske myndigheter tilgang til data hos amerikanske selskaper, uavhengig av hvor serverne fysisk står.

#### Hvorfor EU-baserte selskaper er sikrere

Når databehandleren er et **EU-basert selskap** (som Scalingo i Frankrike):

1. **Ingen tredjelandsoverføring**: Data forlater aldri EU, så DPF/SCCs er ikke nødvendig.
2. **EU-jurisdiksjon**: Selskapet er underlagt kun EU-rett, ikke amerikanske overvåkingslover.
3. **Ingen FISA 702-risiko**: Amerikanske myndigheter kan ikke pålegge et fransk selskap å utlevere data.
4. **Forutsigbar juridisk situasjon**: Ikke avhengig av politiske rammeverk som kan ugyldiggjøres.

## Decision

1. **Beholde Scalingo som hosting-leverandør**
   - Scalingo er et fransk selskap med hovedkontor i Strasbourg.
   - Data lagres og behandles kun i Frankrike (osc-fr1 region).
   - Ingen juridisk eksponering mot amerikanske overvåkingslover.

2. **Opprette to separate miljøer**
   - **Staging** (`kodemaker-crm-staging`): For testing og utvikling. Omdøpt fra eksisterende `kodemaker-crm`.
   - **Production** (`kodemaker-crm-prod`): For faktiske brukere og produksjonsdata.

3. **Separate databaser per miljø**
   - Hver app får sin egen PostgreSQL-addon.
   - Produksjonsdata isoleres fullstendig fra testdata.

4. **Environment-spesifikke konfigurasjoner**
   - `NODE_ENV` settes til `staging` eller `production`.
   - Separate `NEXTAUTH_SECRET` for hvert miljø.
   - Separate OAuth-credentials anbefales (men samme kan brukes midlertidig).

## Alternatives considered

### 1. Railway med EU-region

- **Fordeler**: Offisiell MCP-server for Claude Code, moderne DX, pay-per-use.
- **Ulemper**: Amerikansk selskap, DPF-avhengig, EU-regioner kun på Pro-plan.
- **Vurdering**: God utvikleropplevelse, men utilstrekkelig GDPR-posisjon for et CRM med persondata.

### 2. Fly.io med EU-region

- **Fordeler**: Offisiell MCP-server, multi-region support, god ytelse.
- **Ulemper**: Amerikansk selskap, mer DevOps-kunnskap påkrevd, Postgres håndteres annerledes.
- **Vurdering**: Teknisk solid, men samme GDPR-bekymringer som Railway.

### 3. Vercel med EU-region

- **Fordeler**: Best-in-class Next.js-support (de laget det), offisiell MCP-server.
- **Ulemper**: Ingen persistent datalagring i EU, krever ekstern DB-leverandør, serverless functions defaulter til USA.
- **Vurdering**: Utmerket for frontend, men kompliserer arkitekturen og løser ikke GDPR-problemet.

### 4. Hybrid: Scalingo prod + Railway staging

- **Fordeler**: MCP-integrasjon i utviklingsmiljø, GDPR-sikker produksjon.
- **Ulemper**: Ulik infrastruktur mellom miljøer kan gi "works on staging"-problemer.
- **Vurdering**: Interessant kompromiss, men introduserer unødvendig kompleksitet.

## Consequences

### Positive

- **Sterkest mulige GDPR-posisjon**
  - Ingen juridisk usikkerhet rundt dataoverføring til USA.
  - Ikke avhengig av politisk ustabile rammeverk som DPF.

- **Enkel miljøseparasjon**
  - Staging og production er isolerte apper med egne databaser.
  - Tydelig deploy-workflow via git remotes.

- **Eksisterende infrastruktur**
  - Ingen migrasjon nødvendig.
  - Procfile og konfigurasjon fungerer allerede.

### Negative / trade-offs

- **Ingen MCP/Claude Code-integrasjon**
  - Kan ikke deploye eller overvåke via Claude Code.
  - Må bruke Scalingo CLI eller dashboard manuelt.

- **Mindre "moderne" DX**
  - Scalingo har ikke like polert UI/UX som Railway eller Vercel.
  - Dokumentasjon er primært på fransk (engelsk tilgjengelig, men mindre omfattende).

- **Potensielt dyrere enn pay-per-use**
  - Scalingo fakturerer per container, ikke per faktisk bruk.
  - To miljøer betyr dobbel kostnad for containers.

## Implementation notes

- Eksisterende `kodemaker-crm` omdøpes til `kodemaker-crm-staging`.
- Ny app `kodemaker-crm-prod` opprettes med egen PostgreSQL-addon.
- Git remotes `staging` og `production` peker til respektive apper.
- Deploy til staging først, deretter production etter godkjenning.

## References

- [Scalingo GDPR Compliance](https://scalingo.com/gdpr)
- [EU-US Data Privacy Framework](https://www.dataprivacyframework.gov/)
- [Schrems II-dommen (CJEU C-311/18)](https://curia.europa.eu/juris/liste.jsf?num=C-311/18)
- [Railway DPA](https://railway.com/legal/dpa)
- [Fly.io DPF Policy](https://fly.io/legal/data-privacy-framework/)
- [Vercel DPF Certification](https://vercel.com/changelog/vercel-is-now-certified-under-the-eu-us-data-privacy-framework-dpf)
