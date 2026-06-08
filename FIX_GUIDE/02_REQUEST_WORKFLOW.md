# P1 — Workflow wniosków

Priorytet: **P1** — wymagania FR-3, §7 (maszyna stanów), UC-1, UC-4.

---

## ZADANIE P1-1: Status `SUBMITTED` w maszynie stanów

### Problem

Specyfikacja §7: `DRAFT → SUBMITTED → (AUTO_APPROVED | NEEDS_INFORMATION | IN_REVIEW | REJECTED)`.

Obecnie `createRequest` przy submit przeskakuje bezpośrednio do statusu końcowego, pomijając `SUBMITTED`.

### Pliki

- `web/src/app/requests/actions.ts`

### Kroki

1. Po walidacji pól, przed oceną silnika:
   - Utwórz wniosek ze statusem `SUBMITTED` (opcjonalnie: krótki krok pośredni)
2. **Lub** (prostsze, zalecane):
   - Utwórz wniosek ze statusem `SUBMITTED`
   - Uruchom silnik
   - Zaktualizuj status na wynikowy w tej samej transakcji
   - Zapisz w `AuditEvent` przejście `SUBMITTED → {finalStatus}`
3. W UI listy dodaj badge `SUBMITTED` (jeśli ktokolwiek zobaczy ten stan przejściowy).

### Kryteria akceptacji

- [ ] W logu audytu widać, że wniosek przeszedł przez `SUBMITTED`
- [ ] Finalny status zgodny z decyzją silnika

---

## ZADANIE P1-2: Edycja wniosku w statusie DRAFT

### Problem

Requester może zapisać szkic, ale **nie może go edytować** — brak strony/akcji update.

### Pliki do utworzenia/zmiany

- `web/src/app/requests/[id]/edit/page.tsx` (nowy)
- `web/src/app/requests/actions.ts` — dodaj `updateRequest(id, formData)`
- `web/src/app/requests/[id]/page.tsx` — przycisk „Edytuj" gdy `status === DRAFT` i `requesterId === user.id`

### Kroki

1. `updateRequest`:
   - Guard: tylko requester, tylko status `DRAFT`
   - Aktualizuj pola jak w `createRequest` (bez uruchamiania silnika)
   - `revalidatePath`, redirect do szczegółów
2. Formularz edycji — skopiuj z `new/page.tsx`, wypełnij `defaultValue` z bazy.
3. Dwa przyciski: „Zapisz szkic" i „Przekaż do oceny" (drugi wywołuje ocenę — patrz P1-3).

### Kryteria akceptacji

- [ ] Requester edytuje własny DRAFT
- [ ] Inne role nie mogą edytować cudzego DRAFT
- [ ] Po edycji dane w `inputData` są zsynchronizowane

---

## ZADANIE P1-3: Przekazanie szkicu do oceny (submit draft)

### Problem

Szkic nie przechodzi oceny — trzeba submitować z formularza edycji.

### Kroki

1. Dodaj `submitDraftRequest(requestId)` w `requests/actions.ts`:
   - Guard: requester, status `DRAFT`
   - Pobierz dane z `Request` + `inputData`
   - Uruchom `evaluateRequest` (jak w `createRequest`)
   - Ustaw status/decyzję, utwórz `PolicyEvaluation`, `RuleMatch`, `AuditEvent`
2. Podłącz do przycisku „Przekaż do oceny" na stronie edycji.

### Kryteria akceptacji

- [ ] DRAFT → ocena → właściwy status końcowy
- [ ] Historia oceny zapisana

---

## ZADANIE P1-4: Uzupełnienie braków (UC-4) — NEEDS_INFORMATION → resubmit

### Problem

Gdy decyzja to `MISSING_INFORMATION` / status `NEEDS_INFORMATION`, requester nie może uzupełnić danych i ponownie złożyć.

### Kroki

1. Na stronie szczegółów wniosku (`[id]/page.tsx`):
   - Gdy `status === NEEDS_INFORMATION` i user = requester → pokaż banner z `missingFields` z ostatniej oceny
   - Przycisk „Uzupełnij i prześlij ponownie" → `/requests/[id]/edit`
2. `updateRequest` / nowa akcja `resubmitRequest`:
   - Dozwolone dla statusu `NEEDS_INFORMATION`
   - Po zapisie uruchom **ponowną ocenę**
   - Utwórz **nowy** rekord `PolicyEvaluation` (nie nadpisuj starego — NFR-7)
   - Status: `SUBMITTED` → wynik oceny
3. Na szczegółach pokaż **historię ocen** (wszystkie `evaluations`, nie `take: 1`).

### Kryteria akceptacji

- [ ] Requester uzupełnia pola i ponownie składa wniosek
- [ ] Stara ocena pozostaje w historii
- [ ] Nowa ocena ma własny snapshot

---

## ZADANIE P1-5: Brakujące pola formularza (FR-1)

### Pola do dodania

| Pole | Typ | Uwagi |
|------|-----|-------|
| `businessOwnerId` | select użytkowników | Zamiast auto-pierwszego POLICY_OWNER |
| `budgetOwnerId` | select (opcjonalny) | Warunkowo przy koszcie > próg |
| Transfer poza EOG | boolean | FR-2 |
| Kwestionariusz bezpieczeństwa | boolean | FR-2 |

### Kroki

1. Rozszerz `schema.prisma` o pola w `Request` lub trzymaj w `inputData` (preferuj kolumny jeśli używane w regułach).
2. Dodaj pola do `new/page.tsx` i edycji.
3. Uwzględnij w `inputSnapshot` w `createRequest` / `evaluateRequest`.

### Kryteria akceptacji

- [ ] Business owner wybierany z listy użytkowników
- [ ] Pola dostępne dla silnika reguł

---

## ZADANIE P1-6: Dynamiczny formularz (FR-2)

### Kroki

1. W `new/page.tsx` i edycji użyj komponentu klienckiego `RequestForm.tsx` z `useState`:
   - Gdy `processesPersonalData === false` → ukryj: kategorie danych, hasDpa, transfer EOG, kwestionariusz
   - Gdy `true` → pokaż te pola
2. Walidacja: jeśli `processesPersonalData` i brak kategorii → błąd przed submitem.

### Kryteria akceptacji

- [ ] Pola RODO widoczne tylko gdy zaznaczono przetwarzanie danych
- [ ] Submit z walidacją warunkową

---

## ZADANIE P1-7: Lista wniosków (FR-6) — minimum MVP

### Kroki

1. W `requests/page.tsx`:
   - Paginacja: `?page=1&pageSize=20`, `prisma.request.findMany({ skip, take })`
   - Filtry query: `status`, `decision`, `category`, `department` (minimum 4)
   - Kolumny: dodaj `decision`, `evaluations[0].evaluatedAt` (ostatnia ocena)
2. Formularz filtrów nad tabelą (GET).

### Kryteria akceptacji

- [ ] Lista nie ładuje wszystkich rekordów bez limitu
- [ ] Filtr po statusie i decyzji działa
