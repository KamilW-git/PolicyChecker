# Zadanie 07 — P2: Formularz wniosku — kroki (wizard)

## Prompt dla Antigravity (wklej całość)

```
Kontekst: RequestForm.tsx jest długi i przytłaczający. Rozbij na wizard 3 kroków bez zmiany pól wysyłanych do Server Action (te same name= w formularzu).

Zadanie P2 — wizard:

1. Utwórz web/src/app/requests/RequestWizard.tsx ('use client'):
   - Krok 1 "Zakup": title, description, type, category, department, urgency, vendor, koszt, waluta, vendorRisk
   - Krok 2 "Zgodność": businessOwner, budgetOwner, RODO (processesPersonalData, hasDpa, transferOutsideEEA, securityQuestionnaire, dataCategories)
   - Krok 3 "Podsumowanie": read-only podgląd pól + przyciski "Zapisz jako szkic" / "Przekaż do oceny" (lub resubmit dla NEEDS_INFORMATION)

2. Pasek postępu u góry: 3 kropki lub "Krok 1 z 3" — styl minimalistyczny

3. Walidacja per krok (HTML required na polach bieżącego kroku) — nie pozwól iść dalej bez wymaganych

4. RequestForm.tsx — albo zastąp wizardem w new/page.tsx i edit/page.tsx, albo RequestForm wywołuje RequestWizard wewnętrznie

5. Zachowaj action z props — ten sam FormData do createRequest/updateRequest/resubmitRequest

Kryteria akceptacji:
- Nowy wniosek i edycja DRAFT działają jak wcześniej
- Jedna główna akcja primary na kroku 3
- Mobile-friendly (pełna szerokość, duże touch targets min 44px)
```

## Pliki

- `web/src/app/requests/RequestWizard.tsx` (nowy)
- `web/src/app/requests/RequestForm.tsx` lub `new/page.tsx`, `edit/page.tsx`
