-- Normalized wedding day schedule: replaces site_settings.schedule_program (JSONB).
-- Public read for guests; writes only via service_role (same pattern as site_settings).

CREATE TABLE schedule_section
(
    id                   TEXT PRIMARY KEY     DEFAULT 'default' CHECK (id = 'default'),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    title_ru             TEXT,
    title_en             TEXT,
    subtitle_ru          TEXT,
    subtitle_en          TEXT,
    emphasis_badge_ru    TEXT,
    emphasis_badge_en    TEXT
);

CREATE TABLE schedule_items
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    sort_order       INT         NOT NULL,
    hour             SMALLINT    NOT NULL CHECK (hour >= 0 AND hour <= 23),
    minute           SMALLINT    NOT NULL CHECK (minute >= 0 AND minute <= 59),
    title_ru         TEXT        NOT NULL,
    title_en         TEXT        NOT NULL,
    desc_ru          TEXT        NOT NULL DEFAULT '',
    desc_en          TEXT        NOT NULL DEFAULT '',
    location         TEXT        NOT NULL,
    location_url     TEXT        NOT NULL,
    emphasis         BOOLEAN     NOT NULL DEFAULT false,
    icon_preset      TEXT,
    icon_svg_inline  TEXT,
    icon_url         TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT schedule_items_icon_at_most_one_nonnull CHECK (
        (CASE WHEN icon_preset IS NOT NULL THEN 1 ELSE 0 END)
            + (CASE WHEN NULLIF(btrim(icon_svg_inline), '') IS NOT NULL THEN 1 ELSE 0 END)
            + (CASE WHEN NULLIF(btrim(icon_url), '') IS NOT NULL THEN 1 ELSE 0 END)
            <= 1
        )
);

CREATE INDEX schedule_items_sort_order_idx ON schedule_items (sort_order ASC);

-- At most one highlighted timeline row (matches previous app rule).
CREATE UNIQUE INDEX schedule_items_single_emphasis_idx ON schedule_items ((1))
    WHERE emphasis = true;

ALTER TABLE schedule_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedule_section_select_public
    ON schedule_section
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY schedule_items_select_public
    ON schedule_items
    FOR SELECT
    TO anon, authenticated
    USING (true);

GRANT SELECT ON schedule_section TO anon, authenticated;
GRANT SELECT ON schedule_items TO anon, authenticated;

CREATE OR REPLACE FUNCTION schedule_section_set_updated_at()
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

CREATE OR REPLACE FUNCTION schedule_items_set_updated_at()
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

CREATE TRIGGER schedule_section_updated_at
    BEFORE UPDATE
    ON schedule_section
    FOR EACH ROW
    EXECUTE PROCEDURE schedule_section_set_updated_at();

CREATE TRIGGER schedule_items_updated_at
    BEFORE UPDATE
    ON schedule_items
    FOR EACH ROW
    EXECUTE PROCEDURE schedule_items_set_updated_at();

-- Singleton section row: nullable copy fields fall back to messages in the app when NULL.
INSERT INTO schedule_section (id)
VALUES ('default');

-- Migrate JSON rows into schedule_items; resolve former i18n keys to ru/en literals (messages snapshot).
INSERT INTO schedule_items (
    sort_order,
    hour,
    minute,
    title_ru,
    title_en,
    desc_ru,
    desc_en,
    location,
    location_url,
    emphasis,
    icon_preset
)
WITH expanded AS (
    SELECT ss.schedule_program AS prog
    FROM site_settings ss
    WHERE ss.id = 'default'
),
elements AS (
    SELECT
        t.elem,
        t.ord::int AS sort_order
    FROM expanded e,
        LATERAL jsonb_array_elements(e.prog) WITH ORDINALITY AS t(elem, ord)
),
with_raw_emphasis AS (
    SELECT
        e.*,
        CASE
            WHEN e.elem ? 'emphasis' THEN (e.elem->>'emphasis')::boolean
            WHEN e.elem->>'id' = 'ceremony' THEN true
            ELSE false
            END AS raw_emphasis
    FROM elements e
),
with_rolling AS (
    SELECT
        w.*,
        SUM(CASE WHEN w.raw_emphasis THEN 1 ELSE 0 END)
            OVER (ORDER BY w.sort_order ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rolling_emphasis
    FROM with_raw_emphasis w
),
resolved AS (
    SELECT
        w.sort_order,
        (w.elem->>'hour')::smallint AS hour,
        (w.elem->>'minute')::smallint AS minute,
        w.elem->>'location' AS location,
        coalesce(w.elem->>'locationUrl', '') AS location_url,
        w.raw_emphasis AND w.rolling_emphasis = 1 AS emphasis,
        CASE w.elem->>'iconId'
            WHEN 'gathering' THEN 'gathering'
            WHEN 'ceremony' THEN 'ceremony'
            WHEN 'reception' THEN 'reception'
            WHEN 'dinner' THEN 'dinner'
            ELSE NULL
            END AS icon_preset,
        w.elem->>'titleKey' AS title_key,
        w.elem->>'descKey' AS desc_key
    FROM with_rolling w
)
SELECT
    r.sort_order,
    r.hour,
    r.minute,
    CASE r.title_key
        WHEN 'schedule.items.gathering.title' THEN 'Сбор гостей'
        WHEN 'schedule.items.ceremony.title' THEN 'Церемония'
        WHEN 'schedule.items.reception.title' THEN 'Приём'
        WHEN 'schedule.items.dinner.title' THEN 'Ужин и общение'
        WHEN 'schedule.items.photo.title' THEN 'Совместное фото'
        ELSE coalesce(r.title_key, '')
        END AS title_ru,
    CASE r.title_key
        WHEN 'schedule.items.gathering.title' THEN 'Guest arrival'
        WHEN 'schedule.items.ceremony.title' THEN 'Ceremony'
        WHEN 'schedule.items.reception.title' THEN 'Reception'
        WHEN 'schedule.items.dinner.title' THEN 'Dinner & celebration'
        WHEN 'schedule.items.photo.title' THEN 'Group Photo'
        ELSE coalesce(r.title_key, '')
        END AS title_en,
    CASE r.desc_key
        WHEN 'schedule.items.gathering.desc' THEN
            'Встречаемся в WGBC, Battle Ground, WA. Приходите чуть заранее.'
        WHEN 'schedule.items.ceremony.desc' THEN
            'Церемония на территории центра. Просим прийти примерно за десять минут до начала.'
        WHEN 'schedule.items.reception.desc' THEN
            'Вместе перейдём в зону приёма на той же площадке.'
        WHEN 'schedule.items.dinner.desc' THEN
            'Ужин, общение, фотографии с парой (на той же площадке).'
        WHEN 'schedule.items.photo.desc' THEN 'Совместное фото с гостями.'
        ELSE coalesce(r.desc_key, '')
        END AS desc_ru,
    CASE r.desc_key
        WHEN 'schedule.items.gathering.desc' THEN
            'Meet at WGBC in Battle Ground, WA. Arrive a little early — we will greet you and head to the ceremony together.'
        WHEN 'schedule.items.ceremony.desc' THEN
            'Wedding ceremony on campus. Please arrive about ten minutes before the start.'
        WHEN 'schedule.items.reception.desc' THEN
            'We''ll move together to the reception area on the same campus.'
        WHEN 'schedule.items.dinner.desc' THEN
            'Dinner, socializing, photo with couple  — still at WGBC.'
        WHEN 'schedule.items.photo.desc' THEN 'Group photo with the guests.'
        ELSE coalesce(r.desc_key, '')
        END AS desc_en,
    coalesce(r.location, ''),
    r.location_url,
    r.emphasis,
    r.icon_preset
FROM resolved r
ORDER BY r.sort_order;

ALTER TABLE site_settings
    DROP COLUMN schedule_program;
