# Zadanie 09 — P3: Feedback — toasty i stany ładowania

## Prompt dla Antigravity (wklej całość)

```
Kontekst: Po akcjach (komentarz, upload, submit) brak widocznego feedbacku. Dodaj lekki UX polish.

Zadanie P3 — feedback:

1. Zainstaluj sonner LUB zrób minimalny Toast.tsx (preferuj sonner jeśli OK z zależnością):
   - Provider w layout.tsx
   - Po udanym addComment — nie ma redirect, dodaj revalidate już jest; w formularzu komentarza użyj useFormStatus + toast "Komentarz dodany" (wymaga małego client wrappera CommentForm.tsx)

2. Dla upload załącznika — po submit pokaż toast "Plik wgrany" (server action redirect może uniemożliwić — rozważ useActionState w client form)

3. Opcjonalnie: skeleton w requests/page.tsx — prosty div animate-pulse w miejscu tabeli gdy loading (Next.js streaming — Suspense boundary wokół tabeli)

4. Przyciski submit: disabled + spinner (animate-spin h-4 w-4) gdy pending

Nie over-engineeruj — max 2-3 miejsca z toastami (komentarz, upload, opcjonalnie zapis szkicu).

Kryteria akceptacji:
- Użytkownik dostaje potwierdzenie po komentarzu
- Brak błędów hydratacji React
```

## Pliki

- `web/src/app/layout.tsx`
- `web/src/app/requests/[id]/page.tsx` (wydziel CommentForm client)
- opcjonalnie `web/src/components/ui/Toast.tsx`
