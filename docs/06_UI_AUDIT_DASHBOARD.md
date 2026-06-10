# P2 — UI szczegółów, audyt, pulpit

Priorytet: **P2** — FR-6, FR-7, FR-16, FR-18, UC-10, UC-11.

Część wyjaśnialności (FR-5) jest w `03_RULE_ENGINE.md` (P1-15).

---

## ZADANIE P2-1: Strona `/audit` — pełny dziennik

### Problem

`/audit` pokazuje tylko `PolicyEvaluation`, nie `AuditEvent`, manual override, zmiany polityk.

### Pliki

- `web/src/app/audit/page.tsx`
- opcjonalnie: `web/src/app/audit/[id]/page.tsx`

### Kroki

1. Dodaj zakładki lub filtr typu zdarzenia:
   - Oceny automatyczne (`PolicyEvaluation`)
   - Zdarzenia systemowe (`AuditEvent`)
2. Tabela `AuditEvent`:
   - Data, użytkownik, akcja, encja, szczegóły (skrócone), link do encji
3. Dla oceny — link „Pokaż snapshot" → modal lub podstrona z:
   - `inputSnapshot` (formatowany)
   - `resultSnapshot`
   - `ruleMatches` z nazwami reguł
4. Paginacja: `take: 50`, `?page=`

### Kryteria akceptacji

- [ ] Auditor odtwarza historyczną decyzję (UC-10)
- [ ] Widać manual override w centralnym audycie
- [ ] NFR-5: historia stronicowana

---

## ZADANIE P2-2: Eksport danych audytowych

### Kroki

1. Server action `exportAuditCsv`:
   - Tylko AUDITOR, ADMIN
   - Generuj CSV z ocenami lub AuditEvent
2. Przycisk „Eksportuj CSV" na `/audit`

### Kryteria akceptacji

- [ ] Plik CSV się pobiera
- [ ] Zawiera: data, wniosek, decyzja, requester, reason

---

## ZADANIE P2-3: Pulpit operacyjny (FR-18)

### Plik: `web/src/app/page.tsx`

### Brakujące metryki

| Metryka | Zapytanie Prisma |
|---------|------------------|
| Auto-approved | `count({ status: 'AUTO_APPROVED' })` |
| Needs information | `count({ status: 'NEEDS_INFORMATION' })` |
| Rejected | `count({ status: 'REJECTED' })` |
| Średni czas do decyzji | `avg(updatedAt - createdAt)` dla statusów końcowych |
| Najczęstsze reguły | `groupBy` na `PolicyEvaluationRuleMatch.ruleId` |
| Najczęstsze brakujące pola | agregacja z `resultSnapshot.missingFields` (JSON) — uproszczenie MVP: zlicz w aplikacji |

### Kroki

1. Rozszerz grid do 2 rzędów kart (8 metryk).
2. Sekcja „Top reguły" — lista 5 reguł z największą liczbą dopasowań.
3. Filtry (opcjonalnie P2+): `?department=&category=&from=&to=` — query na zapytaniach count.

### Kryteria akceptacji

- [ ] Minimum 6 z 8 metryk FR-18 widocznych
- [ ] Reviewer i Policy Owner widzą pulpit (UC-11)

---

## ZADANIE P2-4: Lista wniosków — pozostałe kolumny i filtry

(Uzupełnienie P1-7)

- Kolumna: wymagani akceptujący (`requiredRoles` z ostatniej oceny)
- Filtry: pilność, dostawca (search), przeterminowane (opcjonalnie: `createdAt < X` i status IN_REVIEW)

---

## ZADANIE P2-5: Manual Override — rozszerzenie UI

### Kroki

1. W kartach historii override pokaż `originalDecision` (System Decision)
2. Override dostępny także dla `NEEDS_INFORMATION` gdy Reviewer chce eskalować (opcjonalnie)
3. Zapis `attachmentPath` — po implementacji załączników

---

## ZADANIE P2-6: Usuń mylący branding AI

### Pliki

- `web/src/app/requests/[id]/page.tsx`
- `web/src/app/audit/page.tsx`
- `web/src/app/layout.tsx` metadata

Zmień „Policy Checker AI" → „Policy Checker" / „Ocena polityk".

### Kryteria akceptacji

- [ ] Nigdzie w UI nie sugerujemy że AI podejmuje decyzję
