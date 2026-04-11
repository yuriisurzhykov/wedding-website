-- Browsing the shared gallery is gated by `galleryBrowse` (separate from `galleryUpload`).
INSERT INTO site_feature_states (feature_key, state)
VALUES ('galleryBrowse', 'enabled'::site_feature_state)
ON CONFLICT (feature_key) DO NOTHING;
