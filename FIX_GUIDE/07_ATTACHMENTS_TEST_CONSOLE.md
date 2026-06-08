# P2 — Załączniki i konsola testowania reguł

Priorytet: **P2** — FR-9, FR-19, UC-7.

---

## ZADANIE P2-10: Załączniki do wniosków (FR-9)

### Model istnieje: `RequestAttachment`

Pola: `filename`, `path`, `mimeType`, `uploadedAt` — brak `type` (DPA, umowa, …).

### Kroki

1. **Schema** — dodaj opcjonalnie:

```prisma
enum AttachmentType {
  DPA
  CONTRACT
  OFFER
  APPROVAL_MAIL
  SECURITY_QUESTIONNAIRE
  VENDOR_ASSESSMENT
  OTHER
}

// w RequestAttachment:
type AttachmentType @default(OTHER)
```

2. **Storage MVP** — lokalny katalog `web/uploads/` (gitignore) lub `public/uploads/` z losową nazwą pliku.
   - W produkcji: S3 — poza MVP.
3. **Server action** `uploadAttachment(requestId, formData)`:
   - Guard: requester wniosku lub Reviewer/Admin
   - Walidacja: max 10MB, dozwolone MIME: pdf, doc, docx, png, jpg
   - Zapis pliku + rekord `RequestAttachment`
   - `AuditEvent`
4. **Server action** `downloadAttachment(id)` — stream pliku z kontrolą RBAC
5. **UI** na `[id]/page.tsx`:
   - Lista załączników z linkiem pobierania
   - Formularz upload (typ + plik)
6. **Integracja z silnikiem** (P1-13):
   - Przed oceną: jeśli `REQUIRE_FIELD dpaDocument` → sprawdź `attachments.some(a => a.type === 'DPA')`

### Kryteria akceptacji

- [ ] Requester dodaje załącznik DPA
- [ ] Ponowna ocena po dodaniu DPA zmienia `missingFields`
- [ ] Inni użytkownicy nie pobierają załączników bez uprawnień
- [ ] UC-1 krok 4 (opcjonalne załączniki) działa

---

## ZADANIE P2-11: Załącznik w Manual Override

### Pliki

- `web/src/app/requests/[id]/actions.ts`
- `ManualOverrideModal.tsx`

### Kroki

1. W `overrideRequest` odczytaj plik z FormData
2. Zapisz do `uploads/overrides/` i ustaw `attachmentPath`
3. Pokaż link w historii override

---

## ZADANIE P2-12: Konsola testowania reguł (FR-19)

### Nowe pliki

- `web/src/app/policies/test/page.tsx`
- `web/src/app/policies/test/actions.ts`
- opcjonalnie: `web/src/components/PolicyTestForm.tsx`

### Dostęp

- POLICY_OWNER, ADMIN
- Link w nav lub na `/policies/[id]` — „Testuj reguły"

### Kroki

1. Formularz z polami jak wniosku (skrócona wersja `new/page.tsx`) — dane testowe JSON lub pola formularza.
2. Select: testuj **całą opublikowaną politykę** / **wersję DRAFT** / **pojedynczą regułę**.
3. Server action `testRules(input, policyVersionId?)`:
   - **Nie zapisuj** Request ani PolicyEvaluation
   - Wywołaj `evaluateRequest(input, rules)`
   - Zwróć wynik do wyświetlenia
4. UI wyniku — jak sekcja oceny na wniosku (decyzja, reguły, missingFields).

### Kryteria akceptacji

- [ ] Owner testuje zmiany przed publikacją bez tworzenia wniosku
- [ ] UC-7 spełniony
- [ ] Tryb zaawansowany (historyczne wnioski) — poza MVP, nie implementuj

---

## ZADANIE P2-13: Ponowna ocena po publikacji nowej polityki

### Opcjonalne P2+

- Przycisk Admin: „Re-evaluate" na wniosku w statusie niekońcowym
- Tworzy nową `PolicyEvaluation` z aktualnymi regułami PUBLISHED
