-- Link gallery photos to RSVP rows for "my uploads" / delete-own flows (guest account phase 2).
-- Existing rows keep rsvp_id NULL; feed remains public SELECT (see schema.sql RLS).

ALTER TABLE photos
  ADD COLUMN rsvp_id UUID REFERENCES rsvp (id) ON DELETE SET NULL;

CREATE INDEX idx_photos_rsvp_id ON photos (rsvp_id) WHERE rsvp_id IS NOT NULL;
