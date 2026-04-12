-- Seed transactional guest RSVP confirmation templates (locale-specific slugs; body matches code fallback in
-- `build-guest-confirmation-email` + `buildGuestRsvpConfirmationTemplateVars` placeholders).

INSERT INTO email_templates (slug, name, subject_template, body_html, body_text, sender_id)
VALUES (
           'guest-rsvp-confirmation-en',
           'Guest RSVP confirmation (EN)',
           '{{subject}}',
           $html_en$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lato:wght@400;700&display=swap"/>
<title>{{subject}}</title>
</head>
<body style="margin:0;padding:24px;background:#FDFAF7;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;color:#2C2420;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E8DDD8;">
<tr><td style="padding:32px 28px 28px 28px;">
<p style="margin:0 0 16px 0;font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif;font-size:22px;color:#C9A69A;">{{greeting_html}}</p>
<p style="margin:0 0 12px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:16px;line-height:1.55;color:#2C2420;">{{lead}}</p>
<p style="margin:0 0 24px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:15px;line-height:1.55;color:#6B5C54;">{{summary}}</p>
<div style="padding:16px 18px;background:#F5F0E8;border-radius:8px;border:1px solid #E8DDD8;">
<p style="margin:0 0 8px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#6B5C54;">{{when_where_title}}</p>
{{when_where_body_html}}
</div>
{{extras_html}}
{{magic_link_html}}
<p style="margin:32px 0 0 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:14px;line-height:1.6;color:#6B5C54;white-space:pre-line;">{{sign_off_html}}</p>
</td></tr>
</table>
</body>
</html>
$html_en$,
           $text_en$
{{greeting_text}}

{{lead}}

{{summary}}

{{when_where_title}}
{{when_where_body_text}}
{{extras_text}}

{{magic_link_text}}

{{sign_off_text}}
$text_en$,
           NULL
       ),
       (
           'guest-rsvp-confirmation-ru',
           'Guest RSVP confirmation (RU)',
           '{{subject}}',
           $html_ru$
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lato:wght@400;700&display=swap"/>
<title>{{subject}}</title>
</head>
<body style="margin:0;padding:24px;background:#FDFAF7;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;color:#2C2420;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E8DDD8;">
<tr><td style="padding:32px 28px 28px 28px;">
<p style="margin:0 0 16px 0;font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif;font-size:22px;color:#C9A69A;">{{greeting_html}}</p>
<p style="margin:0 0 12px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:16px;line-height:1.55;color:#2C2420;">{{lead}}</p>
<p style="margin:0 0 24px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:15px;line-height:1.55;color:#6B5C54;">{{summary}}</p>
<div style="padding:16px 18px;background:#F5F0E8;border-radius:8px;border:1px solid #E8DDD8;">
<p style="margin:0 0 8px 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#6B5C54;">{{when_where_title}}</p>
{{when_where_body_html}}
</div>
{{extras_html}}
{{magic_link_html}}
<p style="margin:32px 0 0 0;font-family:'Lato', system-ui, -apple-system, Segoe UI, sans-serif;font-size:14px;line-height:1.6;color:#6B5C54;white-space:pre-line;">{{sign_off_html}}</p>
</td></tr>
</table>
</body>
</html>
$html_ru$,
           $text_ru$
{{greeting_text}}

{{lead}}

{{summary}}

{{when_where_title}}
{{when_where_body_text}}
{{extras_text}}

{{magic_link_text}}

{{sign_off_text}}
$text_ru$,
           NULL
       )
ON CONFLICT (slug) DO NOTHING;
