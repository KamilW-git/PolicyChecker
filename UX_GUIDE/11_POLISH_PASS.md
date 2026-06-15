# Zadanie 11 — Polish pass (po Apple pass)

## Kontekst

Zadania 01–09 zostały w większości zrealizowane. Ten pass **nie przepisuje** logiki — domyka spójność wizualną i copy tam, gdzie nadal widać „stary” ciemny UI, `blue-600` zamiast akcentu, surowe enumy i angielskie etykiety.

**Cel:** jeden spójny chrom (jasne tło, `#0071E3`, `PageHeader` + `Card`) na **wszystkich** ekranach, w tym Audyt i Polityki.

## Kolejność realizacji

```
11A — labels.ts (rozszerzenie)          ← zacznij tutaj
11B — Chrome globalny (nav, login, akcent)
11C — Wnioski (filtry, modal override)
11D — Audyt
11E — Lista polityk
11F — Szczegóły polityki [id]
11G — Konsola testów /policies/test
11H — Sprzątanie + weryfikacja
```

Zadanie **11A** jest blokujące dla 11D–11G (wspólne etykiety statusów polityk i decyzji).

---

## 11A — Rozszerz `labels.ts`

### Prompt dla Antigravity

```
Kontekst: PolicyChecker — po UI pass nadal w wielu miejscach wyświetlane są surowe enumy (PUBLISHED, DRAFT, SAAS). Rozszerz warstwę prezentacji.

Zadanie — rozszerz web/src/lib/labels.ts (NIE zmieniaj enumów w Prisma/API):

Dodaj funkcje:
- policyStatusLabel(status) — PUBLISHED → Opublikowana, DRAFT → Robocza, ARCHIVED → Zarchiwizowana
- policyVersionStatusLabel(status) — DRAFT → Robocza, IN_REVIEW → W recenzji, PUBLISHED → Opublikowana, REJECTED → Odrzucona
- categoryLabel(category) — SAAS → SaaS, HARDWARE → Sprzęt, CONSULTING → Doradztwo, MARKETING_SERVICE → Marketing, SOFTWARE → Oprogramowanie
- departmentLabel(dept) — IT, HR, FINANCE → Finanse, PROCUREMENT → Zakupy
- auditActionLabel(action) — opcjonalnie: najczęstsze akcje (CREATE_REQUEST, SUBMIT_REQUEST, OVERRIDE…) po polsku; fallback: action
- effectTriggeredLabel(effect) — REQUIRE_FIELD → Wymagane pole, REQUIRE_APPROVAL → Wymagana akceptacja, REJECT → Odrzucenie, APPROVE → Zatwierdzenie; fallback: effect

Użyj tych funkcji w plikach z zadań 11D–11G zamiast surowych stringów.

Kryteria akceptacji:
- Brak nowych zależności
- Eksport z jednego pliku labels.ts
- TypeScript bez błędów
```

### Pliki

- `web/src/lib/labels.ts`

---

## 11B — Chrome globalny (nav, login, akcent)

### Prompt dla Antigravity

```
Kontekst: PolicyChecker — treść jest jasna (Apple-like), ale nav i login nadal wyglądają jak stary prototyp.

Zadanie 11B — spójny chrome:

1. web/src/app/layout.tsx
   - Zamień ciemny header `bg-slate-900` na jasny: `bg-[#F5F5F7]/80 backdrop-blur-md border-b border-slate-200/80`
   - Logo/tytuł: `text-[var(--color-foreground)]`, nie biały
   - Linki nav: `text-slate-600 hover:text-slate-900`, active: `text-[var(--color-accent)] font-medium`
   - Wyloguj: stonowany przycisk (border lub ghost), nie czerwony na ciemnym tle
   - `main`: użyj `bg-[#F5F5F7]` zamiast `bg-slate-50` (zgodnie z globals.css)
   - DesktopNav: dodaj link „Pulpit” → `/` (jak MobileNav)

2. web/src/app/login/page.tsx
   - Karta logowania: `Card` lub te same klasy co reszta (`rounded-2xl border border-slate-200/80 bg-white shadow-sm`)
   - Przycisk logowania: `bg-[var(--color-accent)]` zamiast `blue-600`
   - Tło strony: `bg-[#F5F5F7]`, bez ciężkiego `shadow-xl`

3. Globalny primary color — przeszukaj web/src i zamień interaktywne `bg-blue-600` / `text-blue-600` / `border-blue-600` / `focus:ring-blue-500` na `var(--color-accent)` tam, gdzie to przycisk/link akcji primary (NIE zmieniaj semantycznych kolorów: red/emerald/amber dla ostrzeżeń).

4. Usuń artefakt: web/src/components/ui/implementation_plan.md

Kryteria akceptacji:
- Nav i login wizualnie pasują do dashboardu
- Jeden niebieski akcent (#0071E3) na primary actions
- Brak pliku implementation_plan.md
```

### Pliki

- `web/src/app/layout.tsx`
- `web/src/components/DesktopNav.tsx`
- `web/src/components/MobileNav.tsx`
- `web/src/app/login/page.tsx`
- `web/src/app/globals.css` (tylko jeśli brakuje `--color-accent` w focus ring)

---

## 11C — Wnioski: filtry + modal override

### Prompt dla Antigravity

```
Kontekst: Lista wniosków i modal decyzji ręcznej odstają od reszty UI.

Zadanie 11C:

1. web/src/app/requests/page.tsx
   - Nagłówek: już PageHeader — OK
   - Nad tabelą dodaj segmented control (jak RequestDetailTabs):
     presety: Wszystkie | W recenzji | Braki | Szkice
     → linki z query `?status=` (dla recenzenta domyślnie IN_REVIEW zostaje w logice serwera)
   - Usuń lub skróć podpowiedź „Domyślnie: wnioski w recenzji (IN_REVIEW)” → „Domyślnie pokazujemy wnioski w recenzji”
   - Filtr „Decyzja silnika”: opcje przez decisionLabel() z labels.ts (nie APPROVED/REQUIRES_REVIEW)
   - Zaawansowane filtry (pilność, kategoria, dział, vendor, overdue): zostaw w Card, ale zwijane `<details>` „Więcej filtrów” domyślnie zamknięte na mobile

2. web/src/app/requests/[id]/ManualOverrideModal.tsx
   - Przerób na JASNY modal (białe tło, border slate-200, jak Card) — NIE bg-slate-900
   - Zamknij: ikona X z lucide-react zamiast ✕
   - Opcje select: decisionLabel() lub polskie etykiety (Zatwierdzono, Odrzucono…)
   - Usuń „(Manual Override)” z tekstu ostrzeżenia
   - Przyciski: primary `var(--color-accent)`, secondary ghost
   - Usuń `border-t border-slate-800` w stanie zamkniętym — użyj `border-t border-slate-100` lub brak

3. web/src/app/requests/[id]/page.tsx
   - Historia override: ov.overrideDecision → decisionLabel(ov.overrideDecision)
   - effectTriggered w regułach → effectTriggeredLabel()
   - Banner NEEDS_INFORMATION: usuń zagnieżdżony duplikat `bg-amber-50` (jeden kontener)
   - Kategoria/dział w przeglądzie: categoryLabel(), departmentLabel()

Kryteria akceptacji:
- Modal override wygląda jak reszta aplikacji (jasny)
- Filtry czytelne po polsku, segmented control działa
- Brak surowych enumów widocznych dla użytkownika na liście i w szczegółach (poza JSON/debug)
```

### Pliki

- `web/src/app/requests/page.tsx`
- `web/src/app/requests/[id]/ManualOverrideModal.tsx`
- `web/src/app/requests/[id]/page.tsx`
- `web/src/app/requests/[id]/CommentForm.tsx` (primary button → accent)

---

## 11D — Dziennik audytu (`/audit`)

### Prompt dla Antigravity

```
Kontekst: Strona audytu ma białe nagłówki na jasnym tle (text-white) i nie używa wspólnych komponentów.

Zadanie 11D — audit/page.tsx:

1. Zamień custom header na <PageHeader title="Dziennik audytu" description="Historia zdarzeń i automatycznych ocen." actions={przycisk CSV} />

2. Napraw kontrast:
   - Usuń text-white z h1
   - Przycisk „Eksportuj CSV”: bg-[var(--color-accent)], nie blue-600
   - Usuń martwy <form> z pustym server action (zostaw sam Link do /api/audit/export)

3. Zakładki (Zdarzenia / Oceny reguł):
   - Użyj tego samego wzorca co RequestDetailTabs: `inline-flex bg-slate-200/50 p-1 rounded-xl` z aktywną białą pigułką
   - Aktywny kolor akcentu zamiast border-blue-600

4. Tabela w <Card>:
   - Kolumna Akcja: auditActionLabel(ev.action) zamiast font-mono surowego stringa (fallback: action)
   - Kolumna Decyzja (tab evaluations): badge jak StatusBadge lub decisionLabel() + kolory semantyczne
   - Link „Szczegóły wniosku”: text-[var(--color-accent)]
   - Szczegóły JSON: max-w-sm truncate OK, ale rozważ czytelniejszy format (np. skrócony tekst bez całego JSON.stringify jeśli details ma pole message)

5. Empty state: ikona + tekst w stylu dashboardu („Brak wpisów w tym okresie”)

Kryteria akceptacji:
- Audyt wizualnie jak /requests i /
- Nagłówek czytelny na jasnym tle
- Decyzje po polsku
```

### Pliki

- `web/src/app/audit/page.tsx`
- `web/src/lib/labels.ts` (auditActionLabel)

---

## 11E — Lista polityk (`/policies`)

### Prompt dla Antigravity

```
Kontekst: Lista polityk ma PageHeader i Card, ale badge statusu i linki nadal pokazują enumy i blue-600.

Zadanie 11E — policies/page.tsx:

1. Badge statusu polityki: policyStatusLabel(policy.status) zamiast surowego PUBLISHED/DRAFT
   - Kolory: Opublikowana → emerald/10, Robocza → slate, spójne ze StatusBadge

2. Domena (policy.domain): jeśli to enum techniczny — dodaj domainLabel() w labels.ts lub wyświetl z humanizacją (PROCUREMENT → Zakupy)

3. Linki „Zarządzaj →” / „Przeglądaj →”: text-[var(--color-accent)] zamiast text-blue-600

4. Empty state: użyj Card z border-dashed i krótką podpowiedzią dla POLICY_OWNER („Utwórz pierwszą politykę” + link do /policies/new)

5. Przycisk „Testuj reguły”: secondary (white border) — już OK; sprawdź spójność z accent

Kryteria akceptacji:
- Żaden widoczny surowy status PUBLISHED/DRAFT na kafelkach
- Spójne kolory z resztą app
```

### Pliki

- `web/src/app/policies/page.tsx`
- `web/src/lib/labels.ts`

---

## 11F — Szczegóły polityki (`/policies/[id]`)

### Prompt dla Antigravity

```
Kontekst: Strona szczegółów polityki ma mieszankę jasnych kart i ciemnych paneli (tabela JSON, formularz nowej reguły, audit).

Zadanie 11F — policies/[id]/page.tsx:

1. Nagłówek strony:
   - Opcjonalnie PageHeader lub sticky breadcrumb jak w requests/[id]
   - Breadcrumb: „Polityki / {nazwa}”

2. Badge wersji: policyVersionStatusLabel(displayVersion.status) zamiast PUBLISHED/IN_REVIEW/DRAFT

3. Przyciski workflow — copy PL:
   - „Utwórz DRAFT” → „Utwórz wersję roboczą”
   - „Odrzuć (Zwróć do DRAFT)” → „Odrzuć i zwróć do wersji roboczej”
   - Primary actions: var(--color-accent) gdzie to główna akcja (nie semantic red/green)

4. Tabela reguł:
   - JSON warunku/efektu: zamień `pre bg-slate-900 text-slate-300` na jasny blok: `bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono rounded-lg p-2`
   - Kolumna Status reguły: Włączona/Wyłączona zamiast ENABLED/DISABLED jeśli tak jest w DB

5. Formularz „Nowa reguła” (sekcja newRule=true):
   - CAŁKOWICIE na jasny Card (jak RequestWizard), usuń `bg-slate-900` wrapper
   - Pola: białe tło, border-slate-300, focus ring accent
   - Przyciski: accent + secondary

6. Alert success/error: zamień ✕ na lucide X, kolory bez zmian

7. Sekcja historii audytu polityki (jeśli jest na dole): jasna tabela w Card, auditActionLabel

8. Linki edycji reguły: text-[var(--color-accent)]

Kryteria akceptacji:
- Brak ciemnych paneli bg-slate-900 na tej stronie (JSON może być monospace na jasnym tle)
- Statusy wersji po polsku
- Formularz nowej reguły spójny z resztą UI
```

### Pliki

- `web/src/app/policies/[id]/page.tsx`
- `web/src/components/RuleBuilder.tsx` (jeśli ma ciemne/czysto EN etykiety — wyrównaj do jasnego stylu)
- `web/src/app/policies/new/page.tsx` (PageHeader + accent na submit)

---

## 11G — Konsola testów (`/policies/test`)

### Prompt dla Antigravity

```
Kontekst: Konsola testów to jedyny ekran z dużym ciemnym panelem wyników i białym nagłówkiem h1.

Zadanie 11G:

1. web/src/app/policies/test/page.tsx
   - PageHeader: title="Konsola testowania reguł", description po polsku
   - Usuń text-white z h1
   - Breadcrumb jak w innych podstronach

2. web/src/app/policies/test/TestConsoleClient.tsx
   - Lewa kolumna: owiń w <Card className="p-6"> (już biała — dopasuj rounded-2xl)
   - Prawa kolumna WYNIK: zamień `bg-slate-900` na jasny Card:
     - Nagłówek sekcji z decisionLabel(result.decision) + badge semantyczny (jak StatusBadge)
     - Uzasadnienie: bg-slate-50 border rounded-xl, text-slate-700
     - Brakujące pola: missingFieldLabel(f), amber styling (jak na stronie wniosku)
     - Wymagane role: roleLabel(r), nie surowe enumy
     - Zastosowane reguły: białe karty z border, nie bg-slate-800
   - Przycisk „Uruchom silnik reguł”: var(--color-accent)
   - focus:ring → accent
   - Dropdown wersji: policyVersionStatusLabel w opisie opcji, nie „Status: PUBLISHED”
   - Nagłówki sekcji: usuń techniczne (REQUIRE_FIELD) z visible title lub daj w nawiasie po polsku
   - Loading: Loader2 z lucide-react zamiast samego animate-pulse tekstu

Kryteria akceptacji:
- Oba panele jasne, czytelne na #F5F5F7
- Decyzja i braki po polsku
- Wygląd spójny ze stroną szczegółów wniosku (zakładka Decyzja)
```

### Pliki

- `web/src/app/policies/test/page.tsx`
- `web/src/app/policies/test/TestConsoleClient.tsx`

---

## 11H — Sprzątanie i weryfikacja

### Prompt dla Antigravity

```
Po zadaniach 11A–11G:

1. Przeszukaj web/src pod kątem:
   - text-white na nagłówkach stron (poza przyciskami na kolorowym tle)
   - bg-slate-900 / bg-slate-950 w komponentach UI (dopuszczalne tylko w monospace JSON jeśli świadomie ciemny — preferuj jasny)
   - surowe enumy w JSX widoczne dla usera (grep: PUBLISHED|IN_REVIEW|REQUIRES_REVIEW w plikach .tsx poza testami)

2. Uruchom:
   docker compose exec app npm run build

3. Opcjonalnie odśwież screenshoty:
   cd web && npm run screenshots:docker

4. Sprawdź ręcznie jako admin@pc.com:
   /, /requests, /requests/[id], /audit, /policies, /policies/[id], /policies/test, /login

Kryteria akceptacji:
- build przechodzi
- Brak oczywistych regresji kontrastu
```

---

## Master prompt (cały polish pass w jednej sesji)

Użyj tylko jeśli chcesz jedną sesję. **Lepiej:** 11A → 11B → … → 11H po kolei.

```
Pracujesz nad PolicyChecker (web/, Next.js 15, Tailwind). UI pass 11 — polish po Apple pass.

CEL: Spójny jasny UI na WSZYSTKICH ekranach. NIE zmieniaj logiki biznesowej, Prisma, Server Actions, RBAC.

KOLEJNOŚĆ (szczegóły w UX_GUIDE/11_POLISH_PASS.md):
A. Rozszerz labels.ts (policyStatus, policyVersionStatus, category, department, auditAction, effectTriggered)
B. Jasny nav + login + jeden akcent #0071E3; usuń implementation_plan.md
C. Wnioski: segmented filtry, jasny ManualOverrideModal, copy PL
D. Audyt: PageHeader, Card, zakładki, decisionLabel
E. Lista polityk: polskie statusy, accent linki
F. Szczegóły polityki: jasne formularze i JSON, bez bg-slate-900
G. Konsola testów: jasny panel wyników, PL etykiety
H. build + grep regresji

ZASADY:
- Reużywaj PageHeader, Card, StatusBadge, wzorzec zakładek z RequestDetailTabs
- Język UI: polski
- Minimalny diff
- docker compose exec app npm run build na końcu
```

---

## Mapowanie problem → zadanie

| Problem | Zadanie |
|---------|---------|
| Ciemny nav vs jasna treść | 11B |
| Login blue-600 | 11B |
| Modal override ciemny | 11C |
| Filtry EN + ciężki formularz | 11C |
| Audit text-white, blue-600 | 11D |
| Polityki: status PUBLISHED na kafelku | 11E |
| Polityka [id]: ciemny JSON i formularz reguły | 11F |
| Test console: ciemny panel wyników | 11G |
| implementation_plan.md w repo | 11B |

## Szacowany czas

| Zadanie | Czas |
|---------|------|
| 11A | 20 min |
| 11B | 45 min |
| 11C | 60 min |
| 11D | 30 min |
| 11E | 20 min |
| 11F | 60 min |
| 11G | 45 min |
| 11H | 15 min |
| **Razem** | **~4–5 h** |
