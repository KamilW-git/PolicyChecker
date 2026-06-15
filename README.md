# PolicyChecker

> Platforma do oceny wniosków zakupowych względem wersjonowanych polityk organizacji.
> Deterministyczny silnik reguł zwraca decyzję z uzasadnieniem i zapisem w audycie.
> Next.js 15 + PostgreSQL + Docker Compose — uruchomienie: `docker compose up --build`

![Pulpit recenzenta](screenshots/02-dashboard-reviewer.png)

## Spis treści

1. [Opis aplikacji](#opis-aplikacji)
2. [Stack technologiczny](#stack-technologiczny)
3. [Architektura](#architektura)
4. [Struktura katalogów](#struktura-katalogów)
5. [Role i funkcje](#role-i-funkcje)
6. [Uruchomienie](#uruchomienie)
7. [Zmienne środowiskowe](#zmienne-środowiskowe)
8. [Trasy aplikacji](#trasy-aplikacji)
9. [Flow aplikacji](#flow-aplikacji)
10. [Silnik reguł](#silnik-reguł)
11. [Bezpieczeństwo](#bezpieczeństwo)
12. [Scenariusz demo](#scenariusz-demo)
13. [Testy](#testy)
14. [Seed](#seed)
15. [Galeria](#galeria)
16. [Checklista MVP](#checklista-mvp)
17. [Troubleshooting](#troubleshooting)
18. [Wdrożenie produkcyjne](#wdrożenie-produkcyjne)
19. [O projekcie](#o-projekcie)

---

## Opis aplikacji

**PolicyChecker** pomaga organizacjom oceniać wnioski zakupowe i wdrożenia dostawców według własnych, wersjonowanych polityk — zamiast trzymać zasady w PDF-ach i mailach.

Użytkownik składa wniosek, system uruchamia **silnik reguł** i zwraca decyzję: zatwierdź, odrzuć, poproś o brakujące dane albo przekaż do recenzenta. Widać **które reguły zadziałały** i dlaczego. Recenzent może w razie potrzeby podjąć **decyzję ręczną**; wszystko trafia do **dziennika audytu**.

Zasada produktowa: **AI nie podejmuje decyzji** — wynik wynika wyłącznie z reguł zdefiniowanych w systemie.

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Next.js Server Actions, middleware JWT |
| **ORM / DB** | Prisma 5, PostgreSQL 15 |
| **Konteneryzacja** | Docker Compose (Node 20) |
| **Testy** | Vitest (silnik reguł), Playwright (screenshots) |

---

## Architektura

```text
Przeglądarka
   │
   ▼
[ Next.js 15 App Router ]
   │  (RSC, Server Actions, Middleware JWT)
   │
   ├─► [ lib/engine.ts ] (silnik reguł — warunki i efekty JSON)
   │
   ▼
[ Prisma ORM ]
   │
   ▼
[ PostgreSQL 15 ] (Docker)
```

Załączniki są serwowane przez API `/api/attachments/[id]` z kontrolą dostępu RBAC (bez publicznych URL-i).

---

## Struktura katalogów

```text
PolicyChecker/
├── docker-compose.yml
├── README.md
├── screenshots/             # 32 zrzuty + screenshots/README.md
├── prompt/                  # REQUIREMENTS.md i dokumentacja MVP
├── UX_GUIDE/                # przewodniki UI/UX
└── web/
    ├── prisma/              # schema.prisma, seed.ts
    ├── src/app/             # trasy App Router
    ├── src/components/      # UI, nawigacja, RuleBuilder
    ├── src/lib/             # engine.ts, labels.ts, requestEvaluation.ts
    └── scripts/             # capture-screenshots.mjs (Playwright)
```

---

## Role i funkcje

System używa RBAC (6 ról). Hasło wszystkich kont testowych: **`test1234`**.

| Rola | Email | Główne funkcje |
|---|---|---|
| **Requester** | `requester@pc.com` | Własne wnioski, wizard 3 kroków, szkice, załączniki, komentarze |
| **Reviewer** | `reviewer@pc.com` | Kolejka `IN_REVIEW`, analiza decyzji, decyzja ręczna (override) |
| **Policy Owner** | `owner@pc.com` | Polityki i reguły w wersji `DRAFT`, konsola testów |
| **Policy Approver** | `approver@pc.com` | Zatwierdzanie lub odrzucanie wersji polityk `IN_REVIEW` |
| **Auditor** | `auditor@pc.com` | Dziennik audytu, eksport CSV (tylko odczyt) |
| **Admin** | `admin@pc.com` | Zarządzanie użytkownikami i rolami |

---

## Uruchomienie

**Wymagania:** Docker Desktop, wolny port **3000**. Nie trzeba instalować Node.js ani PostgreSQL lokalnie.

Polecenia uruchamiaj z katalogu głównego **`PolicyChecker/`** (nie z `web/`).

```bash
git clone https://github.com/KamilW-git/PolicyChecker.git
cd PolicyChecker
docker compose up --build
```

Pierwsze uruchomienie trwa **3–5 minut** (`npm install` w kontenerze). Czekaj na:

```
Seeding complete.
Ready on http://0.0.0.0:3000
```

**Aplikacja:** [http://localhost:3000](http://localhost:3000)

- Zatrzymanie: `Ctrl+C`, potem `docker compose down`
- Czysta baza: `docker compose down -v`

---

## Zmienne środowiskowe

Wzorzec: `web/.env.example`

| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | PostgreSQL (w Dockerze ustawiane w `docker-compose.yml`) |
| `JWT_SECRET` | Sekret sesji — wymagany na produkcji |
| `NODE_ENV` | `development` / `production` |

Nie commituj pliku `.env` z prawdziwymi sekretami.

---

## Trasy aplikacji

| URL | Opis | Auth |
|---|---|---|
| `/` | Pulpit operacyjny | Sesja |
| `/login` | Logowanie | Gość |
| `/requests` | Lista wniosków | Sesja |
| `/requests/new` | Nowy wniosek (wizard 3 kroków) | Requester+ |
| `/requests/[id]` | Szczegóły: Przegląd, Decyzja, Załączniki, Komentarze, Historia | RBAC |
| `/policies` | Lista polityk | Sesja |
| `/policies/[id]` | Reguły i wersjonowanie polityki | RBAC |
| `/policies/test` | Konsola testowania reguł | Owner, Admin |
| `/audit` | Dziennik audytu | Auditor, Admin |
| `/admin/users` | Zarządzanie rolami | Admin |
| `/api/audit/export` | Eksport audytu do CSV | Auditor, Admin |
| `/api/attachments/[id]` | Pobieranie załącznika | RBAC |

---

## Flow aplikacji

### Flow wniosku

1. **DRAFT** — wnioskodawca edytuje szkic.
2. **Submit** — wniosek przechodzi przez silnik reguł.
3. Silnik ustawia status m.in.:
   - `AUTO_APPROVED` — spełnia polityki,
   - `NEEDS_INFORMATION` — brakuje danych lub załączników,
   - `IN_REVIEW` — wymaga decyzji człowieka,
   - `REJECTED` — naruszenie reguły blokującej.
4. Po uzupełnieniu braków — ponowne złożenie (resubmit).
5. W `IN_REVIEW` recenzent może podjąć **decyzję ręczną** (override).

### Flow polityki

`DRAFT` (edycja reguł) → `IN_REVIEW` → `PUBLISHED`

Tylko opublikowane wersje (`PUBLISHED`) są używane przez silnik przy ocenie wniosków. Właściciel polityki może utworzyć nową wersję roboczą z opublikowanej.

---

## Silnik reguł

Logika w `web/src/lib/engine.ts`, wywoływana przez Server Actions przy złożeniu wniosku.

- **Reguły:** warunek JSON + efekty (`REJECT`, `REQUIRE_FIELD`, `REQUIRE_REVIEW`, `APPROVE`)
- **Priorytet decyzji:** `REJECTED` > `MISSING_INFORMATION` > `REQUIRES_REVIEW` > `APPROVED`
- **Waluty:** koszty są przeliczane do EUR (`annualCostEur`) przed porównaniem z progami
- **Zapis:** każda ocena to nowy rekord `PolicyEvaluation` (append-only) ze snapshotem wejścia i wyniku

---

## Bezpieczeństwo

| Obszar | Implementacja |
|---|---|
| **Sesja** | JWT w ciasteczku `httpOnly`, weryfikacja w middleware |
| **RBAC** | Kontrola w Server Actions i w UI |
| **Załączniki** | API z autoryzacją, bez publicznego dostępu do plików |
| **Hasła** | bcrypt w seedzie |
| **Audyt** | `AuditEvent` + niemutowalne `PolicyEvaluation` |

---

## Scenariusz demo

Ok. **10 minut** — po `docker compose up --build` i seedzie:

1. Zaloguj się jako `reviewer@pc.com` / `test1234`.
2. Na pulpicie sprawdź sekcję **„Wymaga uwagi”**.
3. Wejdź w **Wnioski** → wybierz wniosek `[Sample]` w statusie `IN_REVIEW`.
4. Zakładka **Decyzja** — zobacz reguły, uzasadnienie i zastosowane polityki.
5. Wyloguj → `requester@pc.com` → **Nowy wniosek** (wizard).
6. `owner@pc.com` → **Polityki** → reguły lub **Konsola testów**.
7. `auditor@pc.com` → **Audyt** → eksport CSV.
8. `admin@pc.com` → **Użytkownicy** → zmiana ról.

---

## Testy

```bash
# Testy jednostkowe silnika reguł (Vitest)
docker compose exec app npm test

# Regeneracja screenshotów (Playwright, app musi działać)
cd web && npm run screenshots:docker
```

---

## Seed

Po pierwszym uruchomieniu baza zawiera:

- **3 polityki** (zakupy, bezpieczeństwo danych, ryzyko dostawców)
- **5 przykładowych wniosków** z prefiksem `[Sample]` (szkic, auto-approved, w recenzji, braki, odrzucony)

---

## Galeria

Pełny opis 32 zrzutów: [screenshots/README.md](screenshots/README.md)

### Pulpit i logowanie

| Logowanie | Pulpit (Recenzent) | Pulpit (Wnioskodawca) | Pulpit (Admin) |
|:---:|:---:|:---:|:---:|
| ![Login](screenshots/01-login.png) | ![Rev](screenshots/02-dashboard-reviewer.png) | ![Req](screenshots/11-dashboard-requester.png) | ![Admin](screenshots/12-dashboard-admin.png) |

### Workflow wniosków

| Lista wniosków | Szczegóły | Panel decyzji | Wizard |
|:---:|:---:|:---:|:---:|
| ![Lista](screenshots/03-requests-list-reviewer.png) | ![Szczegóły](screenshots/04-request-detail.png) | ![Decyzja](screenshots/16-request-in-review-policy-panel.png) | ![Wizard](screenshots/05-request-new-form.png) |

### Decyzje

| Auto-approved | W recenzji | Braki | Odrzucony | Override |
|:---:|:---:|:---:|:---:|:---:|
| ![Auto](screenshots/22-request-auto-approved.png) | ![Review](screenshots/16-request-in-review-policy-panel.png) | ![Braki](screenshots/18-request-needs-information-banner.png) | ![Rejected](screenshots/23-request-rejected.png) | ![Override](screenshots/17-request-manual-override-modal.png) |

### Polityki i audyt

| Polityki | Rule builder | Konsola testów | Audyt |
|:---:|:---:|:---:|:---:|
| ![Polityki](screenshots/06-policies-list.png) | ![Reguła](screenshots/27-policy-add-rule-form.png) | ![Test](screenshots/08-policy-test-console.png) | ![Audyt](screenshots/09-audit-trail.png) |

---

## Checklista MVP

Zgodność z zakresem MVP z `prompt/REQUIREMENTS.md` (sekcja 4.1):

| # | Wymaganie | Status | Gdzie w aplikacji |
|---|-----------|--------|-------------------|
| 1 | Formularz wniosku zakupowego | ✅ | `/requests/new` — wizard 3 kroków |
| 2 | Lista wniosków | ✅ | `/requests` — filtry, segmented control |
| 3 | Widok szczegółów wniosku | ✅ | `/requests/[id]` — zakładki |
| 4 | Silnik oceny reguł | ✅ | `web/src/lib/engine.ts` |
| 5 | Wynik decyzji z uzasadnieniem | ✅ | Zakładka **Decyzja** — reguły, powód, next steps |
| 6 | Prosty kreator reguł | ✅ | `RuleBuilder` na stronie polityki |
| 7 | Wersjonowanie polityk | ✅ | `DRAFT` → `IN_REVIEW` → `PUBLISHED` |
| 8 | Historia ocen i decyzji | ✅ | Oceny na wniosku + `/audit` |
| 9 | Ręczna ocena / manual override | ✅ | Modal **Decyzja ręczna** (Reviewer) |
| 10 | Pulpit operacyjny | ✅ | `/` — metryki, „Wymaga uwagi” |
| 11 | Komentarze do wniosków | ✅ | Zakładka **Komentarze** |
| 12 | Załączniki przy wnioskach | ✅ | Zakładka **Załączniki** + API RBAC |
| 13 | Konsola testowania reguł | ✅ | `/policies/test` |

### Poza zakresem MVP (świadomie nieimplementowane)

- SSO / SCIM, integracje ERP / Jira / Slack
- Pełny DMN / BPMN
- AI jako źródło decyzji (decyzje wyłącznie z silnika reguł)
- Multi-tenant, import polityk z PDF

### Ulepszenia poza checklistą (opcjonalne)

- Pełny podgląd w UI „polityka w wersji X w momencie oceny” (snapshot jest w bazie)
- Wizualna spójność RuleBuildera z resztą jasnego UI
- Przełącznik języka PL/EN (i18n, np. `next-intl` + pliki tłumaczeń)
- Przełącznik motywu jasny/ciemny (design tokens + `localStorage`)

---

## Troubleshooting

| Problem | Rozwiązanie |
|---|---|
| Prompt do instalacji `prisma@7.x` | Uruchom z root po `git pull`; entrypoint robi `npm install` przed Prismą 5.x |
| Strona się nie ładuje | Sprawdź `docker compose logs app`, poczekaj na `Ready on http://0.0.0.0:3000` |
| `Can't reach database server at db:5432` | `docker compose down`, potem `docker compose up` |
| Port 3000 zajęty | Zmień mapowanie w `docker-compose.yml` (np. `"3001:3000"`) |
| `docker compose` z katalogu `web/` | Uruchamiaj z root `PolicyChecker/` |
| Dostęp z innego urządzenia w LAN | `http://<IP-komputera>:3000`, nie `localhost` |

---

## Wdrożenie produkcyjne

- `NODE_ENV=production`
- Silny, unikalny `JWT_SECRET`
- PostgreSQL niedostępny publicznie z internetu
- Regularne kopie zapasowe bazy i załączników
- HTTPS przez reverse proxy (nginx, Caddy itd.)

---

## O projekcie

Projekt rekrutacyjny / portfolio — MVP platformy do oceny wniosków według polityk organizacji. Rozwój z wykorzystaniem narzędzi AI (zgodnie z wytycznymi zadania), przy zachowaniu deterministycznego silnika reguł i testów Vitest dla logiki decyzyjnej.
