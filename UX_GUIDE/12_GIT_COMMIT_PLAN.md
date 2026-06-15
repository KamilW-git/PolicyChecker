# Prompt dla Antigravity — commity UI/UX (osobny branch)

Wklej **całość** poniższego bloku do Antigravity.

---

```
Zadanie: Rozbij niezacommitowane zmiany w repozytorium PolicyChecker na wiele małych commitów na osobnym branchu UI/UX.

KONTEKST
- Repo: PolicyChecker (root), aplikacja w web/
- Obecna gałąź: main (wszystko jest uncommitted / unstaged)
- Cel: historia commitów czytelna dla rekrutera — jeden temat = jeden commit

ZASADY GIT (OBOWIĄZKOWE)
1. NIE używaj --no-verify, --amend, rebase, force push.
2. NIE dodawaj do commitów: Co-authored-by, Created-by, Signed-off-by, ani żadnych trailerów AI.
3. Tylko proste komendy:
   git checkout -b feat/ui-ux-pass
   git add <pliki>
   git commit -m "typ: jedno zdanie po angielsku"
4. Każdy commit message: JEDNA linia, angielski, Conventional Commits:
   feat: | fix: | style: | refactor: | docs: | chore:
5. Maksymalnie ~15 słów w message.
6. Po każdym commicie: git status — upewnij się, że zostały tylko pliki na kolejne commity.
7. NIE pushuj na koniec (user zrobi sam), chyba że wyraźnie poprosi.
8. NIE commituj plików z sekretami (.env z prawdziwymi kluczami).
9. NIE commituj web/src/components/ui/implementation_plan.md jeśli istnieje — usuń plik w osobnym chore commicie lub pomiń.
10. NIE zmieniaj git config.

BRANCH
git checkout main
git checkout -b feat/ui-ux-pass

KOLEJNOŚĆ COMMITÓW (wykonaj po kolei, dokładnie te pliki)

── Commit 1 ──
git add web/package.json web/package-lock.json
git commit -m "chore: add lucide-react and sonner for UI"

── Commit 2 ──
git add web/src/app/globals.css
git commit -m "style: add Apple-like design tokens in globals.css"

── Commit 3 ──
git add web/src/lib/labels.ts
git commit -m "feat: add Polish labels for statuses and decisions"

── Commit 4 ──
git add web/src/components/ui/PageHeader.tsx web/src/components/ui/Card.tsx web/src/components/ui/StatusBadge.tsx
git commit -m "feat: add shared PageHeader Card and StatusBadge components"

── Commit 5 ──
git add web/src/components/DesktopNav.tsx web/src/components/MobileNav.tsx
git commit -m "feat: add desktop and mobile navigation with active state"

── Commit 6 ──
git add web/src/app/layout.tsx
git commit -m "style: restyle root layout with light nav and toaster"

── Commit 7 ──
git add web/src/app/login/page.tsx
git commit -m "style: align login page with design tokens"

── Commit 8 ──
git add web/src/app/page.tsx
git commit -m "feat: redesign dashboard with attention section and metrics"

── Commit 9 ──
git add web/src/app/requests/[id]/RequestDetailTabs.tsx
git commit -m "feat: add tabbed layout for request detail views"

── Commit 10 ──
git add web/src/app/requests/[id]/page.tsx
git commit -m "feat: restyle request detail with sticky header and decision panel"

── Commit 11 ──
git add web/src/app/requests/[id]/ManualOverrideModal.tsx
git commit -m "style: restyle manual override modal to light theme"

── Commit 12 ──
git add web/src/app/requests/[id]/CommentForm.tsx web/src/app/requests/[id]/UploadForm.tsx
git commit -m "feat: add comment and upload forms with toast feedback"

── Commit 13 ──
git add web/src/app/requests/RequestWizard.tsx web/src/app/requests/new/page.tsx web/src/app/requests/[id]/edit/page.tsx
git add web/src/app/requests/RequestForm.tsx
git commit -m "feat: replace request form with multi-step wizard"

── Commit 14 ──
git add web/src/app/requests/RequestsTableServer.tsx web/src/app/requests/RequestsTableSkeleton.tsx web/src/app/requests/page.tsx
git commit -m "feat: improve requests list with filters skeleton and table split"

── Commit 15 ──
git add web/src/app/policies/page.tsx web/src/app/policies/new/page.tsx web/src/app/policies/[id]/page.tsx
git commit -m "style: align policy pages with shared UI components"

── Commit 16 ──
git add web/src/app/policies/test/page.tsx web/src/app/policies/test/TestConsoleClient.tsx
git commit -m "style: restyle policy test console to light theme"

── Commit 17 ──
git add web/src/app/audit/page.tsx
git commit -m "feat: restyle audit page with PageHeader and segmented tabs"

── Commit 18 ──
git add web/src/app/admin/users/page.tsx
git commit -m "style: align admin users page with Card and PageHeader"

── Commit 19 ──
git add UX_GUIDE/
git commit -m "docs: add UX guide for UI and polish passes"

── Commit 20 (tylko jeśli pliki mają sensowne zmiany infra, nie UI) ──
git add web/docker-entrypoint.sh web/.env.example web/server.js
git commit -m "chore: improve docker startup and env example"

── Commit 21 (opcjonalnie, tylko jeśli zmieniony) ──
git add web/README.md
git commit -m "docs: update web README for Docker setup"

PLIKI NIE WCHODZĄCE W TEN BRANCH (zostaw unstaged / nie commituj na feat/ui-ux-pass)
- prompt/          → osobny branch docs/prompt-materials albo później
- web/AGENTS.md
- web/CLAUDE.md
- README.md w root (user robi nowe README osobno)
- screenshots/     → osobny commit po regeneracji: chore: refresh UI screenshots

Jeśli commit 20 lub 21 nie ma zmian merytorycznych (tylko whitespace), POMIŃ go.

WERYFIKACJA KOŃCOWA
git status
→ powinno być clean LUB tylko celowo pominięte pliki (prompt/, AGENTS.md, README root, screenshots)

git log --oneline main..HEAD
→ ok. 18–21 commitów, wszystkie po angielsku, bez trailerów

docker compose exec app npm run build
→ brak błędów build (jeśli Docker działa)

RAPORT DLA USERA
Na koniec wypisz:
- nazwę brancha
- listę commitów (git log --oneline main..HEAD)
- co zostało niezacommitowane i dlaczego
```

---

## Uwagi dla Ciebie (Kamil)

- Branch **`feat/ui-ux-pass`** jest bezpieczniejszy niż `UI/UX` (wielkie litery, spacje).
- Po commicie UI: `git push -u origin feat/ui-ux-pass` → PR na GitHub.
- Nowe README rób na **`main`** po merge albo na `docs/readme` — nie mieszaj z 18 commitami UI.
- Screenshoty: `cd web && npm run screenshots:docker`, potem jeden commit `chore: refresh screenshots after UI pass`.
