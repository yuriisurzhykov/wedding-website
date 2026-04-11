-- Feature flags as rows (hidden / preview / enabled). Replaces site_settings.capabilities JSONB.
-- Public read for anon/authenticated; writes only via service_role (same model as site_settings).

CREATE TYPE site_feature_state AS ENUM ('hidden', 'preview', 'enabled');

CREATE TABLE site_feature_states
(
    feature_key TEXT PRIMARY KEY,
    state       site_feature_state NOT NULL,
    updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now()
);

ALTER TABLE site_feature_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_feature_states_select_public
    ON site_feature_states
    FOR SELECT
    TO anon, authenticated
    USING (true);

GRANT SELECT ON site_feature_states TO anon, authenticated;

CREATE OR REPLACE FUNCTION site_feature_states_set_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = public
AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER site_feature_states_updated_at
    BEFORE UPDATE
    ON site_feature_states
    FOR EACH ROW
    EXECUTE PROCEDURE site_feature_states_set_updated_at();

-- Migrate from site_settings.capabilities: true -> enabled, false -> hidden.
-- Missing keys behave like parseCapabilitiesFromDb: default true -> enabled.
INSERT INTO site_feature_states (feature_key, state)
SELECT v.feature_key,
       CASE
           WHEN COALESCE((ss.capabilities ->> v.feature_key)::boolean, true) THEN 'enabled'::site_feature_state
           ELSE 'hidden'::site_feature_state
           END
FROM site_settings ss
         CROSS JOIN (VALUES ('ourStory'),
                            ('scheduleSection'),
                            ('rsvp'),
                            ('galleryUpload'),
                            ('wishSubmit'),
                            ('galleryPhotoDelete'),
                            ('wishPhotoAttach')) AS v (feature_key)
WHERE ss.id = 'default';

ALTER TABLE site_settings
    DROP COLUMN capabilities;
