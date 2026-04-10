# Entity: `guest-viewer`

## Role

Single **domain contract** for “who the guest is” and **which RSVP facts** the browser may use for UI and client-side
hints after a validated guest session.

- **Not** the HTTP session (cookie, token hash) — that stays in `@features/guest-session`.
- **Not** a substitute for server checks: APIs load RSVP / session from the database and enforce invariants.

## Public API

| Export                     | Meaning                                                                                                                                          |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `GuestViewerSnapshot`      | `displayName`, optional `emailMasked`, `attending` (extend here when new **policy-relevant** RSVP fields are needed — keep the surface minimal). |
| `buildGuestViewerSnapshot` | Maps normalized RSVP name/email + `attending` into a snapshot (no secrets).                                                                      |
| `maskEmailForDisplay`      | Shared mask helper used when building the snapshot.                                                                                              |

## Import direction

- **Entities** `@entities/rsvp` supplies row shape; this slice defines the **redacted view** for the app shell.
- **Features** (`guest-session`, `rsvp-submit`) call `buildGuestViewerSnapshot` / alias builders when emitting JSON
  after validation.

## Extending

Add a field to `GuestViewerSnapshot` only when product policy needs it on the client **and** it is safe to expose (
compare with server-side RSVP load). Document the field in this README and in `@features/guest-session/README.md` §4.
