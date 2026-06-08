# P1 — Polityki, wersjonowanie, RuleBuilder

Priorytet: **P1** — FR-10–FR-13, UC-5–UC-8.

---

## ZADANIE P1-20: RuleBuilder — brakujące operatory i efekty

### Plik: `web/src/components/RuleBuilder.tsx`

### Brakuje w UI

**Operatory:** `not_contains`, `in`, `not_in`  
**Efekty:** `ADD_RISK_POINTS`, `ADD_REASON_CODE`

### Kroki

1. Dodaj operatory do tablicy `OPERATORS`.
2. Dla `in` / `not_in` — pole wartości jako textarea „wartości po przecinku" → parsuj do tablicy.
3. Dodaj efekty:
   - `ADD_RISK_POINTS` → pole numeryczne `points`
   - `ADD_REASON_CODE` → pole tekstowe `code`
4. Opcjonalnie: przełącznik AND/OR dla wielu warunków (obecnie tylko AND).

### Kryteria akceptacji

- [ ] Wszystkie efekty z FR-15 dostępne w kreatorze
- [ ] Zapisane reguły działają w silniku

---

## ZADANIE P1-21: Metadane wersji polityki w UI

### Problem

`validFrom`, `validTo`, `description` wersji — ustawiane w kodzie przy publish/archive, niewidoczne w UI.

### Pliki

- `web/src/app/policies/[id]/page.tsx`

### Kroki

1. W nagłówku wersji pokaż:
   - `validFrom` / `validTo` jeśli ustawione
   - `description` wersji (opis zmian)
2. Przy `createDraftVersion` — formularz lub prompt na opis zmian przed utworzeniem (opcjonalnie: query param).

### Kryteria akceptacji

- [ ] Policy Approver widzi daty obowiązywania opublikowanej wersji
- [ ] FR-11 częściowo spełnione w UI

---

## ZADANIE P1-22: `appliedPolicyVersions` — pełne metadane

### Problem

Ocena zapisuje tylko tablicę ID wersji, nie nazwę polityki ani numer wersji.

### Pliki

- `web/src/app/requests/actions.ts`
- `submitDraftRequest` / `resubmitRequest` (gdy powstaną)

### Kroki

1. Zamiast samych ID zapisuj w `appliedPolicyVersions`:

```json
[
  { "policyVersionId": "...", "policyId": "...", "policyName": "...", "version": 1 }
]
```

2. Buduj z `evaluationResult.appliedRules` + include policyVersion.policy przy fetchu reguł.

### Kryteria akceptacji

- [ ] Snapshot oceny zawiera czytelne nazwy polityk i numery wersji
- [ ] Historyczne oceny nie wymagają joinów do usuniętych polityk

---

## ZADANIE P1-23: Publikacja — polityka bez reguł

### Kroki

1. W `submitForReview` i `approveAndPublish`:
   - Sprawdź `rules.count > 0` na wersji
   - Jeśli 0 → `throw new Error('Wersja musi zawierać co najmniej jedną regułę')`

### Kryteria akceptacji

- [ ] Nie można opublikować pustej wersji

---

## ZADANIE P1-24: Wiele polityk domenowych (scenariusz §15)

### Problem

Scenariusz §15 wymaga 4 polityk (zakupy, ryzyko dostawcy, RODO, duplikacja SaaS). Seed ma jedną.

### Kroki

1. W `seed.ts` dodaj (opublikowane):
   - Polityka przetwarzania danych osobowych (`DATA_SECURITY`) — reguła DPA
   - Polityka ryzyka dostawcy (`VENDOR_RISK`) — reguła vendor risk
   - (Opcjonalnie) Polityka duplikacji SaaS — reguła `contains` na vendorName
2. Upewnij się, że silnik ładuje reguły ze **wszystkich** opublikowanych wersji (już tak robi).

### Kryteria akceptacji

- [ ] Ocena wniosku §15 uruchamia reguły z wielu polityk
- [ ] W UI widać wszystkie użyte polityki

---

## ZADANIE P1-25: Walidacja JSON reguł (server-side)

### Pliki

- `web/src/app/policies/[id]/actions.ts`
- opcjonalnie: `web/src/lib/ruleValidation.ts`

### Kroki

1. Po `JSON.parse` waliduj strukturę:
   - `condition` ma `field`+`operator` lub `operator`+`conditions`
   - `effect` to tablica obiektów z `type` z dozwolonej listy
   - `field` w warunku z whitelisty (jak w RuleBuilder `FIELDS`)
2. Odrzuć nieznane operatory przed zapisem.

### Kryteria akceptacji

- [ ] Zapis reguły z `{ "field": "__proto__" }` lub dowolnym kodem nie powoduje nieoczekiwanego zachowania
- [ ] NFR-4 częściowo spełnione
