# Master prompt — cały UI pass (opcjonalnie)

Użyj tylko jeśli chcesz jedną sesję Antigravity. **Lepiej:** realizuj zadania 01–09 po kolei.

```
Pracujesz nad projektem PolicyChecker (folder web/, Next.js 15, Tailwind, Docker).

CEL: UI/UX pass w stylu spokojnym i harmonijnym (inspiracja Apple HIG). NIE zmieniaj logiki biznesowej, Prisma, Server Actions, silnika reguł, RBAC.

KOLEJNOŚĆ:
1. labels.ts + ludzkie etykiety statusów/decyzji/ról + naprawa białych nagłówków na jasnym tle
2. globals.css tokens + PageHeader, StatusBadge, Card
3. Szczegóły wniosku: sticky header + zakładki (Przegląd/Decyzja/Załączniki/Komentarze/Historia), jasny panel oceny zamiast ciemnego
4. Dashboard: powitanie + "Wymaga uwagi" + mniej kolorowych metryk
5. Spolszczenie copy (Manual Override → Decyzja ręczna, itd.)
6. Mobile bottom nav + active state desktop
7. Request wizard 3 kroki
8. lucide-react zamiast emoji
9. Toasty po komentarzu/upload

ZASADY:
- Język UI: polski
- Jeden kolor akcentu (#0071E3), tło #F5F5F7
- Minimalny diff, jeden commit logiczny per obszar
- Po zmianach: docker compose exec app npm run build

Przeczytaj pliki UX_GUIDE/01–09 dla szczegółów każdego kroku.
```
