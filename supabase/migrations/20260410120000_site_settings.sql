-- Site-wide settings: single row (id = default), public read, writes only via service_role (bypasses RLS).
-- Capabilities and schedule_program mirror code defaults in @entities/site-features and day-program.ts.

CREATE TABLE site_settings
(
    id                TEXT PRIMARY KEY     DEFAULT 'default' CHECK (id = 'default'),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    capabilities      JSONB       NOT NULL,
    schedule_program  JSONB       NOT NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public snapshot for the wedding site (no secrets in this row).
CREATE POLICY site_settings_select_public
    ON site_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated — API uses service_role only.

GRANT SELECT ON site_settings TO anon, authenticated;

CREATE OR REPLACE FUNCTION site_settings_set_updated_at()
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

CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE
    ON site_settings
    FOR EACH ROW
    EXECUTE PROCEDURE site_settings_set_updated_at();

-- Seed: default capabilities (all on) + schedule from DAY_PROGRAM_TIMELINE (day-program.ts).
INSERT INTO site_settings (id, capabilities, schedule_program)
VALUES (
    'default',
    '{
      "ourStory": true,
      "scheduleSection": true,
      "rsvp": true,
      "galleryUpload": true,
      "wishSubmit": true,
      "galleryPhotoDelete": true,
      "wishPhotoAttach": true
    }'::jsonb,
    '[
      {
        "id": "gathering",
        "iconId": "gathering",
        "hour": 14,
        "minute": 0,
        "titleKey": "schedule.items.gathering.title",
        "descKey": "schedule.items.gathering.desc",
        "location": "WGBC Battle Ground — welcome area",
        "locationUrl": "https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z"
      },
      {
        "id": "ceremony",
        "iconId": "ceremony",
        "hour": 15,
        "minute": 0,
        "titleKey": "schedule.items.ceremony.title",
        "descKey": "schedule.items.ceremony.desc",
        "location": "WGBC Battle Ground — ceremony",
        "locationUrl": "https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z"
      },
      {
        "id": "reception",
        "iconId": "reception",
        "hour": 17,
        "minute": 0,
        "titleKey": "schedule.items.reception.title",
        "descKey": "schedule.items.reception.desc",
        "location": "WGBC Battle Ground — reception",
        "locationUrl": "https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z"
      },
      {
        "id": "dinner",
        "iconId": "dinner",
        "hour": 18,
        "minute": 0,
        "titleKey": "schedule.items.dinner.title",
        "descKey": "schedule.items.dinner.desc",
        "location": "WGBC Battle Ground — celebration",
        "locationUrl": "https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z"
      }
    ]'::jsonb
);
