# Zadanie 02 — P0: Design tokens i komponenty bazowe

## Prompt dla Antigravity (wklej całość)

```
Kontekst: PolicyChecker web/. Po zadaniu 01 (labels.ts) — budujesz wspólną warstwę wizualną w stylu spokojnym, "apple-like": jasne tło, jeden akcent, mało kolorów.

Zadanie P0 — design tokens + komponenty:

1. Zaktualizuj web/src/app/globals.css:
   - Tło aplikacji: #F5F5F7 (lub tailwind slate-100)
   - --color-accent: #0071E3 (primary blue)
   - --color-text-primary: #1D1D1F
   - --color-text-secondary: #6E6E73
   - Usuń konflikt: body powinno używać fontu z layout (Geist) — usuń nadpisanie na Inter jeśli koliduje
   - Wyłącz auto dark mode w :root jeśli powoduje niespójność (aplikacja jest light-only na MVP)

2. Utwórz komponenty w web/src/components/ui/:
   - PageHeader.tsx — props: title, description?, actions? (slot)
   - StatusBadge.tsx — props: status (RequestStatus), size?: sm|md — używa labels.ts + stonowane tło (np. zielony/10 dla approved, amber/10 dla review)
   - Card.tsx — biała karta: rounded-2xl border border-slate-200/80 bg-white shadow-sm

3. Zastosuj PageHeader + Card na:
   - web/src/app/page.tsx (dashboard)
   - web/src/app/requests/page.tsx
   - web/src/app/policies/page.tsx

4. Ogranicz tęczę kolorów na dashboardzie:
   - Liczby w kartach metryk: text-slate-900 (domyślnie)
   - Tylko semantyczne akcenty: amber dla "oczekujące", red dla "odrzucone", green dla "zatwierdzone" — reszta neutralna

Kryteria akceptacji:
- Spójne tło i typografia na głównych stronach
- StatusBadge używany w liście wniosków i szczegółach
- Nie dodawaj shadcn całego — tylko te 3 lekkie komponenty
```

## Pliki

- `web/src/app/globals.css`
- `web/src/components/ui/PageHeader.tsx`
- `web/src/components/ui/StatusBadge.tsx`
- `web/src/components/ui/Card.tsx`
- `web/src/app/page.tsx`, `requests/page.tsx`, `policies/page.tsx`
