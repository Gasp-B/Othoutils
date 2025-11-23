# Migration rollout: status metadata then status-aware RLS

This plan documents the two-part rollout required to support publication states and moderation metadata.

## 1) Status metadata + backfill (must run first)
- **Goal:** Normalize status values to `draft`/`published`/`archived` while adding `validated_by`, `validated_at`, and `created_by` for `tools_catalog`, `tools`, and `tests`.
- **Changes:**
  - Drop legacy `status` constraints, set default to `draft`, and reintroduce a check constraint for the normalized enum.
  - Backfill legacy values to the new statuses (e.g., `Validé` → `published`, `En cours de revue`/`Communauté` → `draft`).
  - Add the validator/creator metadata columns and keep them nullable to preserve existing rows.
- **Notes:** Use a single Drizzle-generated migration to ensure constraint changes, defaults, and backfill occur atomically. This migration unblocks the status-based policies in step 2.

## 2) Status-based RLS (must run second)
- **Goal:** Gate visibility on `status`, allowing anyone to read `published` rows while restricting drafts/archived content and all writes to moderators (`role` = `admin` or `editor`) or the service role.
- **Changes:**
  - Create helper functions `is_admin_or_editor()` and `has_moderation_access()` that leverage JWT roles.
  - Add `can_view_status(target_status text)` to encapsulate published visibility checks.
  - Apply SELECT + ALL policies on tools, tests, catalog, and their translation/junction tables using the helpers.
- **Notes:** This migration depends on the normalized status enum and metadata columns introduced in step 1.

## Execution order and CI
- Name the migrations so the status/metadata migration timestamp is **earlier** than the RLS migration (e.g., `20250709120000_add_status_and_validation_metadata.sql` then `20250710120000_status_based_rls.sql`). Supabase CLI applies files lexicographically, so the timestamps enforce the correct ordering.
- The GitHub Action (`.github/workflows/supabase-migrations.yml`) already runs `supabase migration up --include-all`, which applies pending migrations in sorted order. Adding the files with the timestamps above is sufficient for CI to execute the two steps sequentially.
