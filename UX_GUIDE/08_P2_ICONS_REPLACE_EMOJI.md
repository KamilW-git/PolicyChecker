# Zadanie 08 — P2: Ikony zamiast emoji

## Prompt dla Antigravity (wklej całość)

```
Kontekst: W UI są emoji (✓, ⚠️, 📄, 🛡️) — zastąp spójnymi ikonami.

Zadanie P2 — ikony:

1. Dodaj lucide-react do web/package.json (jeśli brak): npm install lucide-react --legacy-peer-deps w kontenerze

2. Zamień emoji na ikony (stroke 1.5, size 20, text-slate-500):
   - layout.tsx logo: ShieldCheck lub CheckCircle2 zamiast ✓
   - login page: ten sam symbol
   - requests/[id]/page.tsx: AlertTriangle (needs info), FileText (załącznik), Shield (audit)
   - Usuń emoji z przycisków i nagłówków

3. Nie przesadzaj z kolorami ikon — primary slate-600, semantic amber/red/green tylko w kontekście statusu

Kryteria akceptacji:
- Brak emoji w web/src/app i web/src/components (grep nie znajduje ⚠️📄✓🛡️ w TSX)
- Wygląd spójny na login, nav, szczegóły wniosku
```

## Pliki

- `web/package.json`
- `web/src/app/layout.tsx`, `login/page.tsx`, `requests/[id]/page.tsx`, inne z emoji
