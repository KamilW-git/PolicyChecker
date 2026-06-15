# PolicyChecker

> Platforma do oceny wniosków zakupowych i wdrożeń dostawców względem wersjonowanych polityk organizacji. Deterministyczny silnik reguł błyskawicznie zwraca decyzję: zatwierdza, odrzuca, wskazuje braki informacji lub wymaga ręcznej recenzji, pozostawiając w systemie czysty log audytu i uzasadnienie.

![Hero Image](screenshots/02-dashboard-reviewer.png)

## Spis Treści
- [Stack technologiczny](#stack-technologiczny)
- [Architektura](#architektura)
- [Struktura katalogów](#struktura-katalogów)
- [Role i funkcje](#role-i-funkcje)
- [Uruchomienie](#uruchomienie)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Trasy aplikacji](#trasy-aplikacji)
- [Flow aplikacji](#flow-aplikacji)
  - [Wnioski](#flow-wniosku)
  - [Polityki](#flow-polityki)
- [Silnik reguł](#silnik-reguł)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Scenariusz demo](#scenariusz-demo)
- [Testy](#testy)
- [Seed](#seed)
- [Galeria](#galeria)
- [Checklista MVP](#checklista-mvp)
- [Troubleshooting](#troubleshooting)
- [Wdrożenie produkcyjne](#wdrożenie-produkcyjne)
- [O projekcie](#o-projekcie)

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
   ├─► [ lib/engine.ts ] (Deterministyczny silnik reguł JSON)
   │
   ▼
[ Prisma ORM ]
   │
   ▼
[ PostgreSQL 15 ] (Docker)
```
*Dodatkowo: bezpieczna obsługa pobierania załączników przez dedykowaną ścieżkę API (`/api/attachments/[id]`) zabezpieczoną warstwą kontroli dostępu RBAC.*

---

## Struktura katalogów

```text
PolicyChecker/
├── docker-compose.yml       # Konfiguracja Docker z bazą danych PostgreSQL i kontenerem aplikacji
├── README.md                # Ta dokumentacja
├── screenshots/             # 32 zrzuty aplikacji + plik README opisujący ekrany
├── prompt/                  # Katalog wymagań (np. referencja REQUIREMENTS.md)
├── UX_GUIDE/                # Przewodniki wdrożone podczas standaryzacji UI/UX
└── web/                     # Główny kod aplikacji Next.js
    ├── prisma/              # schema.prisma, migracje, plik seed.ts
    ├── src/app/             # Trasy App Router
    ├── src/components/      # Dedykowane widżety i bloki budulcowe (np. RuleBuilder)
    ├── src/lib/             # Logika (engine.ts, labels.ts, requestEvaluation.ts, sesja)
    └── scripts/             # Skrypty narzędziowe, np. automatyczne screenshoty Playwright
```

---

## Role i funkcje

System wykorzystuje model Role-Based Access Control (RBAC). Do bazy zostały wgrane konta testowe (hasło do każdego konta to `test1234`).

| Rola | Email testowy | Główne funkcje |
|---|---|---|
| **Requester (Wnioskodawca)** | `requester@pc.com` | Składanie wniosków w widoku 3 kroków, zapisywanie szkiców, wrzucanie załączników, komentarze, pogląd statusu decyzji. |
| **Reviewer (Recenzent)** | `reviewer@pc.com` | Posiada wgląd w kolejkę `IN_REVIEW`. Analizuje oceny, wspiera proces dyskusji, może użyć manualnego zastąpienia (override). |
| **Policy Owner** | `owner@pc.com` | Buduje nowe warianty polityk poprzez dodawanie reguł w wersji roboczej (`DRAFT`). Korzysta też z potężnej konsoli testów. |
| **Policy Approver** | `approver@pc.com` | Decydent w procesie wydawniczym. Zatwierdza reguły znajdujące się w `IN_REVIEW` na twarde wydania publiczne, z których korzysta silnik. |
| **Auditor** | `auditor@pc.com` | Nieograniczony dostęp do przeglądu logów operacji systemowych (Audit Trail). Możliwość tworzenia rzutów historii transakcji w plikach CSV (Read-Only). |
| **Admin** | `admin@pc.com` | Władca całości systemu. Otrzymuje pełen dostęp włączając panel zarządzania uprawnieniami, na którym może przypisywać poszczególne z 6 ról. |

---

## Uruchomienie

Cała aplikacja jest kontenerowana (uruchomiana na node 20 bazowym) aby zlikwidować wymóg manualnego pobierania pakietów. Niezbędny jest zainstalowany **Docker Desktop** (lub inny silnik dockerowy) i by port `3000` był gotowy do otwarcia kompozytora.

1.  **Pobierz kod źródłowy:**
    Katalogiem roboczym musi być root `PolicyChecker/` (a nie `web/`).
    ```bash
    git clone https://github.com/KamilW-git/PolicyChecker.git
    cd PolicyChecker
    ```

2.  **Uruchom z budowaniem:**
    ```bash
    docker compose up --build
    ```

Pierwsze uruchomienie zajmuje od 3 do 5 minut ze względu na przygotowywanie modułów paczki `npm`. Śledź konsolę — będziesz gotowy, gdy zasygnalizuje ci komunikaty takie jak: `Seeding complete.` oraz `Ready on http://0.0.0.0:3000`.

**Aplikacja podnosi się lokalnie na:** [http://localhost:3000](http://localhost:3000).

*   *Zatrzymanie usług w konsoli:* `Ctrl+C` -> `docker compose down`.
*   *Czyszczenie uszkodzonej bazy:* `docker compose down -v`.

---

## Zmienne środowiskowe

Konfigurację można znaleźć pod ścieżką `web/.env.example`.

| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | Adres PostgreSQL. Generowany od podstaw przez zmienne powołane w `docker-compose.yml`. |
| `JWT_SECRET` | Supersekretna fraza uwierzytelniania. Bardzo ważna przy kompilacjach produkcyjnych. |
| `NODE_ENV` | Zdefiniowany w aplikacji tryb: `development` / `production`. |

⚠️ Ochrona: Upewnij się by nie eksponować produkcyjnych zmiennych `.env` na widoku w systemie Git.

---

## Trasy aplikacji

| URL | Opis | Autoryzacja |
|---|---|---|
| `/` | Pulpit operacyjny dostosowany do roli | Sesja |
| `/login` | Strona logowania | Gość |
| `/requests` | Zestawienie i wyszukiwanie wniosków | Sesja |
| `/requests/new` | Intuicyjny wizard 3 kroków do składania nowego wniosku | Requester+ |
| `/requests/[id]` | Widok ze szczegółami i zakładkami (Przegląd, Decyzja, Historia, Pliki) | RBAC |
| `/policies` | Zbiór obowiązujących i archiwalnych polityk firmy | Sesja |
| `/policies/[id]` | Widok budowania reguł decyzyjnych oraz wersjonowanie | RBAC |
| `/policies/test` | Izolowana konsola weryfikująca silnik przed publikacją | Owner, Admin |
| `/audit` | Kronika działań i werdyktów reguł | Auditor, Admin |
| `/admin/users` | Panel kontrolny dostępu dla kont i personelu | Admin |
| `/api/audit/export` | Pobieranie archiwum audytu do CSV | Auditor, Admin |
| `/api/attachments/[id]` | Trasa HTTP pobierania plików blokowana przez uwierzytelnienie RBAC | RBAC |

---

## Flow aplikacji

### Flow wniosku

Droga wniosku jest bardzo prosta.
1. `DRAFT` (Szkic - ukryte zmiany lokalne w systemie u Requestera).
2. Po wysłaniu `SUBMITTED`, przejmuje go od razu **Silnik reguł**.
3. Silnik reguł narzuca jeden ze statusów. Jeśli nie ma w nim błędów przechodzi do `AUTO_APPROVED` lub powołuje alarm ostrzegający przez rzucenie go na stos wyciągnięcia od Wnioskodawcy (`NEEDS_INFORMATION`). Po otrzymaniu wymogów Wnioskodawca robi 'Resubmit'.
4. Jeśli wniosek naruszył reguły akceptacji ląduje u Recenzentów (`IN_REVIEW`), bądź jest automatycznie i ostatecznie odrzucony (`REJECTED`).
5. Podczas gdy status tkwi w `IN_REVIEW`, Recenzent narzuca końcowy manualny werdykt Override zatwierdzając lub zamykając wniosek negatywnie.

### Flow polityki

Polityka edytuje warianty za pomocą schematu:
`DRAFT` (Edycja zasad i wprowadzanie kryteriów logicznych) → Przejście w tryb `IN_REVIEW` → Podpis i awans na aktywne źródło prawdy (`PUBLISHED`).

> Tylko "Opublikowane" iteracje analizują na żywo zlecane projekty. Do testów innych faz służy niezależna konsola testowa. Owner tworzy i odsyła do aprobaty dowolne zmiany w roboczej strukturze niezależnie od tego jak funkcjonuje proces główny.

---

## Silnik reguł

Silnik zaimplementowany został przez autorską logikę sprawdzającą kryteria w modelu deterministycznym, powoływanym przez Server Actions.
- **Reguły:** Warunki JSON wyzwalające efekty logiczne takie jak: `REJECT`, `REQUIRE_FIELD`, `REQUIRE_REVIEW`, `APPROVE`.
- **Priorytet decyzji:** Skomplikowane reguły nadpisują się bazując na surowości decyzji od najwyższej do domyślnej po odpytaniu wszystkiego: `REJECTED` > `MISSING_INFORMATION` > `REQUIRES_REVIEW` > `APPROVED`.
- **Koszty:** Sumy poddawane ewaluacji przez silnik ulegają konwersji i ujednoliceniu przez zaprogramowaną właściwość przeliczającą EUR np. `annualCostEur`.
- Ewaluacje w logach (`PolicyEvaluation`) mają status tzw. obiekty *append-only*. Składają się zawsze z pełnego przebiegu logiki silnika z wszystkimi regułami spełnionymi / opuszczonymi. Snapshot zawiera pełny kontekst obiektu z czasu jego zgłoszenia.

---

## Bezpieczeństwo

| Obszar | Implementacja zabezpieczeń |
|---|---|
| **Sesja (Auth)** | Standaryzowane JSON Web Token w ciasteczkach `httpOnly`. Zaufanie odczytywane i ograniczane przez wdrożony systemowy Middleware Node'a przed wyrenderowaniem stron. |
| **RBAC** | Ograniczenia i zakazy wyświetlania w kodzie frontendowym, wzmocnione przez żelazne obwarowania wywoływania każdej funkcji serwera Server Actions. Użytkownik o zaniżonym RBAC dostanie wyjątkiem serwera. |
| **Prywatność Załączników** | Ustandaryzowane API blokujące bezpośrenie dostępy dla folderu uplaod - warunkiem autoryzacji serwowania plików jest aktywna sesja lub przynależenie do odpowiednich grup ról. |
| **Szyfrowanie haseł** | Hashe zapisane wewnątrz wirtualnych danych bazy seed.ts posługujące się biblioteką `bcrypt`. |
| **Zgodność (Audyt)** | Tabela logująca zdarzenia `AuditEvent` i tablice z ocenami logicznymi przechowujące historię tak, że nic nigdy nie zostaje zmodyfikowane post-factum. |

---

## Scenariusz demo (~10 min)

Prześledź kroki by upewnić się, że znasz możliwości MVP po załadowaniu danych seed.

1.  Uruchom w wierszu `docker compose up --build`. Zaloguj się danymi recenzenta: `reviewer@pc.com` / `test1234`.
2.  Twój nowy "Pulpit" zawiera blok analityczny wskazujący status np. zadań „Wymaga uwagi”.
3.  Z zakładki Wniosków ("Requests") wybierz przykładowe zlecenia oznaczone tytułem [Sample], wyfiltruj te będące w recenzji (`IN_REVIEW`).
4.  W zakładce "Szczegóły" ("Decyzja") silnika przejrzyj dlaczego skrypt odłożył zgłoszenie na to konkretne stanowisko decyzyjne i jaka reguła wpłynęła na jego uzasadnienie.
5.  Zmień konto uderzając w wyloguj - zaloguj się jako `requester@pc.com`. Przełącz status by móc wysłać „nowy wniosek” obsługując potężny wizard krok po kroku.
6.  Udaj się na konto właściciela procesów: `owner@pc.com`. Zajrzyj do zakładek "Polityki". Po edycji sprawdź jak nowa wersja reguł zachowa się na dowolnych zestawach danych odpalając z dedykowanej opcji "Konsola testów".
7.  Przelogowanie audytora (`auditor@pc.com`) pozwoli Ci eksportować zebrane wyniki procesów jako arkusze CSV z audytu.
8.  Końcowo, w zakładce Zarządzania administratora: `admin@pc.com` przećwicz jak bardzo restrykcyjnie zmienia się całą matrycę praw operacyjnych użytkowników.

---

## Testy

*   **Testy logiki i wyliczeń algorytmicznych Vitest:** Wywołaj: `docker compose exec app npm test`.
*   **Testy regresji UI – Playwright:** Automatycznie strzelaj ponad 30-sta najróżniejszymi zrzutami UI we wszystkich układach i ekranach na raz! Przejdź wewnątrz `cd web` po uprzednim postawieniu aplikacji na żywo – następnie uruchom powołane Playwright za sprawą prostej paczki node'owej: `npm run screenshots:docker`. Zrzuty trafią do zmapowanego na hoście `screenshots/`.

---

## Seed

Inicjalizacja aplikacji ładuje za Ciebie mnóstwo sensownych wpisów od zaraz:
*   Zestaw z 3 gotowymi politykami w konfiguracjach statusów od projektowych po akceptacyjne.
*   Pule 5 szczegółowo zaaplikowanych zgłoszeń oznaczonych jako wpisy referencyjne dopiskiem `[Sample]`, które na sucho reprezentują w bazie pięć krańcowo przeróżnych scenariuszy ścieżki zatwierdzających silników aplikacji.

---

## Galeria

Baza 32 w pełni dostępnych scen i wizualizacji leży z opisami w sekcji podrzędnego readme: [screenshots/README.md](screenshots/README.md).

### Pulpit i logowanie

| Strona logowania | Pulpit (Recenzent) | Pulpit (Wnioskodawca) | Pulpit (Admin) |
|:---:|:---:|:---:|:---:|
| ![Login](screenshots/01-login.png) | ![Rev](screenshots/02-dashboard-reviewer.png) | ![Req](screenshots/11-dashboard-requester.png) | ![Admin](screenshots/12-dashboard-admin.png) |

### Workflow wniosków

| Filtry wniosków | Szczegóły projektu | Zakładki wniosków | Wizard tworzenia |
|:---:|:---:|:---:|:---:|
| ![RevFilters](screenshots/03-requests-list-reviewer.png) | ![RevDetails](screenshots/04-request-detail.png) | ![RevPanel](screenshots/16-request-in-review-policy-panel.png) | ![Form](screenshots/05-request-new-form.png) |

### Decyzje

| Auto-Approved | W Recenzji | Braki informacji | Odrzucony | Wymuszenie decyzji |
|:---:|:---:|:---:|:---:|:---:|
| ![Auto](screenshots/22-request-auto-approved.png) | ![InReview](screenshots/04-request-detail.png) | ![Banner](screenshots/18-request-needs-information-banner.png) | ![Rejected](screenshots/23-request-rejected.png) | ![Override](screenshots/17-request-manual-override-modal.png) |

### Polityki i audyt

| Publikacje polityk | Definicje reguły | Konsola testów | Zapis audytu |
|:---:|:---:|:---:|:---:|
| ![List](screenshots/06-policies-list.png) | ![AddRule](screenshots/27-policy-add-rule-form.png) | ![Console](screenshots/08-policy-test-console.png) | ![Audit](screenshots/09-audit-trail.png) |

---

## Checklista MVP

Stan techniczny względem nakreślonych, surowych wymagań biznesowych zdefiniowanych przy starcie projektu w pliku koncepcyjnym:

*   ✅ Złożony Formularz / wizard kroków tworzenia wniosków we wdrożeniu User Experience
*   ✅ Przeglądarka filtrów oraz zakładki nawigacyjne dla widoków wniosku
*   ✅ Implementacja logicznego i deterministycznego w oparciu o silnik obrabiający JSON + Pełna rozdzielczość 'Explainability' dla UI.
*   ✅ Moduły powoływania nowych instancji iteracji cykli edycyjnych i kreator graficzny dla budowniczych logiki
*   ✅ Utylizowanie obejść (Overrides) nadpisujących z natychmiastowym rozłożeniem zmian po stronie Audytu z uzasadnieniem manualnym.
*   ✅ Podział bezpieczeństwa z autorskim matrycą ról składających się z 6 uprawnień systemowych.
*   ✅ Półka piaskownicy developerskiej od ręki analizującej reguły (Konsola Testowa).
*   ✅ Pobieranie logiki serwującej załączniki z zabezpieczonym stanem streamingu dyskowego w Node + obsługa powiązanych komentarzy z podaniem dat stempli.
*   ✅ Interaktywne bloki metryk z dedykowaną akcentacją UI (Dashboard i Toasty).
*   ✅ Start powołanego z jednego przycisku, potężnego środowiska kontenerowego (Docker).

*   ⚠️ System w tej rewizji pomimo zatrzaśnięcia danych na bazie nie posiada nakładek UI wyświetlających kompletnej instancji z czasu ewaluowania (funkcja out-of-scope dla UI).
*   ⚠️ Element w interfejsie służący do wstrzykiwania kodu nowej reguły budowniczej bazuje jeszcze jako ciemna strona designowa na przeciwieństwo pozostałej w całości rozjaśnionej konwencji komponentu wizualnego UI/UX (brak przepisanego motywu komponentu z JSON na nowy).

*   ❌ Integracje wielkich federacji logowania jak SCIM oraz popularne oprogramowanie korporacyjne dla podwyższenia SSO po logowaniach.
*   ❌ Projekt odrzuca podłoża rozwiązań w oprogramowaniach wspomagania operacyjnego trzecich grup tj. integracje po API do ekosystemów takich jak oprogramowanie JIRA czy środowiska ERP zewn. deweloperów.
*   ❌ Architektura odrzuca zmuszania użyć i standardów standaryzujących notacji procesów np. DMN lub BPMN na cel prostych metod weryfikacyjnych po kluczowych parametrach JSON w bazie.
*   ❌ Całość bazuje na silniku - system u źródła rezygnuje definitywnie i stanowczo z powierzania sztucznej inteligencji decyzji (wymóg rygoru by zapobiec algorytmicznym wpadkom decyzyjnym, AI nie ma ostatecznego prawa do zablokowania projektu po stronie aplikacji).
*   ❌ Zaplecze backendowe nie uwzględnia w tej architekturze obsługi baz z odseparowaniem (Multi-Tenant).

---

## Troubleshooting

Zbiór ewentualnych problemów dla początkujących postawionym kontenerów w tej paczce:

| Objaw | Rozwiązanie problemu |
|---|---|
| Prisma error 7.x po budowie. | Przestarzałe pliki modułu. Użyj opcji i uruchom terminal wewnątrz bazy docker compose `docker compose exec app bash` instalując manualnie poleceniem z konsoli serwera `npm i` by naprawić relacyjne pule zależności i pobudzić ORM kluczem `npx prisma generate`. |
| Port 3000 niedostępny dla Docker Desktop. | Zabij wszystkie uruchomione procesy `npm run dev` na lokalnej stacji, która może powodować wyciek dostępu na serwer z hosta. PolicyChecker startuje sztywno z trzema złączami i port ten na poziomie localhost z Windows'a/MacOS nie wpuści drugiego portu dla Next.js. |
| Konflikt lokalnego portu `:5432` PostgreSQL. | Aplikacja z dokera wystawiła port bazodanowy na życzenie dla wizualizatorów db na zewnątrz do przeglądu migracji, jeśli jednak serwery pod kątem lokalnej bazy na 5432 się "gryzą", zmień u siebie opcję wystawienia bazy Docker w `docker-compose.yml` kasując blok ekspozycji baz albo zmieniając wpis `5433:5432`. |
| Czysta praca Next i docker. | Nie odpalaj komend `npm run build` gdy u hosta obok włączony jest komendator `npm run dev`. Skutkuje to permanentnym wykasowaniem ścieżek `layout.css?` skutkujących natychmiastowym 404 w aplikacji. Wejdź w środek app poleceniem kontenera wpisując w bash `rm -rf .next` oraz odśwież Docker `restart app`. |
| Błędy docker command. | Wymagany folder docelowy: root `/PolicyChecker` bez dopisywania dalszych lokacji np `/web/`. |

---

## Wdrożenie produkcyjne

Ekosystem poddany produkcyjnemu testowi winien spełniać wdrożeniowe klauzule.
Aby aplikacja sprawnie i poprawnie skompilowała i przyspieszyła zasoby wymagany jest przed buildem start i załączenie flag zdefiniowanych na serwerze - `NODE_ENV=production`. Ustaw trudny do złamania, potężny `JWT_SECRET`. Nie wyciągaj Postgresa w publiczne i niezabezpieczone obszary. Zadbaj dodatkowo jako administrator sieciowy za zrobienie kopii regularnych pod bazy by wyłapać ewentualne awarie odkładanych załączników z dysku. Aplikacja ulega spakowaniu po ustandaryzowany od strony webowej bezpieczny routing z Reverse proxy na HTTPS.

---

## O projekcie

Dokumentacja udowadniająca dojrzały technicznie i wizualnie portfel inżyniera projektów (rekrutacyjnych / portfolio). Rozwój na bazie skrupulatnie egzekwowanych scenariuszy z wykorzystaniem wiodących, wielofunkcyjnych modeli językowych. Całość oparta została z założenia o mocne oprogramowanie bez sztucznej inteligencji rzutujących w wyniki. Architektura obwarowana bezpiecznym murem powtarzalnych jednostkowych procesów (testów) w celu wyeliminowania wad z warstwy UI przed kompilacją serwerową w finalnym ekosystemie.
