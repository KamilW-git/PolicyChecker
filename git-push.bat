git add docker-compose.yml .gitignore web/package.json web/package-lock.json web/tsconfig.json web/next.config.ts web/server.js web/postcss.config.mjs web/components.json web/.gitignore
git commit -m "chore: initialize project structure and docker environment"

git add web/src/app/globals.css web/src/app/layout.tsx web/src/app/page.tsx web/src/lib/utils.ts web/src/lib/prisma.ts
git commit -m "feat: implement main layout and dashboard ui"

git add web/src/app/requests
git commit -m "feat: build request submission form and details view"

git add web/src/app/policies web/src/lib/engine.ts
git commit -m "feat: develop dynamic policy rule engine and policies UI"

git add .
git commit -m "chore: add remaining configuration files and assets"

git branch -M main
git push -u origin main
