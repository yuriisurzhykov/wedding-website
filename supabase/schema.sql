-- Wedding site schema — run once in Supabase SQL Editor (ARCHITECTURE.md §7).

-- =============================================
-- Guest RSVPs
-- =============================================
CREATE TABLE rsvp
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    email       TEXT,
    phone       TEXT,
    attending   BOOLEAN NOT NULL,
    guest_count INT              DEFAULT 1,
    dietary     TEXT,
    message     TEXT,
    created_at  TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Photos
-- =============================================
CREATE TABLE photos
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    r2_key        TEXT NOT NULL UNIQUE,
    uploader_name TEXT,
    public_url    TEXT NOT NULL,
    size_bytes    INT,
    uploaded_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Wishes
-- =============================================
CREATE TABLE wishes
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name  TEXT NOT NULL,
    message      TEXT NOT NULL,
    photo_r2_key TEXT,
    photo_url    TEXT,
    created_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_public_read"
  ON photos FOR SELECT USING (true);

CREATE POLICY "wishes_public_read"
  ON wishes FOR SELECT USING (true);

-- Writes: only via service_role in API Routes (no INSERT policies for anon).

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_photos_uploaded_at ON photos (uploaded_at DESC);
CREATE INDEX idx_wishes_created_at ON wishes (created_at DESC);
CREATE INDEX idx_rsvp_created_at ON rsvp (created_at DESC);
CREATE INDEX idx_rsvp_attending ON rsvp (attending);
