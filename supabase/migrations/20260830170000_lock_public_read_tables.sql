-- Close direct anon/authenticated PostgREST access to `photos` and `wishes`.
--
-- These tables previously had permissive `USING (true)` SELECT policies, intended for a
-- browser client that read them directly with the anon key. The app no longer does that —
-- all reads go through `/api/gallery/photos` and `/api/wishes`, which use service_role
-- (see @features/gallery-list, @features/wish-list). Left open, the tables were reachable by
-- anyone on the internet via `https://<project>.supabase.co/rest/v1/{photos,wishes}` with the
-- public anon key, bypassing app-level rate limiting and the `limit`/`offset` validation in
-- those routes — a likely source of `plan_filter.statement_cost_limit` hits from anon-role
-- PostgREST scans.
--
-- Same posture as `email_senders` / `email_templates` / `email_send_log`: RLS enabled, no
-- anon/authenticated policies, service_role only.

DROP POLICY IF EXISTS "photos_public_read" ON photos;
DROP POLICY IF EXISTS "wishes_public_read" ON wishes;

REVOKE SELECT ON photos FROM anon, authenticated;
REVOKE SELECT ON wishes FROM anon, authenticated;
