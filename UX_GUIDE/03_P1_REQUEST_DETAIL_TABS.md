# Zadanie 03 — P1: Szczegóły wniosku — sticky header + zakładki

## Prompt dla Antigravity (wklej całość)

```
Kontekst: PolicyChecker — strona szczegółów wniosku web/src/app/requests/[id]/page.tsx jest bardzo długa (scroll). Uprość nawigację bez zmiany danych z Prisma.

Zadanie P1 — sticky header i zakładki:

1. Utwórz client component web/src/app/requests/[id]/RequestDetailTabs.tsx:
   - Zakładki: "Przegląd" | "Decyzja" | "Załączniki" | "Komentarze" | "Historia"
   - Stan aktywnej zakładki w useState (bez URL na MVP)
   - Styl: segmented control — zaokrąglony pasek, aktywna zakładka białe tło + cień (jak iOS)

2. Refaktoryzuj page.tsx:
   - Góra (sticky): breadcrumb "Wnioski / {tytuł skrócony}", StatusBadge, przyciski akcji (Edytuj, Przekaż)
   - Pod sticky header — RequestDetailTabs z sekcjami:
     - Przegląd: dane wniosku (obecne grid sekcje)
     - Decyzja: panel Policy Checker, override, następne kroki, zastosowane reguły/polityki
     - Załączniki: lista + upload
     - Komentarze: lista + formularz
     - Historia: audit trail (tylko dla ról z uprawnieniami — zachowaj obecną logikę RBAC)

3. Panel Policy Checker (ciemny slate-900):
   - Zmień na jasną Card (białe tło) z StatusBadge i czytelną hierarchią
   - Zachowaj treść (reason, reguły, braki, role)

4. Banner NEEDS_INFORMATION zostaje nad zakładkami (zawsze widoczny gdy status = NEEDS_INFORMATION).

Kryteria akceptacji:
- Użytkownik nie musi scrollować 3 ekranów żeby zobaczyć decyzję — jedno kliknięcie zakładki
- RBAC i server actions bez zmian
- Mobile: zakładki przewijane poziomo (overflow-x-auto)
```

## Pliki

- `web/src/app/requests/[id]/RequestDetailTabs.tsx` (nowy, 'use client')
- `web/src/app/requests/[id]/page.tsx`
