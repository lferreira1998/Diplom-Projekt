# Diplom-Projekt — Claude Instructions

## Deployment

The live site is at: **https://lferreira1998.github.io/Diplom-Projekt/new**

GitHub Pages serves from the **`gh-pages` branch** (pre-built files), NOT from GitHub Actions artifacts and NOT from any feature branch directly.

### Every time you make changes:

1. Make and commit changes on the feature branch (e.g. `claude/add-correction-page-RZqTR`)
2. Build the project:
   ```bash
   VITE_SUPABASE_URL=https://lrppyiremhutnwtdhogt.supabase.co \
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHB5aXJlbWh1dG53dGRob2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjgyMjUsImV4cCI6MjA5MzA0NDIyNX0.hetcvdF-C2HpaqbuWcy16GcuGsRtsZ8CZzh7-EHfTX4 \
   npm run build
   ```
   (Run `npm install && npm install @supabase/supabase-js` first if node_modules is missing)
3. Copy dist to a temp location, switch to `gh-pages`, replace files, commit and push:
   ```bash
   cp -r dist /tmp/diplom-dist
   git checkout -- . && git checkout gh-pages
   rm -rf assets favicon.svg index.html videos 404.html
   cp -r /tmp/diplom-dist/. .
   git add -A
   git commit -m "Deploy: <short description>"
   git push origin gh-pages
   git checkout -   # switch back to feature branch
   ```

### Do NOT:
- Push only to the feature branch and assume the site updates
- Rely on the GitHub Actions workflow alone (it may or may not be configured correctly)
- Push `node_modules/` or `dist/` folder to `gh-pages`

## Stack

- Vite + React 18 + TypeScript
- React Router v7 (basename: `/Diplom-Projekt`)
- Tailwind CSS v4
- Supabase (storage for saved tools)
- motion (Framer Motion v12)

## Dev

```bash
npm install && npm install @supabase/supabase-js
npm run dev
```
