# P0 — Błędy krytyczne (napraw najpierw)

Priorytet: **P0** — te błędy powodują crash runtime lub zapis nieprawidłowych danych.

---

## ZADANIE P0-1: Manual Override — `APPROVED_WITH_EXCEPTION`

### Problem

`ManualOverrideModal.tsx` oferuje opcję `APPROVED_WITH_EXCEPTION`, ale:
- pole `ManualOverride.overrideDecision` ma typ enum `Decision` (tylko: `APPROVED`, `REQUIRES_REVIEW`, `REJECTED`, `MISSING_INFORMATION`)
- `RequestStatus` ma `APPROVED_WITH_EXCEPTION`, ale `Decision` — nie
- Przy wyborze tej opcji Prisma odrzuci zapis
- `overrideRequest` ustawia `status: APPROVED` zamiast `APPROVED_WITH_EXCEPTION` (logika `decision.includes('APPROVED')`)

### Pliki do zmiany

- `web/prisma/schema.prisma`
- `web/src/app/requests/[id]/ManualOverrideModal.tsx`
- `web/src/app/requests/[id]/actions.ts`
- `web/src/app/requests/[id]/page.tsx` (opcjonalnie: wyświetlanie oryginalnej decyzji systemowej)

### Kroki

**Opcja A (zalecana — zgodna z REQUIREMENTS §7):**

1. Rozdziel **decyzję systemową** (`Decision`) od **statusu procesu** (`RequestStatus`).
2. W `ManualOverride`:
   - Zmień `overrideDecision` na typ, który obejmuje zarówno `Decision`, jak i status końcowy, np. dodaj pole `overrideStatus: RequestStatus` **albo** rozszerz enum (np. `OverrideOutcome`).
   - Najprościej: dodaj do schematu pole `overrideStatus RequestStatus` obok `overrideDecision Decision?`.
3. W modalu:
   - `APPROVED` → `overrideDecision: APPROVED`, `overrideStatus: APPROVED`
   - `APPROVED_WITH_EXCEPTION` → `overrideDecision: APPROVED` (lub zostaw `originalDecision`), `overrideStatus: APPROVED_WITH_EXCEPTION`
   - `REJECTED` → `overrideDecision: REJECTED`, `overrideStatus: REJECTED`
   - `REQUIRES_REVIEW` → `overrideDecision: REQUIRES_REVIEW`, `overrideStatus: IN_REVIEW`
4. W `overrideRequest`:
   - **Nie nadpisuj** `Request.decision` — zostaw oryginalną decyzję systemową (NFR-7).
   - Aktualizuj tylko `Request.status` na podstawie `overrideStatus`.
5. W UI historii override pokaż: `System Decision: X` → `Override Status: Y`.

**Opcja B (minimalna):** usuń `APPROVED_WITH_EXCEPTION` z selecta w modalu. **Nie zalecane** — wymaganie FR-17 i UC-9 tego wymagają.

### Kryteria akceptacji

- [ ] Wybór każdej opcji w modalu zapisuje się bez błędu Prisma
- [ ] `APPROVED_WITH_EXCEPTION` ustawia status wniosku na `APPROVED_WITH_EXCEPTION`
- [ ] `Request.decision` pozostaje decyzją silnika (nie jest nadpisywane)
- [ ] `ManualOverride.originalDecision` zawiera decyzję sprzed override
- [ ] `AuditEvent` zawiera `originalDecision` i nowy status

---

## ZADANIE P0-2: Formularz nowej polityki — błędne domeny enum

### Problem

`web/src/app/policies/new/page.tsx` oferuje wartości `SECURITY`, `LEGAL`, `IT`, `HR`, ale `PolicyDomain` w Prisma to:

```
PROCUREMENT | VENDOR_RISK | DATA_SECURITY | FINANCE
```

Utworzenie polityki z `SECURITY` kończy się błędem bazy.

### Pliki do zmiany

- `web/src/app/policies/new/page.tsx`

### Kroki

1. Zamień opcje `<select name="domain">` na dokładnie 4 wartości ze schematu:
   - `PROCUREMENT` — Zakupy
   - `VENDOR_RISK` — Ryzyko dostawcy
   - `DATA_SECURITY` — Bezpieczeństwo danych
   - `FINANCE` — Finanse
2. Usuń `SECURITY`, `LEGAL`, `IT`, `HR`.

### Kryteria akceptacji

- [ ] Utworzenie polityki z każdej opcji selecta kończy się sukcesem
- [ ] Redirect na `/policies/[id]` działa
- [ ] Wersja v1 w statusie `DRAFT` jest tworzona

---

## ZADANIE P0-3: Pulpit — dynamiczna klasa Tailwind

### Problem

`web/src/app/page.tsx` linia ~37:

```tsx
className={`grid grid-cols-1 md:grid-cols-${isRestrictedRole ? '3' : '4'} gap-6`}
```

Tailwind JIT **nie kompiluje** dynamicznych klas — siatka może być zepsuta.

### Kroki

1. Zastąp warunkową klasą statyczną:

```tsx
className={isRestrictedRole
  ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
  : 'grid grid-cols-1 md:grid-cols-4 gap-6'}
```

### Kryteria akceptacji

- [ ] Pulpit ma 3 kolumny dla Requester/Policy Owner/Approver i 4 dla Reviewer/Admin/Auditor na desktopie

---

## ZADANIE P0-4: Edycja reguł na wersji nie-DRAFT (guard)

### Problem

`editRuleAction` i `deleteRuleAction` w `policies/[id]/actions.ts` **nie sprawdzają** statusu wersji przed edycją/usunięciem (w przeciwieństwie do `addRuleAction`).

### Kroki

1. W `editRuleAction` i `deleteRuleAction`:
   - Pobierz regułę z `include: { policyVersion: true }`
   - Jeśli `policyVersion.status !== 'DRAFT'` → `throw new Error('Można edytować tylko wersje robocze')`
2. UI już ukrywa formularze — guard w server action jest obowiązkowy (NFR-4).

### Kryteria akceptacji

- [ ] Bezpośrednie wywołanie server action na opublikowanej wersji zwraca błąd
- [ ] Opublikowane reguły pozostają niemutowalne
