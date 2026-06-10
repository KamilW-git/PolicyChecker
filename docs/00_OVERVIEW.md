# PolicyChecker — Przewodnik naprawy dla Antigravity IDE (Gemini Pro 3.1 High)

## Cel dokumentacji

Ten zestaw plików opisuje **konkretne zadania naprawcze** dla projektu PolicyChecker (`web/`), na podstawie audytu względem `prompt/REQUIREMENTS.md` i `REVIEW_REPORT.md`.

**Dla agenta AI:** czytaj pliki w kolejności numeracji. Każde zadanie ma: kontekst, pliki, kroki, kryteria akceptacji. Nie przeskakuj P0 przed domknięciem poprzedniego pliku, chyba że zadanie jest niezależne.

## Stan projektu (skrót)

| Obszar | Pokrycie | Priorytet naprawy |
|--------|----------|-------------------|
| Silnik reguł | ~75% | P1 |
| Polityki + wersjonowanie | ~65% | P1 |
| Formularz + workflow wniosków | ~60% | P0–P1 |
| RBAC | ~50% | P1 |
| Manual Override | ~65% (bug typów) | **P0** |
| Załączniki | 0% | P2 |
| Konsola testowa reguł | 0% | P2 |
| Pulpit (metryki) | ~30% | P2 |
| Testy automatyczne | 0% | P2 |

## Struktura plików

| Plik | Zawartość |
|------|-----------|
| `01_P0_CRITICAL_BUGS.md` | Błędy blokujące runtime / dane |
| `02_REQUEST_WORKFLOW.md` | Workflow wniosków (DRAFT, SUBMITTED, resubmit) |
| `03_RULE_ENGINE.md` | Silnik reguł, efekty, waluty, wyjaśnialność |
| `04_POLICIES.md` | Polityki, domeny, RuleBuilder |
| `05_RBAC.md` | Role i uprawnienia |
| `06_UI_AUDIT_DASHBOARD.md` | UI szczegółów, audyt, pulpit |
| `07_ATTACHMENTS_TEST_CONSOLE.md` | Załączniki + konsola testowa |
| `08_NFR_SECURITY_TESTS.md` | Bezpieczeństwo, NFR, testy |

## Zasady pracy dla agenta

1. **Minimalny diff** — naprawiaj tylko to, co opisane w zadaniu. Nie refaktoryzuj całego projektu.
2. **Konwencje** — zachowaj Next.js 15 App Router, Server Actions, Prisma, Tailwind 4, język UI po polsku.
3. **Schemat Prisma** — po zmianach uruchom `npx prisma db push` (lub migrację, jeśli dodajesz migracje do repo).
4. **Seed** — hasło testowe: `test1234` (bcrypt w `web/prisma/seed.ts`).
5. **Role testowe** — `requester@pc.com`, `reviewer@pc.com`, `owner@pc.com`, `approver@pc.com`, `auditor@pc.com`, `admin@pc.com`.
6. **Nie zmieniaj** `prompt/REQUIREMENTS.md` ani `REVIEW_REPORT.md` — to dokumentacja referencyjna.

## Kolejność realizacji (rekomendowana)

```
01_P0_CRITICAL_BUGS
    ↓
02_REQUEST_WORKFLOW + 03_RULE_ENGINE (równolegle możliwe)
    ↓
04_POLICIES + 05_RBAC
    ↓
06_UI_AUDIT_DASHBOARD
    ↓
07_ATTACHMENTS_TEST_CONSOLE
    ↓
08_NFR_SECURITY_TESTS
```

## Kluczowe pliki projektu

```
web/
├── prisma/schema.prisma
├── prisma/seed.ts
├── src/lib/engine.ts
├── src/lib/session.ts
├── src/middleware.ts
├── src/components/RuleBuilder.tsx
├── src/app/requests/actions.ts
├── src/app/requests/new/page.tsx
├── src/app/requests/[id]/page.tsx
├── src/app/requests/[id]/actions.ts
├── src/app/requests/[id]/ManualOverrideModal.tsx
├── src/app/policies/actions.ts
├── src/app/policies/new/page.tsx
├── src/app/policies/[id]/actions.ts
├── src/app/policies/[id]/page.tsx
├── src/app/audit/page.tsx
└── src/app/page.tsx
```

## Definicja „done” dla całego przewodnika

MVP uznaj za domknięte, gdy:

- [ ] Wszystkie zadania P0 i P1 z plików 01–06 są zrobione
- [ ] Scenariusz §15 (SaaS 8000 EUR, dane osobowe, brak DPA) daje `MISSING_INFORMATION` z listą braków
- [ ] Policy Approver może opublikować politykę; Policy Owner może edytować reguły tylko na DRAFT
- [ ] Manual Override działa dla wszystkich opcji w modalu bez błędu Prisma
- [ ] Auditor widzi historię ocen ze snapshotami
- [ ] Co najmniej testy jednostkowe silnika (`engine.ts`) przechodzą
