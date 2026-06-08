# P1 — Silnik reguł i wyjaśnialność decyzji

Priorytet: **P1** — FR-4, FR-5, FR-14, FR-15, §6, §11, scenariusz §15.

Główny plik: `web/src/lib/engine.ts`

---

## ZADANIE P1-10: Efekt `APPROVE` — ignorowany

### Problem

Typ `APPROVE` jest w `EffectType` i `RuleBuilder`, ale pętla efektów w `engine.ts` go nie obsługuje.

### Kroki

1. W pętli efektów dodaj:

```typescript
} else if (effect.type === 'APPROVE') {
  if (DECISION_WEIGHT['APPROVED'] > DECISION_WEIGHT[decision]) {
    // APPROVE tylko gdy nic silniejszego nie ma — zazwyczaj nie zmienia jeśli już REQUIRES_REVIEW
    // Nie obniżaj decyzji — APPROVE nie powinno nadpisać REJECTED
  }
}
```

2. **Logika zalecana:** `APPROVE` nie zmienia decyzji jeśli już jest `REQUIRES_REVIEW` lub wyżej. Może jedynie potwierdzić `APPROVED` gdy brak innych efektów.

### Kryteria akceptacji

- [ ] Reguła z samym efektem `APPROVE` nie psuje agregacji
- [ ] Test jednostkowy dla tego przypadku

---

## ZADANIE P1-11: `severity` vs `effect` — spójność UI

### Problem

Silnik używa **tylko `effect`**. UI w `policies/[id]/page.tsx` i `RuleBuilder` nadal pokazuje `severity` z etykietą „BLOCKER = odrzuca od razu", co jest mylące.

### Kroki (wybierz jedną ścieżkę)

**Ścieżka A (zalecana):** Usuń `severity` z formularza reguł; zostaw tylko efekty w `RuleBuilder`.

**Ścieżka B:** W silniku dodaj fallback: jeśli `severity === BLOCKER` i brak efektu → traktuj jak `{ type: 'REJECT' }`.

### Kryteria akceptacji

- [ ] BLOCKER w UI = odrzucenie w silniku (przez efekt REJECT)
- [ ] Brak rozjazdu między etykietą a wynikiem

---

## ZADANIE P1-12: Normalizacja walut (scenariusz §15)

### Problem

Reguła „SaaS > 5000" porównuje `annualCost` bez przeliczenia EUR/USD/PLN/GBP.

### Kroki

1. Utwórz `web/src/lib/currency.ts`:

```typescript
const RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,  // MVP: stałe kursy z config/env
  PLN: 0.23,
  GBP: 1.17,
}

export function toEur(amount: number, currency: string): number {
  const rate = RATES_TO_EUR[currency] ?? 1
  return amount * rate
}
```

2. W `evaluateRequest` lub przed wywołaniem — dodaj do snapshotu:

```typescript
annualCostEur: toEur(annualCost, currency)
```

3. Zaktualizuj regułę seed i dokumentację: warunek na polu `annualCostEur` zamiast `annualCost`, **lub** przeliczaj wewnątrz `evaluateCondition` gdy `field === 'annualCost'`.

### Kryteria akceptacji

- [ ] Wniosek 8000 USD + SAAS → przekracza próg 5000 EUR po przeliczeniu
- [ ] Wniosek 4000 EUR + SAAS → nie przekracza

---

## ZADANIE P1-13: `REQUIRE_FIELD` — właściwe pola dokumentów

### Problem

Reguła DPA używa `field: 'hasDpa'`, spec wymaga `dpaDocument` (załącznik).

### Kroki

1. Po implementacji załączników (plik `07_ATTACHMENTS_TEST_CONSOLE.md`):
   - Zmień efekt seed na `{ type: 'REQUIRE_FIELD', field: 'dpaDocument' }`
2. W `evaluateRequest` / przed oceną:
   - Jeśli `REQUIRE_FIELD` i pole to `dpaDocument` → sprawdź czy istnieje `RequestAttachment` typu DPA
   - Jeśli brak → dodaj do `missingFields`
3. Do czasu załączników: mapuj `dpaDocument` → `hasDpa === false` jako fallback z komentarzem TODO.

### Kryteria akceptacji

- [ ] `missingFields` zawiera `dpaDocument` gdy brak załącznika DPA
- [ ] UI pokazuje czytelny komunikat „Dodaj dokument DPA"

---

## ZADANIE P1-14: Reguła 3 seed — REQUIRE_REVIEW zamiast REJECT

### Problem

Spec §11 Reguła 3: `vendorRisk = HIGH` → `REQUIRE_REVIEW` przez bezpieczeństwo.

Seed ma `effect: [{ type: 'REJECT' }]` dla HIGH/CRITICAL.

### Kroki

1. W `seed.ts` zmień efekt reguły „Dostawca wysokiego ryzyka":
   - HIGH → `{ type: 'REQUIRE_REVIEW', role: 'SECURITY' }`
   - CRITICAL → `{ type: 'REJECT' }` (opcjonalnie — spec mówi tylko HIGH)

2. Dopasuj enum `VendorRisk`: spec ma `UNKNOWN`, schemat ma `CRITICAL` — rozważ dodanie `UNKNOWN` do enum.

### Kryteria akceptacji

- [ ] vendorRisk HIGH → `REQUIRES_REVIEW`, nie `REJECTED`
- [ ] Zgodność ze scenariuszem demonstracyjnym

---

## ZADANIE P1-15: Wyświetlanie wyniku oceny (FR-5) na stronie wniosku

### Plik: `web/src/app/requests/[id]/page.tsx`

### Kroki

1. Pobierz `evaluations` bez `take: 1` — pokaż ostatnią na górze, resztę w „Historia ocen".
2. Dla ostatniej oceny załaduj `ruleMatches` z `include: { rule: true, policyVersion: { include: { policy: true } } }`.
3. Sekcje UI:
   - **Wynik** — decyzja + status
   - **Powody** — `resultSnapshot.reason`
   - **Reguły które zadziałały** — tabela: nazwa reguły, polityka, wersja, efekt
   - **Brakujące informacje** — `missingFields`
   - **Wymagani akceptujący** — `requiredRoles`
   - **Użyte polityki** — unikalne polityki z ruleMatches
   - **Następne kroki** — generuj z `missingFields` + `requiredRoles` (proste mapowanie tekstowe)
4. Usuń lub zmień branding „Policy Checker AI" → „Policy Checker" (NFR-1, NFR-3).

### Kryteria akceptacji

- [ ] Użytkownik biznesowy rozumie decyzję bez czytania JSON
- [ ] Widać nazwy reguł i wersje polityk
- [ ] Scenariusz §15 pokazuje brak DPA i wymaganych akceptujących

---

## ZADANIE P1-16: Słowniki — pilność i ryzyko (FR-20)

### Problem

- Spec: pilność `LOW | NORMAL | HIGH | EMERGENCY`
- Kod: `LOW | MEDIUM | HIGH | EMERGENCY`

### Kroki

1. W `schema.prisma` zmień `MEDIUM` → `NORMAL` w enum `Urgency` (migration + seed + formularze + reguły).
2. `VendorRisk`: dodaj `UNKNOWN`, rozważ usunięcie `CRITICAL` lub mapowanie na `HIGH`.

### Kryteria akceptacji

- [ ] Enumy zgodne z REQUIREMENTS §FR-20
- [ ] Seed i formularze zaktualizowane
