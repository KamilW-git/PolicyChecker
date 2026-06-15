# Zadanie 06 — P2: Nawigacja mobilna

## Prompt dla Antigravity (wklej całość)

```
Kontekst: PolicyChecker layout.tsx — nav ma hidden md:flex, na mobile brak menu.

Zadanie P2 — mobile navigation:

1. Utwórz web/src/components/MobileNav.tsx ('use client'):
   - Poniżej md: dolny pasek (fixed bottom) z 3–4 linkami: Pulpit (/), Wnioski (/requests), Polityki (/policies), opcjonalnie Audyt (jeśli rola)
   - Ikony + krótki label (lucide-react: Home, FileText, Shield, ClipboardList)
   - Aktywny stan: kolor accent
   - padding-bottom na main żeby treść nie chowała się pod paskiem (pb-20 md:pb-8)

2. Desktop (md+): zostaw górny nav, dodaj active state na Link (pathname === href → bg-white/10 lub border-b)

3. Użyj usePathname z next/navigation w osobnym client wrapper NavBar.tsx jeśli layout jest server component.

4. Przycisk wylogowania: zamień samo "✕" na "Wyloguj" (text-sm) na desktop; na mobile w menu użytkownika lub ikona + aria-label.

Kryteria akceptacji:
- Na szerokości 375px wszystkie główne sekcje dostępne
- Brak regresji desktop
- layout.tsx pozostaje async server component — logika sesji bez zmian
```

## Pliki

- `web/src/components/MobileNav.tsx`
- `web/src/components/NavBar.tsx` (opcjonalnie)
- `web/src/app/layout.tsx`
