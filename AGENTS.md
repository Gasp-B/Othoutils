# Agents – Orthoutil

## 0. Contexte du projet

Orthoutil est une application web moderne pour référencer et explorer des outils d’orthophonie (tests, grilles, questionnaires, etc.).

### Stack technique principale

- **Framework** : Next.js **16.0.3** (App Router, Turbopack)
- **UI** : React **19**, Server Components par défaut
- **Base de données** : PostgreSQL gérée par **Supabase**
- **ORM** : **Drizzle ORM**
- **Migrations** : 
  - Fichiers SQL dans `supabase/migrations`
  - Workflow **GitHub Actions** pour appliquer les migrations avec `supabase migration up`
- **Déploiement** : Vercel (build = `npm run build`, pas de migrations dans le build)
- **Langage** : TypeScript strict

---

## 1. Principes généraux

1. **Server-first**  
   - Utiliser au maximum les **React Server Components** (RSC) de Next 16.
   - Mettre `use client` uniquement pour les composants interactifs (formulaires, filtres, etc.).

2. **Séparation front / backend / DB claire**
   - Front (UI) : composants dans `app/` (App Router).
   - Backend : Route Handlers dans `app/api/**/route.ts`.
   - Base : schéma Drizzle dans `src/db/schema.ts`, logique d’accès encapsulée dans `src/db/` (ou `lib/db/`).

3. **Sécurité des clés et RLS**
   - Variables `NEXT_PUBLIC_*` : uniquement pour des infos publiques (URL Supabase, clé publishable).
   - **Clé service_role** : utilisée uniquement côté serveur (Route Handlers / Server Components), jamais dans le client.
   - RLS **non obligatoire pour l’instant** sur les tables de catalogue public (lecture via backend).  
     On activera RLS plus tard sur les tables qui contiendront des données sensibles / utilisateur.

4. **Qualité de code**
   - TypeScript strict (`"strict": true`).
   - Imports absolus via `@/…` (configurés dans `tsconfig.json`).
   - Pas de logique métier dans les composants UI : utiliser des fonctions pures dans `lib/` ou `src/services/`.

---

## 2. Agents

### 2.1. Architecture Agent

**Responsabilité :**  
Définir et maintenir la structure du projet.

**Dossiers principaux :**

- `app/`
  - `layout.tsx` : layout global
  - `page.tsx` : page d’accueil
  - `(public)/tools/` : pages catalogue public
  - `api/` : route handlers
- `src/db/`
  - `schema.ts` : schéma Drizzle (source of truth)
  - `index.ts` ou `client.ts` : initialisation du client Drizzle
- `lib/`
  - `supabaseClient.ts` : client Supabase côté serveur
  - fonctions utilitaires métiers (`tools`, `tags`, `sections`, etc.)
- `supabase/migrations/`
  - fichiers `.sql` générés ou écrits à la main pour la DB

**Règles :**

- Toute nouvelle feature doit être placée dans un dossier clair (ex : `app/(public)/tools/` plutôt que tout à la racine).
- Les accès DB devraient passer par des fonctions réutilisables (ex : `lib/tools/queries.ts`).

---

### 2.2. Database Agent (Drizzle + Supabase)

**Responsabilité :**  
Gérer le schéma, les migrations et la cohérence des données.

**Règles :**

1. **Schéma Drizzle**
   - Fichier unique : `src/db/schema.ts`.
   - Conserver une correspondance claire avec les tables Supabase (noms en snake_case ou camelCase cohérents).

2. **Migrations**
   - Les migrations SQL vivent dans `supabase/migrations`.
   - Les migrations sont appliquées via :
     - **GitHub Actions** (workflow `supabase-migrations.yml`).
     - **Supabase CLI** en local si nécessaire.
   - Ne jamais lancer de migrations dans le build Vercel.

3. **Seeds**
   - Les gros seeds JSON (comme le catalogue d’outils) doivent être :
     - soit dans des migrations SQL dédiées (`*_seed_*.sql`),
     - soit dans des scripts séparés (à exécuter manuellement), mais pas dans le code runtime.
   - Pour du JSON massif, utiliser des **dollar-quoted strings** (`$PAYLOAD$ ... $PAYLOAD$::jsonb`) pour éviter les erreurs d’échappement.

4. **RLS**
   - Par défaut, RLS **désactivé** sur les tables purement publiques (ex : `tools`, `sections`, `tags`).
   - Quand des données liées à des utilisateurs seront introduites :
     - Créer une migration dédiée RLS + policies.
     - Exemple : `user_id = auth.uid()` pour la lecture/écriture.

---

### 2.3. Backend / API Agent (Next Route Handlers)

**Responsabilité :**  
Exposer une API propre pour le front (et pour Codex s’il doit appeler des endpoints).

**Règles :**

1. **Routes API**
   - Placer les endpoints dans `app/api/**/route.ts`.
   - Utiliser les **Route Handlers** (GET/POST/PATCH/DELETE exportés).

2. **Accès Supabase**
   - Côté serveur, utiliser un client Supabase configuré avec :
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (dans les variables d’environnement serveur uniquement).
   - Encapsuler la création du client dans `lib/supabaseClient.ts`.

   Exemple de base :

   ```ts
   // lib/supabaseClient.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.SUPABASE_URL!;
   const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

   export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
