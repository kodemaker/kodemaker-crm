## Bugs

- Incoming Mail: FWD: Lag noe logikk som sjekker om to-adresse er @kodemaker.no.
- Incoming Mail: FWD: insert crmUser hvis det ikke finnes og @kodemaker.no

## Features

- Flere slette-knapper. Email, kommentar, lead, oppfølging, kunde

## PROD Deployment

- [x] ~~Overføre repo til kodemaker.no~~ (Done)
- [x] ~~Lag konto på Scalingo for app og db~~ (Done: staging + production environments)
- [x] ~~Lag endelig deploy mot kodemaker rep og kodemaker secrets~~ (Done: see ADR 0002)
- TODO Lag kodemaker-konto på postmarkapp.com (for production email inbound)

## Tech debt / refactoring

- TODO Rydde opp i “ny organisasjon”-flyt (`CustomersPage` vs `NewCompanyDialog`).

  - Problem: `CustomersPage` har egen `companySchema` + `useForm` + `onSubmit` som overlapper `NewCompanyDialog`.
  - Forslag: Velg én sann kilde (trolig `NewCompanyDialog`) og fjern ubrukt/duplisert form-logikk i `CustomersPage`.
  - Gevinst: Mindre teknisk gjeld og mer forutsigbar oppførsel.

- TODO Justere UI-typer til å bruke `src/types/api.ts` som base.

  - Problem: Lokale typer (f.eks. `type Company` i `CustomersPage`) kan divergere fra `ApiCompany`.
  - Forslag: Innfør utvidelser som `type CompanyWithCounts = ApiCompany & { leadCounts?: ... }` i stedet for helt egne typer.
  - Gevinst: Sterkere sammenheng mellom API og frontend, tryggere refaktorering.

- TODO Ekstrahere hook for å fullføre oppfølginger (PATCH + mutate).

  - Problem: `FollowupsList` gjør både fetching, visning og PATCH-kall mot `/api/followups/[id]`.
  - Forslag: Lag en hook (`useCompleteFollowup` / `useFollowups`) for mutasjonen, og la `FollowupsList` være ren presentasjon.
  - Gevinst: Bedre separasjon av ansvar og enklere gjenbruk av logikken.

- TODO Utvide `README.md` med korte end-to-end feature-flyter.
  - Problem: README beskriver stacken, men ikke konkrete flows for nye utviklere.
  - Forslag: Legg inn seksjoner som “Flyt: Opprett organisasjon”, “Flyt: Opprette lead”, “Flyt: Oppfølging + hendelser” med lenker til relevante filer.
  - Gevinst: Raskere onboarding (og lettere å komme tilbake etter pauser).
