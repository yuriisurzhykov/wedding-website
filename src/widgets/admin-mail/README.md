# Widget: admin-mail

Admin UI for inbound contact mail: mailbox list, message detail with sandboxed HTML, reply composer with live preview, reply-template CRUD, and Resend webhook status with manual sync.

## Purpose

- Gives authenticated admins a two-pane inbox (`/admin/mail`, `/admin/mail/[id]`) backed by `/api/admin/mail/*`.
- Provides `/admin/mail/templates` for managing `reply_templates` rows used when sending replies.

## Approach

- **Server components** load initial data via `@features/admin-inbox`, `@features/admin-reply-templates`, `@features/resend-webhook-subscription`, and `@features/site-settings` (no secrets in the client bundle).
- **Client islands** call the same JSON routes with `credentials: 'include'` for pagination, status changes, sends, template CRUD, and webhook sync.
- **Inbound HTML** is shown in an `iframe` with `sandbox=""` and DOMPurify-sanitized `srcDoc`. **Reply preview** reuses `renderReplyEmailHtml` so the preview matches the transactional layout.
- **Auto-sync**: `AdminMailInboxChrome` best-effort calls `syncResendInboundWebhook` when the public contact email or webhook id is out of date (non-blocking).

## Public API

- `AdminMailInboxChrome` — wraps mail routes with title, templates link, webhook banner, and auto-sync.
- `AdminMailListSection` — left column list (server + client pagination).
- `AdminMailDetailEmpty` — right-pane placeholder on `/admin/mail`.
- `AdminMailDetailSection` — loads one message and attachments for `/admin/mail/[id]`.
- `AdminReplyTemplatesSection` — full templates manager page body.

## Usage

```tsx
// app/[locale]/admin/(dashboard)/mail/layout.tsx
import {AdminMailInboxChrome} from '@widgets/admin-mail';

export default async function MailLayout({children}: {children: React.ReactNode}) {
    return <AdminMailInboxChrome>{children}</AdminMailInboxChrome>;
}
```

## Errors & edge cases

- List/detail/template loads show translated error states when feature calls fail.
- Webhook status fetch failure shows a red alert; signing secret is never exposed in the UI.
- Delete message uses `window.confirm`; destructive actions toast on failure.

## Configuration

- Copy and labels live under `messages/*/admin.mail.*` (next-intl).
