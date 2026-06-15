# Zadanie 05 — P1: Spolszczenie i spójność copy

## Prompt dla Antigravity (wklej całość)

```
Kontekst: PolicyChecker — w UI jest mieszanka polskiego i angielskiego. Ujednolić na polski (terminy biznesowe mogą zostać w nawiasie).

Zadanie P1 — copy PL:

Przeszukaj web/src/app i web/src/components i zamień widoczne dla użytkownika stringi:

| Było | Ma być |
|------|--------|
| Manual Override | Decyzja ręczna |
| Policy Checker | Ocena polityk |
| INTERNAL (badge) | Wewnętrzny |
| Approved By | Zatwierdził |
| System Decision | Decyzja systemu |
| Override Status | Status po decyzji |
| New Decision | Nowa decyzja |
| Reason / Comment | Powód / Komentarz |
| Submit / Filter labels EN | już PL lub popraw |

Pliki priorytetowe:
- ManualOverrideModal.tsx
- requests/[id]/page.tsx (sekcja override)
- policies/test/TestConsoleClient.tsx (nagłówki)
- RuleBuilder.tsx (jeśli są EN etykiety przy efektach)

metadata w layout.tsx: title "PolicyChecker" (usuń "MVP" z title jeśli jest)

Kryteria akceptacji:
- Przeglądarka zakładek nie pokazuje "PolicyChecker MVP" jeśli niepotrzebne
- Modal override w pełni po polsku
- Nie zmieniaj nazw enum w bazie ani API — tylko warstwa prezentacji
```

## Pliki

- `web/src/app/layout.tsx`
- `web/src/app/requests/[id]/ManualOverrideModal.tsx`
- `web/src/app/requests/[id]/page.tsx`
- `web/src/app/policies/test/TestConsoleClient.tsx`
