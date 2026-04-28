-- Fix Supabase security warning: rls_disabled_in_public
-- Re-enable RLS and apply explicit policies for public schema tables
-- that were previously toggled off during temporary debugging.

-- ----------------------------
-- approved_users
-- ----------------------------
ALTER TABLE IF EXISTS public.approved_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approved_users NO FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.approved_users') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can view approved users" ON public.approved_users;
    DROP POLICY IF EXISTS "Admins can manage approved users" ON public.approved_users;
    DROP POLICY IF EXISTS "Superusers can manage approved users" ON public.approved_users;
    DROP POLICY IF EXISTS "approved_users_superusers_select" ON public.approved_users;
    DROP POLICY IF EXISTS "approved_users_self_select" ON public.approved_users;
    DROP POLICY IF EXISTS "approved_users_superusers_manage" ON public.approved_users;

    CREATE POLICY "approved_users_superusers_select"
      ON public.approved_users
      FOR SELECT
      TO authenticated
      USING (is_superuser());

    CREATE POLICY "approved_users_self_select"
      ON public.approved_users
      FOR SELECT
      TO authenticated
      USING (email = auth.jwt() ->> 'email');

    CREATE POLICY "approved_users_superusers_manage"
      ON public.approved_users
      FOR ALL
      TO authenticated
      USING (is_superuser())
      WITH CHECK (is_superuser());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_email_approved(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.approved_users
    WHERE lower(trim(email)) = lower(trim(email_input))
  );
END;
$$;

REVOKE ALL ON TABLE public.approved_users FROM anon;
REVOKE ALL ON TABLE public.approved_users FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approved_users TO authenticated;
REVOKE ALL ON FUNCTION public.is_email_approved(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.is_email_approved(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_approved(TEXT) TO authenticated;

-- ----------------------------
-- editor_requests
-- ----------------------------
ALTER TABLE IF EXISTS public.editor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.editor_requests FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.editor_requests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can create editor requests" ON public.editor_requests;
    DROP POLICY IF EXISTS "Allow anonymous insert" ON public.editor_requests;
    DROP POLICY IF EXISTS "Allow authenticated insert" ON public.editor_requests;
    DROP POLICY IF EXISTS "Superusers can view editor requests" ON public.editor_requests;
    DROP POLICY IF EXISTS "Superusers can update editor requests" ON public.editor_requests;
    DROP POLICY IF EXISTS "editor_requests_create_anon" ON public.editor_requests;
    DROP POLICY IF EXISTS "editor_requests_create_authenticated" ON public.editor_requests;
    DROP POLICY IF EXISTS "editor_requests_superusers_select" ON public.editor_requests;
    DROP POLICY IF EXISTS "editor_requests_superusers_manage" ON public.editor_requests;

    CREATE POLICY "editor_requests_create_anon"
      ON public.editor_requests
      FOR INSERT
      TO anon
      WITH CHECK (true);

    CREATE POLICY "editor_requests_create_authenticated"
      ON public.editor_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "editor_requests_superusers_select"
      ON public.editor_requests
      FOR SELECT
      TO authenticated
      USING (is_superuser());

    CREATE POLICY "editor_requests_superusers_manage"
      ON public.editor_requests
      FOR UPDATE
      TO authenticated
      USING (is_superuser())
      WITH CHECK (is_superuser());
  END IF;
END $$;

REVOKE ALL ON TABLE public.editor_requests FROM public;
GRANT INSERT ON TABLE public.editor_requests TO anon;
GRANT INSERT, SELECT, UPDATE ON TABLE public.editor_requests TO authenticated;

-- ----------------------------
-- lookup tables (districts, zones, clubs)
-- ----------------------------
ALTER TABLE IF EXISTS public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clubs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.districts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "districts_read_all" ON public.districts;
    CREATE POLICY "districts_read_all"
      ON public.districts
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF to_regclass('public.zones') IS NOT NULL THEN
    DROP POLICY IF EXISTS "zones_read_all" ON public.zones;
    CREATE POLICY "zones_read_all"
      ON public.zones
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF to_regclass('public.clubs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "clubs_read_all" ON public.clubs;
    CREATE POLICY "clubs_read_all"
      ON public.clubs
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
