-- Suppression des tables liées aux "tools" (outils communautaires et catalogue distinct)
-- On garde 'tests' et 'validation_status'.

DROP POLICY IF EXISTS "tools_translations_select_by_role" ON public.tools_translations;
DROP POLICY IF EXISTS "tools_translations_manage_by_moderators" ON public.tools_translations;
DROP POLICY IF EXISTS "tools_catalog_translations_select_by_role" ON public.tools_catalog_translations;
DROP POLICY IF EXISTS "tools_catalog_translations_manage_by_moderators" ON public.tools_catalog_translations;
DROP POLICY IF EXISTS "tools_select_by_role" ON public.tools;
DROP POLICY IF EXISTS "tools_manage_by_moderators" ON public.tools;
DROP POLICY IF EXISTS "tools_catalog_select_by_role" ON public.tools_catalog;
DROP POLICY IF EXISTS "tools_catalog_manage_by_moderators" ON public.tools_catalog;

DROP TABLE IF EXISTS public.tools_translations;
DROP TABLE IF EXISTS public.tools_catalog_translations;
DROP TABLE IF EXISTS public.tools;
DROP TABLE IF EXISTS public.tools_catalog;