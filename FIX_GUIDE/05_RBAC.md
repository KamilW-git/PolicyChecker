# P1 — RBAC i uprawnienia ról

Referencja: `prompt/RBAC.md`, REQUIREMENTS §5.

Middleware: tylko `/audit` jest chroniony globalnie. Reszta — server actions + strony.

---

## ZADANIE P1-30: Policy Owner / Approver — widoczność wniosków

### Problem

W `requests/page.tsx` i `[id]/page.tsx`:

```typescript
if (['REQUESTER', 'POLICY_OWNER', 'POLICY_APPROVER'].includes(user.role)) {
  whereClause.requesterId = user.id  // błędnie dla Owner/Approver
}
```

Policy Owner i Approver **nie powinni** być ograniczeni do własnych wniosków przy zarządzaniu politykami. Według RBAC.md nie muszą widzieć wszystkich wniosków — ale ograniczenie do „tylko własne" jest zbyt restrykcyjne jeśli mają przeglądać wpływ reguł.

### Kroki (zalecane)

1. Z listy `restricted` usuń `POLICY_OWNER` i `POLICY_APPROVER`:

```typescript
const isOwnRequestsOnly = ['REQUESTER'].includes(user.role) || mine === 'true'
```

2. Policy Owner / Approver:
   - Widzą listę wniosków **tylko do odczytu** (bez override)
   - Lub: w ogóle ukryj link „Wnioski" w nav dla tych ról — skup na `/policies`

3. Zaktualizuj `[id]/page.tsx` — ten sam guard.

### Kryteria akceptacji

- [ ] Requester widzi tylko swoje
- [ ] Policy Owner ma pełny dostęp do `/policies` bez fałszywego `notFound` na cudzych wnioskach (jeśli wchodzi na wniosek)
- [ ] Reviewer/Admin/Auditor widzą wszystkie

---

## ZADANIE P1-31: Kolejka recenzenta (UC-3)

### Problem

Reviewer widzi wszystkie wnioski `IN_REVIEW`, nie przypisane do roli.

### Kroki (MVP)

1. W `resultSnapshot` silnik już zapisuje `requiredRoles`.
2. Na liście wniosków dla Reviewera:
   - Filtr domyślny: `status=IN_REVIEW`
   - Opcjonalnie: filtruj gdzie `requiredRoles` zawiera rolę użytkownika (wymaga mapowania user → role biznesowa, np. pole `businessRole` na User lub hardcoded mapa email → PROCUREMENT)
3. **MVP minimum:** dodaj kolumnę „Wymagana rola" z `evaluation.resultSnapshot.requiredRoles`.

### Kryteria akceptacji

- [ ] Reviewer widzi które wnioski wymagają której roli
- [ ] Link „Kolejka oceny" na pulpicie filtruje `IN_REVIEW`

---

## ZADANIE P1-32: Guardy server actions

### Akcje bez pełnych guardów

| Akcja | Plik | Wymagany guard |
|-------|------|----------------|
| `createRequest` | requests/actions.ts | Zalogowany (OK); opcjonalnie blokada AUDITOR |
| `addComment` | requests/actions.ts | Uczestnik wniosku lub Reviewer/Admin |
| `overrideRequest` | [id]/actions.ts | REVIEWER, ADMIN (OK) |
| `addRuleAction` | policies/[id]/actions.ts | POLICY_OWNER, ADMIN + DRAFT (OK) |

### Kroki dla `addComment`

1. Pobierz request
2. Jeśli `isInternal` → tylko REVIEWER, ADMIN
3. Jeśli publiczny → requester wniosku, Reviewer, Admin, Auditor (read-only nie komentuje — opcjonalnie)

### Kryteria akceptacji

- [ ] Requester nie może dodać komentarza internal (nawet manipulując formularzem)
- [ ] Auditor nie może komentować (opcjonalnie)

---

## ZADANIE P1-33: Admin — zarządzanie użytkownikami (FR / RBAC)

### Zakres MVP (minimum)

1. Strona `/admin/users` — tylko ADMIN
2. Lista użytkowników, zmiana roli (select)
3. Middleware lub layout guard: `role === ADMIN`

### Pliki nowe

- `web/src/app/admin/users/page.tsx`
- `web/src/app/admin/users/actions.ts`

### Kryteria akceptacji

- [ ] Admin zmienia rolę użytkownika
- [ ] AuditEvent przy zmianie roli
- [ ] Nie-admin dostaje redirect

---

## ZADANIE P1-34: Auditor — tworzenie wniosków

### Problem

RBAC.md: Auditor nie może tworzyć wniosków. Kod pozwala.

### Kroki

1. W `requests/new/page.tsx` — redirect jeśli AUDITOR
2. W `createRequest` — throw jeśli AUDITOR
3. Ukryj „+ Nowy wniosek" w nav/listie dla AUDITOR

### Kryteria akceptacji

- [ ] Auditor ma wyłącznie odczyt

---

## ZADANIE P1-35: JWT — rola ze bazy, nie z tokena

### Problem

Rola w JWT może być nieaktualna po zmianie przez Admina.

### Kroki

1. W `getCurrentUser()` zawsze bierz `user.role` z bazy (już tak jest — OK)
2. W middleware dla `/audit` — rozważ ponowne sprawdzenie roli z bazy lub krótszy TTL sesji
3. Po zmianie roli przez admina — unieważnij sesję użytkownika (opcjonalnie P2)

### Kryteria akceptacji

- [ ] `getCurrentUser().role` jest źródłem prawdy w server actions
