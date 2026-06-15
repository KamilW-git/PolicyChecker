# PolicyChecker — UI/UX pass (Antigravity)

## Cel

Doprowadzić interfejs do spójnego, spokojnego stylu (inspiracja: Apple HIG) — bez przepisywania logiki biznesowej. Tylko UI, copy, layout, komponenty współdzielone.

## Zasady dla agenta

1. **Minimalny diff** — jeden plik zadania = jeden temat. Nie refaktoryzuj całego projektu naraz.
2. **Nie zmieniaj** logiki Server Actions, Prisma, silnika reguł, RBAC.
3. **Język UI:** polski (bez mieszanki PL/EN w etykietach widocznych dla użytkownika).
4. **Stack:** Next.js 15 App Router, Tailwind 4, istniejące konwencje w `web/src/`.
5. **Po każdym zadaniu:** `docker compose exec app npm run build` (lub przynajmniej brak błędów TypeScript w edytowanych plikach).
6. **Nie dodawaj** nowych bibliotek ikon bez potrzeby — preferuj `lucide-react` (jedna paczka) albo inline SVG; jeśli dodajesz, uzasadnij w komentarzu commita.

## Kolejność realizacji

### Pass 1 (Apple pass — zrealizowany w większości)

```
01_P0_LABELS_AND_CONTRAST     ← zacznij tutaj
02_P0_DESIGN_TOKENS
03_P1_REQUEST_DETAIL_TABS
04_P1_DASHBOARD_SIMPLIFY
05_P1_POLISH_COPY
06_P2_MOBILE_NAV
07_P2_REQUEST_WIZARD
08_P2_ICONS_REPLACE_EMOJI
09_P3_TOASTS_AND_LOADING
```

Zadania 01–02 są **blokujące** dla reszty (wspólne komponenty i etykiety).

### Pass 2 (polish — po review)

```
11_POLISH_PASS.md
  11A labels (rozszerzenie)
  11B chrome globalny (nav, login)
  11C wnioski (filtry, modal)
  11D audyt
  11E lista polityk
  11F szczegóły polityki
  11G konsola testów
  11H weryfikacja
```

Zacznij od **11A**, potem **11B** (nav blokuje wrażenie spójności).

## Pliki kluczowe

| Obszar | Pliki |
|--------|--------|
| Layout / nav | `web/src/app/layout.tsx` |
| Style globalne | `web/src/app/globals.css` |
| Dashboard | `web/src/app/page.tsx` |
| Lista wniosków | `web/src/app/requests/page.tsx` |
| Szczegóły wniosku | `web/src/app/requests/[id]/page.tsx` |
| Formularz | `web/src/app/requests/RequestForm.tsx` |
| Login | `web/src/app/login/page.tsx` |
| Polityki | `web/src/app/policies/page.tsx`, `policies/[id]/page.tsx`, `policies/test/` |
| Audyt | `web/src/app/audit/page.tsx` |
| Polish pass | `UX_GUIDE/11_POLISH_PASS.md` |

## Weryfikacja wizualna

Po zadaniach 01–05 uruchom:

```cmd
cd web
npm run screenshots:docker
```

Porównaj z `screenshots/` — layout powinien być spójniejszy, bez białych nagłówków na jasnym tle.
