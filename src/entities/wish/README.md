# entity: wish

Types and mappers for the `wishes` table. Used by `@features/wish-submit`, `@features/wish-list`, and
`@widgets/wishes-section`.

`guest_account_id` is set when the wish is submitted with a guest session; the public `WishView` omits it.
