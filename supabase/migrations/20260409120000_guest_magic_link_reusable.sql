-- Magic-link tokens: reusable for session restore until expires_at (no longer gated by used_at).
-- Legacy rows may still have used_at set from the previous one-time model; application code ignores it.

COMMENT ON COLUMN guest_magic_link_tokens.used_at IS
    'Legacy: was set on first successful claim when links were one-time. Claim no longer updates this column; validity is expires_at only.';
