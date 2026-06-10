# P2 — Bezpieczeństwo, NFR, testy automatyczne

Priorytet: **P2** — NFR-4, NFR-5, NFR-7, kryteria jakości.

---

## ZADANIE P2-20: Walidacja server-side (Zod)

### Kroki

1. `npm install zod`
2. Utwórz `web/src/lib/validations/request.ts`:

```typescript
import { z } from 'zod'

export const createRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  annualCost: z.number().nonnegative(),
  // ... pozostałe pola z enumami
})
```

3. Użyj w `createRequest`, `updateRequest`, `loginAction`
4. Zwracaj czytelne błędy użytkownikowi (nie tylko `throw`)

### Kryteria akceptacji

- [ ] Puste/nieprawidłowe dane odrzucane po stronie serwera
- [ ] NFR-4 walidacja inputów

---

## ZADANIE P2-21: JWT i sekrety

### Kroki

1. Usuń fallback `'fallback_secret_for_development'` w produkcji:

```typescript
const secret = process.env.JWT_SECRET
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required')
}
```

2. Dodaj `web/.env.example`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=change-me-in-production
```

3. W `docker-compose.yml` — użyj silnego JWT_SECRET (już może być — sprawdź)

### Kryteria akceptacji

- [ ] Produkcja nie startuje bez JWT_SECRET
- [ ] `.env.example` w repo

---

## ZADANIE P2-22: Rate limiting logowania

### MVP

1. Prosty in-memory limiter w `login/actions.ts`: max 5 prób / 15 min / IP
2. Lub: opóźnienie `bcrypt.compare` + komunikat „Zbyt wiele prób"

### Kryteria akceptacji

- [ ] Po 5 błędnych próbach — blokada tymczasowa

---

## ZADANIE P2-23: Testy jednostkowe silnika

### Kroki

1. `npm install -D vitest @vitejs/plugin-react`
2. W `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

3. Utwórz `web/src/lib/engine.test.ts`:

**Przypadki testowe (minimum):**

| Test | Oczekiwanie |
|------|-------------|
| Brak reguł | `APPROVED` |
| REQUIRE_REVIEW | `REQUIRES_REVIEW` + requiredRoles |
| REJECT | `REJECTED` |
| REQUIRE_FIELD | `MISSING_INFORMATION` + missingFields |
| Priorytet REJECT > MISSING > REVIEW | REJECT wygrywa |
| AND / OR warunki | poprawna ewaluacja |
| `greater_or_equal` 50000 | match |
| `in` / `not_in` | match / no match |
| Waluta (po P1-12) | przeliczenie EUR |

4. Uruchom `npm test` w CI (opcjonalnie GitHub Actions)

### Kryteria akceptacji

- [ ] ≥10 testów silnika przechodzi
- [ ] Regresja P0/P1 wykrywana przez testy

---

## ZADANIE P2-24: Testy integracyjne RBAC (opcjonalnie)

1. Playwright lub testy server actions z mockiem sesji
2. Scenariusze:
   - Requester nie edytuje cudzego wniosku
   - Approver publikuje wersję IN_REVIEW
   - Auditor nie tworzy wniosku

---

## ZADANIE P2-25: Migracje Prisma w repo

### Problem

Brak `prisma/migrations/` — tylko `db push`.

### Kroki

1. `npx prisma migrate dev --name init`
2. Commit folder `migrations/`
3. W docker-compose command: `prisma migrate deploy` zamiast push

### Kryteria akceptacji

- [ ] Świeże środowisko staje się z migracji + seed

---

## ZADANIE P2-26: NFR-7 — niemutowalność snapshotów

### Kroki

1. Nie dodawaj `update` na `PolicyEvaluation` — tylko insert
2. W kodzie — grep `policyEvaluation.update` → powinno być 0
3. Dokumentuj w komentarzu przy modelu

---

## Checklist NFR po wszystkich naprawach

| NFR | Jak zweryfikować |
|-----|------------------|
| NFR-1 Wyjaśnialność | Otwórz wniosek §15 — widać reguły, powody, kroki |
| NFR-2 Audytowalność | `/audit` + trail na wniosku + override |
| NFR-3 Determinizm | Ten sam input 2× = ten sam wynik (test) |
| NFR-4 Bezpieczeństwo | bcrypt, Zod, RBAC guards, brak fallback JWT |
| NFR-5 Wydajność | Paginacja list i audytu |
| NFR-6 Użyteczność | RuleBuilder, nie JSON jako jedyny interfejs |
| NFR-7 Integralność | Override nie kasuje decyzji systemowej; wiele ocen |
| NFR-8 Skalowalność | Enumy, efekty rozszerzalne bez zmiany core |
