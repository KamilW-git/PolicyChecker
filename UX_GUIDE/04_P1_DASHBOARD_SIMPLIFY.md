# Zadanie 04 — P1: Uproszczenie pulpitu

## Prompt dla Antigravity (wklej całość)

```
Kontekst: PolicyChecker dashboard web/src/app/page.tsx — zbyt wiele kolorowych kart jak panel Grafana. Uprość w stylu Apple: mniej liczb, więcej akcji.

Zadanie P1 — dashboard:

1. Sekcja powitania (PageHeader):
   - "Dzień dobry, {user.name}" + krótki podtytuł zależny od roli (1 zdanie po polsku)

2. Dla REVIEWER / ADMIN — sekcja "Wymaga uwagi" (priorytet):
   - Pobierz max 5 wniosków: status IN_REVIEW, orderBy updatedAt asc
   - Lista: tytuł, dostawca, StatusBadge, link "Otwórz"
   - Jeśli pusto: empty state "Brak wniosków w recenzji" + link do /requests

3. Dla REQUESTER — sekcja "Twoje otwarte wnioski":
   - Max 5: status IN_REVIEW | NEEDS_INFORMATION | DRAFT
   - CTA: NEEDS_INFORMATION → "Uzupełnij"

4. Metryki — zwijane:
   - Pokaż tylko 3 karty: Oczekujące | Zatwierdzone auto | Do uzupełnienia
   - Reszta (wszystkie wnioski, polityki, średni czas, top reguły) pod przyciskiem "Pokaż więcej statystyk" (client toggle lub details/summary HTML)

5. Usuń font-bold text-4xl w 7 kolorach — użyj Card + umiarkowaną typografię (text-3xl font-semibold text-slate-900)

Kryteria akceptacji:
- Pierwszy ekran po zalogowaniu pokazuje co robić, nie tylko liczby
- Zapytania Prisma wydajne (take: 5, select minimalny)
- Bez zmian w routingu
```

## Pliki

- `web/src/app/page.tsx`
- opcjonalnie `web/src/components/DashboardAttentionList.tsx`
