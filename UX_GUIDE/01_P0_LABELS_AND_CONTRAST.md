# Zadanie 01 — P0: Etykiety ludzkie + kontrast nagłówków

## Prompt dla Antigravity (wklej całość)

```
Kontekst: Projekt PolicyChecker w web/ (Next.js 15 + Tailwind). Pracujesz nad UI/UX — NIE zmieniaj logiki biznesowej.

Zadanie P0 — ludzkie etykiety i naprawa kontrastu:

1. Utwórz plik web/src/lib/labels.ts z mapowaniami:
   - requestStatusLabel: DRAFT, SUBMITTED, IN_REVIEW, AUTO_APPROVED, APPROVED, REJECTED, NEEDS_INFORMATION, APPROVED_WITH_EXCEPTION, CANCELLED → polskie etykiety (np. "W recenzji", "Zatwierdzono automatycznie")
   - decisionLabel: APPROVED, REJECTED, REQUIRES_REVIEW, MISSING_INFORMATION
   - roleLabel: REQUESTER, REVIEWER, POLICY_OWNER, POLICY_APPROVER, AUDITOR, ADMIN
   - missingFieldLabel: dpaDocument, hasDpa, emergencyJustification + fallback na oryginalny klucz
   - urgencyLabel, vendorRiskLabel (opcjonalnie)

2. Użyj tych funkcji w:
   - web/src/app/requests/page.tsx (kolumna Status, Ostatnia Decyzja)
   - web/src/app/requests/[id]/page.tsx (badge statusu, sekcje oceny)
   - web/src/app/page.tsx (pulpit — nagłówki sekcji)

3. Napraw kontrast nagłówków:
   - W page.tsx (dashboard) usuń text-white z h1 — użyj text-slate-900 lub text-foreground
   - Sprawdź requests/page.tsx, policies/page.tsx — nagłówki stron muszą być ciemne na jasnym tle (bg-slate-50 / white)
   - Ujednolić: tytuł strony = text-2xl lub text-3xl font-semibold text-slate-900, podtytuł = text-slate-500

4. W nav (layout.tsx) zamień wyświetlanie user.role z surowego enum na roleLabel().

Kryteria akceptacji:
- Nigdzie w UI użytkownik nie widzi surowych enumów typu IN_REVIEW, AUTO_APPROVED jako główny tekst (mogą zostać w audit JSON / tooltip "techniczny")
- Nagłówki stron są czytelne na jasnym tle
- Brak zmian w actions.ts / prisma / engine.ts
```

## Pliki do edycji

- `web/src/lib/labels.ts` (nowy)
- `web/src/app/page.tsx`
- `web/src/app/requests/page.tsx`
- `web/src/app/requests/[id]/page.tsx`
- `web/src/app/layout.tsx`
