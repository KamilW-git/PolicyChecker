# Zrzuty ekranu PolicyChecker

Automatycznie generowane widoki aplikacji (Playwright). Skrypt tworzy brakujące wnioski demonstracyjne (`[DEMO]`), żeby pokazać wszystkie statusy workflow.

Hasło testowe: `test1234`

## Podstawowe widoki (01–10)

| Plik | Widok | Konto |
|------|-------|-------|
| `01-login.png` | Logowanie | — |
| `02-dashboard-reviewer.png` | Pulpit z metrykami | reviewer@pc.com |
| `03-requests-list-reviewer.png` | Lista wniosków | reviewer@pc.com |
| `04-request-detail.png` | Szczegóły wniosku | reviewer@pc.com |
| `05-request-new-form.png` | Nowy wniosek | requester@pc.com |
| `06-policies-list.png` | Lista polityk | requester@pc.com |
| `07-policy-detail.png` | Szczegóły polityki z regułami | requester@pc.com |
| `08-policy-test-console.png` | Konsola testowa (pusta) | owner@pc.com |
| `09-audit-trail.png` | Zdarzenia audytowe | auditor@pc.com |
| `10-admin-users.png` | Zarządzanie użytkownikami | admin@pc.com |

## Workflow i role (11–25)

| Plik | Widok | Co demonstruje |
|------|-------|----------------|
| `11-dashboard-requester.png` | Pulpit wnioskodawcy | Widok ograniczony do własnych wniosków |
| `12-dashboard-admin.png` | Pulpit administratora | Pełne metryki organizacji |
| `13-requests-filter-in-review.png` | Filtr IN_REVIEW | Domyślny widok recenzenta |
| `14-requests-filter-urgency.png` | Filtr pilności EMERGENCY | Zaawansowane filtrowanie |
| `15-requests-filter-needs-info.png` | Filtr „wymaga uzupełnienia” | Wnioski z brakami |
| `16-request-in-review-policy-panel.png` | Panel Policy Checker | Ocena silnika + reguły |
| `17-request-manual-override-modal.png` | Modal Manual Override | Ręczna decyzja recenzenta |
| `18-request-needs-information-banner.png` | Banner braków | Status NEEDS_INFORMATION |
| `19-request-edit-needs-info.png` | Formularz uzupełnienia | Resubmit workflow |
| `20-request-draft-detail.png` | Szkic wniosku | Status DRAFT + akcje |
| `21-request-draft-edit-form.png` | Edycja szkicu | Zapisz / Przekaż do oceny |
| `22-request-auto-approved.png` | Auto-zatwierdzenie | Decyzja APPROVED |
| `23-request-rejected.png` | Odrzucenie | Reguła BLOCKER / REJECT |
| `24-request-attachments-comments.png` | Załączniki i komentarze | Upload + dyskusja |
| `25-request-audit-trail-section.png` | Ślad rewizyjny na wniosku | Audit per request |

## Polityki i audyt (26–32)

| Plik | Widok | Co demonstruje |
|------|-------|----------------|
| `26-policies-list-owner.png` | Lista polityk (owner) | Zarządzanie politykami |
| `27-policy-add-rule-form.png` | Rule Builder — nowa reguła | Tworzenie reguł |
| `28-policy-test-console-result.png` | Wynik testu silnika | Ewaluacja JSON → decyzja |
| `29-policies-list-approver.png` | Lista (approver) | Rola zatwierdzającego |
| `30-audit-evaluations-tab.png` | Zakładka ocen | Historia PolicyEvaluation |
| `31-requests-my-requests.png` | Moje wnioski | Filtr requestera |
| `32-policies-new-form.png` | Nowa polityka | Tworzenie polityki |

## Ponowne wygenerowanie

```cmd
cd "C:\Users\Kamil Wrona\Desktop\Work\PolicyChecker\web"
npm run screenshots:docker
```

Wymaga działającej aplikacji: `docker compose up`
