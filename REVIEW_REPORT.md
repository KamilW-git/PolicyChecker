# Raport zgodności PolicyChecker z REQUIREMENTS.md

**Data:** 2026-06-06  
**Zakres:** porównanie implementacji (`web/`) ze specyfikacją (`prompt/REQUIREMENTS.md`, `prompt/RBAC.md`)  
**Uwaga:** kod nie był modyfikowany w trakcie audytu.

---

## Podsumowanie wykonawcze

Projekt PolicyChecker to wczesne **MVP** (~35 plików źródłowych): działa pionowy przekrój (logowanie → wniosek → ocena → override → podgląd polityk), ale **większość wymagań MVP jest niezrealizowana lub zrealizowana tylko częściowo**.

| Obszar | Stan |
|--------|------|
| Formularz i workflow wniosków | ~25% |
| Silnik reguł | ~30% |
| Polityki i wersjonowanie | ~15% |
| RBAC (6 ról) | ~40% |
| Audyt | ~20% |
| Pulpit operacyjny | ~25% |
| Komentarze, załączniki, testowanie reguł | 0% |
| Wymagania niefunkcjonalne | ~20% |
| Kryteria akceptacji MVP (§13) | **2–3 z 12** |

---

## 1. Czego brakuje

### 1.1 Zakres MVP (§4.1) — brakujące elementy

| # | Wymaganie MVP | Stan |
|---|---------------|------|
| 1 | Formularz wniosku | Częściowy — brakuje wielu pól i logiki dynamicznej |
| 2 | Lista wniosków | Podstawowa tabela, bez filtrów/sortowania/paginacji |
| 3 | Widok szczegółów | Częściowy — brak komentarzy, załączników, pełnej historii |
| 4 | Silnik oceny | Minimalny — 4 operatory, ignoruje efekty |
| 5 | Wynik z uzasadnieniem | Uproszczony — brak reguł, wersji polityk, kroków |
| 6 | Prosty kreator reguł | Brak — tylko edycja JSON |
| 7 | Wersjonowanie polityk | Model w DB, brak UI/workflow |
| 8 | Historia ocen i decyzji | Tylko jedna ocena na wniosek w UI |
| 9 | Manual override | Zaimplementowany w ~70% |
| 10 | Pulpit operacyjny | 4 liczniki, brak większości metryk |
| 11 | **Komentarze** | **Brak** (model `RequestComment` istnieje) |
| 12 | **Załączniki** | **Brak** (model `RequestAttachment` istnieje) |
| 13 | **Konsola testowania reguł** | **Brak** (FR-19) |

### 1.2 Wymagania funkcjonalne — braki szczegółowe

#### FR-1 — Tworzenie wniosku

Brakujące pola w formularzu (`web/src/app/requests/new/page.tsx`):

- Business owner (wybór użytkownika) — przypisywany automatycznie do pierwszego `POLICY_OWNER`
- Budget owner
- `processesPersonalData` (boolean)
- Kategorie danych (multi-select)
- `hasDpa` (boolean)
- Pilność (`urgency`)
- Brakuje typów: `CONSULTING_SERVICE`, `EXCEPTION_REQUEST`
- Brakuje kategorii: `MARKETING_SERVICE`, `CLOUD_SERVICE`, `DATA_PROVIDER`
- Brakuje działów: `SALES`, `LEGAL`, `PROCUREMENT`, `OTHER`
- Brakuje waluty `GBP`

#### FR-2 — Dynamiczny formularz

Brak warunkowego pokazywania pól (DPA, transfer poza EOG, kwestionariusz bezpieczeństwa itd.).

#### FR-3 — Zapis i złożenie

- Brak zapisu jako `DRAFT`
- Brak osobnej akcji „złóż" vs „zapisz roboczy"
- Brak walidacji przed oceną i statusu `NEEDS_INFORMATION`
- Ocena uruchamiana od razu przy submit

#### FR-4 — Ocena wniosku

W `PolicyEvaluation` brakuje w wyniku:

- listy reguł niedopasowanych
- brakujących pól
- wymaganych akceptujących
- pełnych danych wersji polityk (tylko ID w `appliedPolicyVersions`)
- encji `PolicyEvaluationRuleMatch` (wspomniana w §12, brak w schemacie)

#### FR-5 — Wyjaśnienie decyzji

Brak: reguł które zadziałały, wersji polityk, dalszych kroków, faktów wejściowych w czytelnej formie. Jest tylko tekst `reason` w `resultSnapshot`.

#### FR-6 — Lista wniosków

Brak 10 filtrów, sortowania, paginacji oraz kolumn: decyzja, wymagani akceptujący, data ostatniej oceny.

#### FR-7 — Szczegóły wniosku

Brak: listy reguł, brakujących informacji, wymaganych akceptujących, historii zmian, komentarzy, załączników, pełnej historii ocen.

#### FR-8, FR-9 — Komentarze i załączniki

Modele w Prisma, zero UI i server actions.

#### FR-10, FR-11, FR-12 — Polityki

- Brak tworzenia polityki (przycisk „+ Nowa Polityka" wyłączony)
- Brak tworzenia nowych wersji
- Brak cyklu `DRAFT → IN_REVIEW → PUBLISHED → ARCHIVED`
- Brak dat obowiązywania, opisu zmian w UI
- Edycja reguł na „latest version", nie na wersji roboczej

#### FR-13 — Kreator reguł

Brak kreatora warunków/efektów — tylko JSON textarea. Brak edycji pola `effect`.

#### FR-14 — Operatory

Z 12 wymaganych operatorów działają 4: `equals`, `greater_than`, `less_than`, `contains`. Brak m.in. `not_equals`, `greater_or_equal`, `is_empty`, `in`, `not_in`. Łączenie: `AND`/`OR` zamiast `ALL`/`ANY`.

#### FR-15 — Efekty reguł

Pole `effect` jest zapisywane, ale **silnik go w ogóle nie czyta**. Brak obsługi: `APPROVE`, `REQUIRE_REVIEW`, `REJECT`, `REQUIRE_FIELD`, `ADD_RISK_POINTS`, `ADD_REASON_CODE`.

#### FR-16 — Historia decyzji

Zapisywana jest jedna ocena przy utworzeniu. Brak ponownej oceny, brak powiązania z pełnym audytem.

#### FR-18 — Pulpit

Brakuje metryk: auto-approved, brakujące informacje, odrzucone, średni czas decyzji, najczęstsze reguły, najczęstsze brakujące pola, filtrowanie po okresie/dziale/kategorii.

#### FR-19 — Konsola testowania

Brak.

#### FR-20 — Słowniki domenowe

Enumy częściowo w schemacie, brak zarządzania słownikami (Admin), brak pól formularza dla pilności, klasyfikacji danych, ryzyka dostawcy.

### 1.3 Przypadki użycia — niezrealizowane

| UC | Opis | Stan |
|----|------|------|
| UC-1 | Złożenie wniosku | Częściowo — bez draftu, załączników, pełnej walidacji |
| UC-2 | Wyjaśnienie decyzji | Częściowo |
| UC-3 | Ocena wniosku przez Reviewera | Częściowo — tylko manual override, bez kolejki przypisanej do roli |
| UC-4 | Uzupełnienie brakujących informacji | **Brak** |
| UC-5 | Utworzenie polityki | **Brak** |
| UC-6 | Definiowanie reguły | Częściowo — JSON, bez efektów |
| UC-7 | Testowanie reguły | **Brak** |
| UC-8 | Publikacja polityki | **Brak** |
| UC-9 | Manual override | Częściowo |
| UC-10 | Audyt decyzji | Częściowo |
| UC-11 | Pulpit operacyjny | Częściowo |

### 1.4 Przykładowe reguły domenowe (§11) — brak w systemie

W seedzie jest tylko **Reguła 1** (SaaS > 5000). Brakuje:

| Reguła | Opis | Dlaczego nie działa |
|--------|------|---------------------|
| 2 | DPA przy danych osobowych | Brak pól `processesPersonalData`, `hasDpa`; brak efektu `REQUIRE_FIELD` |
| 3 | Dostawca wysokiego ryzyka | Brak pola `vendorRisk` |
| 4 | Zakup awaryjny | Brak pola `urgency` |
| 5 | Zakup ≥ 50 000 EUR | Brak operatora `greater_or_equal`, brak konwersji walut |

### 1.5 Scenariusz demonstracyjny (§15)

Dla wniosku SaaS 8000 EUR, US, dane osobowe, brak DPA oczekiwany wynik to **`MISSING_INFORMATION`** z listą braków i wymaganych akceptujących. Obecnie:

- brak pól RODO → reguły 2–4 nie zadziałają
- brak konwersji EUR → reguła kosztowa może źle ocenić USD/PLN
- silnik nie zwraca `MISSING_INFORMATION`
- brak wielu polityk domenowych z scenariusza

### 1.6 Infrastruktura i jakość

- Brak migracji Prisma w repo
- Brak testów automatycznych
- Brak `.env.example`, produkcyjnego Dockerfile
- Brak modułu AI Rule Generator (wspomniany w `prompt/ARCHITECTURE.md`)
- Brak `shadcn/ui` (deklarowany w architekturze)

---

## 2. Co jest źle zaimplementowane

### 2.1 Silnik reguł (`web/src/lib/engine.ts`)

**Model decyzji (§6)** wymaga priorytetu:

`REJECTED > MISSING_INFORMATION > REQUIRES_REVIEW > APPROVED`

Implementacja:

```typescript
if (rule.severity === 'WARNING' || rule.severity === 'BLOCKER') {
  decision = 'REQUIRES_REVIEW'
}
```

Problemy:

- `BLOCKER` nie daje `REJECTED` — UI mówi „Odrzuca od razu", silnik traktuje jak WARNING
- Nigdy nie zwraca `MISSING_INFORMATION`
- Decyzja oparta na `severity`, nie na polu `effect` (§FR-15)
- Brak agregacji wielu efektów z wielu reguł

**Mapowanie statusów przy tworzeniu wniosku** (`web/src/app/requests/actions.ts`):

```typescript
const initialStatus = engineDecision === Decision.APPROVED
  ? RequestStatus.AUTO_APPROVED
  : RequestStatus.IN_REVIEW
```

Problemy:

- `REJECTED` → status `IN_REVIEW` zamiast `REJECTED`
- `MISSING_INFORMATION` → nieobsługiwane → zawsze `IN_REVIEW`
- Pominięty status `SUBMITTED` w maszynie stanów (§7)

### 2.2 Manual Override

**Naruszenie modelu decyzji:** modal oferuje `APPROVED_WITH_EXCEPTION`, ale enum `Decision` nie zawiera tej wartości — to status wniosku, nie decyzja. Przy zapisie możliwy błąd Prisma w runtime.

**Naruszenie NFR-7 (integralność):** oryginalna decyzja systemowa jest w `ManualOverride.originalDecision`, ale pole `Request.decision` jest **nadpisywane** — nie ma oddzielnego wpisu decyzji systemowej vs ręcznej na poziomie wniosku.

**Braki względem FR-17 / `prompt/ManualOverride.md`:**

- Załącznik w formularzu — UI jest, storage nie zapisuje `attachmentPath`
- Brak wyświetlania oryginalnej decyzji systemowej obok override w historii
- `APPROVED_WITH_EXCEPTION` jako status: logika `decision.includes('APPROVED')` ustawia status `APPROVED`, nie `APPROVED_WITH_EXCEPTION`

### 2.3 Polityki i reguły

- Edycja reguł na **najnowszej wersji** bez rozróżnienia DRAFT/PUBLISHED — zmiany mogą dotyczyć opublikowanej wersji (naruszenie §FR-12)
- Nowe reguły dostają domyślny `effect: [{ type: 'EVALUATE' }]` — typ spoza specyfikacji
- Brak walidacji struktury warunków poza `JSON.parse`
- Brak audytu zmian polityk/reguł (`AuditEvent` tylko przy override)

### 2.4 Wyjaśnialność (NFR-1)

Etykieta „Policy Checker **AI**" sugeruje AI jako źródło decyzji — sprzeczne z NFR-3 i §2 opisu systemu.

W `resultSnapshot` jest tylko `{ reason: string }` — brak nazw reguł, polityk, wersji, rekomendowanych kroków.

### 2.5 RBAC — niespójności

- `POLICY_OWNER` i `POLICY_APPROVER` widzą **tylko własne wnioski** (jak Requester) — Policy Owner powinien zarządzać politykami, nie być ograniczony przy wnioskach
- Brak kolejki oceny przypisanej do roli recenzenta (UC-3)
- Brak separacji komentarzy wewnętrznych (NFR-4)

### 2.6 Audyt

Strona `/audit` pokazuje `PolicyEvaluation`, nie pełny `AuditEvent`. Brak: snapshotów input/result w widoku audytu, manual override, zmian polityk, eksportu danych.

### 2.7 Bezpieczeństwo (implementacja MVP)

- Hasła plaintext w DB
- JWT secret hardcoded w `session.ts` i `middleware.ts`
- Brak hashowania haseł (bcrypt/argon2)
- Brak walidacji server-side pól formularza (tylko HTML `required`)

---

## 3. Jakie role nie działają

### 3.1 Requester (Wnioskodawca) — ~40%

| Uprawnienie (`prompt/RBAC.md`) | Stan |
|--------------------------------|------|
| Tworzenie wniosku | ✅ Działa |
| Edycja w DRAFT / NEEDS_INFORMATION | ❌ Nie |
| Wysłanie do oceny | ⚠️ Tylko bezpośredni submit |
| Komentarze, załączniki | ❌ Nie |
| Podgląd decyzji | ⚠️ Częściowo |
| Historia własnego wniosku | ⚠️ Tylko ostatnia ocena + override |

### 3.2 Reviewer (Recenzent) — ~50%

| Uprawnienie | Stan |
|-------------|------|
| Kolejka przypisana do roli | ❌ Widzi wszystkie wnioski |
| Komentarze | ❌ Nie |
| Zmiana statusów (approve/reject/exception) | ⚠️ Tylko przez Manual Override |
| Manual Override | ⚠️ Działa (z błędami typów) |
| Historia ocen | ⚠️ Częściowo |

### 3.3 Policy Owner — ~35%

| Uprawnienie | Stan |
|-------------|------|
| Tworzenie polityk | ❌ Przycisk disabled |
| Edycja polityk / nowe wersje | ❌ Nie |
| Dodawanie/usuwanie reguł | ✅ Działa (JSON) |
| Testowanie reguł | ❌ Nie |
| Wysyłanie do zatwierdzenia | ❌ Nie |
| AI Rule Generator | ❌ Nie |
| Widok wniosków | ❌ Błędnie ograniczony do własnych |

### 3.4 Policy Approver — ~5% (rola praktycznie nieużywana)

| Uprawnienie | Stan |
|-------------|------|
| Przegląd polityk IN_REVIEW | ❌ Nie |
| Akceptacja/odrzucenie publikacji | ❌ Nie |
| Publikacja wersji | ❌ Nie |
| Archiwizacja | ❌ Nie |
| Edycja reguł | ✅ Poprawnie zablokowana |
| Faktyczne zachowanie | ❌ Jak Requester — widzi tylko własne wnioski |

**Wniosek:** rola istnieje w seedzie i enumie, ale **nie ma żadnej dedykowanej funkcjonalności**.

### 3.5 Auditor — ~30%

| Uprawnienie | Stan |
|-------------|------|
| Podgląd wszystkich wniosków | ✅ Działa |
| Historia ocen | ⚠️ Częściowo (`/audit`) |
| Snapshoty input/result | ❌ Nie w widoku audytu |
| Manual override | ⚠️ Tylko na stronie wniosku, nie w audycie |
| Eksport danych | ❌ Nie |
| Tworzenie/edycja wniosków | ✅ Poprawnie zablokowane |

### 3.6 Admin — ~45%

| Uprawnienie | Stan |
|-------------|------|
| Override, edycja reguł, audyt | ✅ Działa |
| Zarządzanie użytkownikami | ❌ Nie |
| Zarządzanie rolami | ❌ Nie |
| Słowniki domenowe | ❌ Nie |
| Konfiguracja systemu | ❌ Nie |
| Logi techniczne | ❌ Nie |
| „Wszystko" (`prompt/RBAC.md`) | ❌ Nie |

---

## 4. Jakie reguły nie są obsłużone

### 4.1 Typy efektów (FR-15) — żaden nie działa w silniku

| Efekt | Wymaganie | Implementacja |
|-------|-----------|---------------|
| `APPROVE` | Auto-akceptacja | Ignorowany |
| `REQUIRE_REVIEW` | Ocena przez rolę/grupę | Ignorowany (severity zamiast effect) |
| `REJECT` | Odrzucenie | Ignorowany |
| `REQUIRE_FIELD` | Brakujące pole/dokument | Ignorowany → brak `MISSING_INFORMATION` |
| `ADD_RISK_POINTS` | Punkty ryzyka | Ignorowany |
| `ADD_REASON_CODE` | Kod powodu | Ignorowany |

### 4.2 Poziomy ważności (FR-13) — rozjazd z UI

| Severity | UI (`policies/[id]/page.tsx`) | Silnik |
|----------|-------------------------------|--------|
| INFO | „Tylko log" | Nie zmienia decyzji ✅ |
| WARNING | „Wymaga akceptacji" | `REQUIRES_REVIEW` ✅ |
| BLOCKER | „Odrzuca od razu" | `REQUIRES_REVIEW` ❌ (powinno `REJECTED`) |

### 4.3 Operatory (FR-14)

**Zaimplementowane (4/12):** `equals`, `greater_than`, `less_than`, `contains`

**Brak (8/12):** `not_equals`, `greater_or_equal`, `less_or_equal`, `not_contains`, `is_empty`, `is_not_empty`, `in`, `not_in`

### 4.4 Reguły przykładowe z §11

| # | Reguła | Możliwość uruchomienia |
|---|--------|------------------------|
| 1 | SaaS > 5000 EUR | ⚠️ Częściowo — bez normalizacji walut |
| 2 | DPA przy danych osobowych | ❌ Brak pól i `REQUIRE_FIELD` |
| 3 | Vendor risk HIGH | ❌ Brak `vendorRisk` |
| 4 | Urgency EMERGENCY | ❌ Brak `urgency` |
| 5 | annualCost >= 50000 | ❌ Brak `greater_or_equal` |

### 4.5 Pola dostępne dla reguł vs wymagane

**W snapshot:** `title`, `description`, `type`, `category`, `annualCost`, `currency`, `vendorName`, `vendorCountry`, `department`

**Brak w snapshot (potrzebne dla reguł):** `processesPersonalData`, `hasDpa`, `dataCategories`, `urgency`, `vendorRisk`, `budgetOwnerId`, załączniki

---

## 5. Wymagania niefunkcjonalne — niespełnione

### NFR-1 Wyjaśnialność — ❌ NIESPEŁNIONE

Brak w wyniku: nazwy reguł, nazwy i wersje polityk, rekomendowanych kroków, faktów wejściowych w czytelnej formie. Etykieta „AI" wprowadza w błąd.

### NFR-2 Audytowalność — ⚠️ CZĘŚCIOWO

| Element | Stan |
|---------|------|
| Snapshot input/result | ⚠️ Częściowo w `PolicyEvaluation` |
| Wersje polityk | ⚠️ Tylko ID |
| Użytkownik + timestamp | ⚠️ Częściowo |
| Manual override | ⚠️ Tylko w `ManualOverride` + jeden `AuditEvent` |
| Komentarze | ❌ Brak |
| Zmiany polityk | ❌ Brak |
| Zdarzenia publikacji | ❌ Brak |

### NFR-3 Determinizm — ✅ SPEŁNIONE

Silnik jest deterministyczny, bez AI w decyzji (pomimo mylącego brandingu).

### NFR-4 Bezpieczeństwo — ❌ NIESPEŁNIONE

| Wymaganie | Stan |
|-----------|------|
| RBAC | ⚠️ Częściowe |
| Separacja ról | ⚠️ Częściowa |
| Walidacja inputów | ❌ Minimalna |
| Ochrona kreatora reguł | ⚠️ Tylko `JSON.parse` |
| Brak arbitrary code execution | ✅ OK |
| Kontrola dostępu do załączników | N/A (brak załączników) |
| Rejestrowanie zdarzeń audytowych | ⚠️ Minimalne |
| Komentarze wewnętrzne | ❌ Brak |

Dodatkowo: plaintext passwords, hardcoded JWT secret.

### NFR-5 Wydajność — ❌ NIESPEŁNIONE / NIESPRAWDZONE

- Brak paginacji list wniosków i historii ocen
- Brak cache/preagregacji na pulpicie
- 500 ms — brak testów wydajnościowych

### NFR-6 Użyteczność — ❌ NIESPEŁNIONE

- Główny interfejs reguł to **surowy JSON** (wprost sprzeczne z wymaganiem)
- Brak kreatora warunków dla użytkowników nietechnicznych
- Statusy techniczne (`IN_REVIEW`, `AUTO_APPROVED`) bez tłumaczeń biznesowych

### NFR-7 Integralność danych — ⚠️ CZĘŚCIOWO

| Wymaganie | Stan |
|-----------|------|
| Historyczne oceny niezmienne po publikacji | ⚠️ Ryzyko — edycja reguł na opublikowanej wersji |
| Archiwizacja nie usuwa historii | ✅ OK (brak implementacji archiwizacji) |
| Override nie nadpisuje oryginalnej decyzji | ⚠️ `ManualOverride` OK, `Request.decision` nadpisywane |
| Snapshoty niemutowalne | ❌ Brak mechanizmu ochrony |

### NFR-8 Skalowalność funkcjonalna — ⚠️ CZĘŚCIOWO

Schemat Prisma jest rozszerzalny, ale silnik i UI są sztywno powiązane z uproszczonym modelem (severity zamiast effects, brak pluginów operatorów).

---

## 6. Kryteria akceptacji MVP (§13)

| # | Kryterium | Status |
|---|-----------|--------|
| 1 | Requester tworzy i składa wniosek | ⚠️ Częściowo — bez draftu, załączników, pełnych pól |
| 2 | Ocena deterministycznymi regułami | ⚠️ Częściowo |
| 3 | Decyzje: APPROVED, REQUIRES_REVIEW, REJECTED, MISSING_INFORMATION | ❌ Brak REJECTED i MISSING_INFORMATION |
| 4 | Zrozumiałe uzasadnienie | ❌ |
| 5 | Policy Owner: polityka, wersja, reguły | ❌ Brak tworzenia polityki i wersji |
| 6 | Opublikowana polityka przy ocenach | ⚠️ Tylko odczyt PUBLISHED |
| 7 | Ocena zapisuje wersję, input, result snapshot | ⚠️ Wersja tylko jako ID |
| 8 | Reviewer obsługuje wniosek w ocenie | ⚠️ Tylko override |
| 9 | Manual override z powodem | ⚠️ Bez załącznika, błędy typów |
| 10 | Auditor odtwarza historyczną decyzję | ❌ |
| 11 | Pulpit z podstawowymi metrykami | ⚠️ 4 z ~8 metryk |
| 12 | Egzekwowanie ról | ⚠️ Częściowe — POLICY_APPROVER martwa |

**Wniosek: MVP nie spełnia kryteriów akceptacji** — realnie spełnione są 2–3 punkty w wersji okrojonej.

---

## 7. Co działa poprawnie (dla kontekstu)

- Logowanie/wylogowanie z JWT cookie
- Podstawowy flow: wniosek → ocena → redirect do szczegółów
- Jedna reguła seed (SaaS > 5000) przy kategorii SAAS
- CRUD reguł (JSON) dla POLICY_OWNER/ADMIN
- Manual Override z audytem (rdzeń funkcji)
- Middleware + częściowe guardy RBAC
- Model danych Prisma pokrywa większość encji z §12 (poza `PolicyEvaluationRuleMatch`)
- Docker Compose do dev

---

## 8. Rekomendowana kolejność domknięcia luk

1. **Silnik:** efekty reguł, priorytet decyzji, `MISSING_INFORMATION`, `REJECTED` dla BLOCKER
2. **Formularz:** brakujące pola + logika dynamiczna (FR-1, FR-2)
3. **Workflow wniosku:** DRAFT → SUBMITTED → statusy z §7
4. **Polityki:** tworzenie, wersjonowanie, publikacja (Policy Approver)
5. **RBAC:** pełna implementacja 6 ról wg `prompt/RBAC.md`
6. **Audyt, komentarze, załączniki, konsola testowa**
7. **NFR:** bezpieczeństwo, paginacja, kreator reguł zamiast JSON

---

*Raport wygenerowany na podstawie analizy kodu źródłowego i `prompt/REQUIREMENTS.md`.*
