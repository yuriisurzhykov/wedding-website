-- Link wishes to party member when submitted with a guest session (author + optional photo ownership).
ALTER TABLE wishes
    ADD COLUMN guest_account_id UUID REFERENCES guest_accounts (id) ON DELETE SET NULL;

CREATE INDEX idx_wishes_guest_account_id ON wishes (guest_account_id)
    WHERE guest_account_id IS NOT NULL;
