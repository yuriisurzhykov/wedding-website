-- Seed admin broadcast templates: warm welcome + shared photo gallery invite (RU + EN).
-- Site-styled layout (560px card, sage top bar, Cormorant/Lato/Great Vibes), aligned with
-- guest-rsvp-confirmation shells. Uses broadcast placeholders only: {{name}}, {{site_url}}.
-- Gallery CTA resolves at send time via {{site_url}} (getPublicSiteUrl): EN -> /gallery, RU -> /ru/gallery.

INSERT INTO email_templates (slug, name, subject_template, body_html, body_text, sender_id)
VALUES (
           'welcome-shared-gallery-ru',
           'Приглашение в общую галерею (RU)',
           'Юрий и Мария — совсем скоро',
           $html_ru$
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
<title>Юрий и Мария — совсем скоро</title>
</head>
<body style="margin:0;padding:40px 16px;background-color:#F5F0E7;font-family:'Lato',system-ui,-apple-system,sans-serif;color:#404040;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;background-color:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD4CB;box-shadow:0 10px 40px rgba(64,64,64,0.04);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background-color:#758461;">&nbsp;</td>
</tr>
<tr>
<td style="padding:48px 36px 56px 36px;">

<h1 style="margin:0 0 6px 0;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#404040;letter-spacing:0.03em;line-height:1.2;">
Юрий и Мария
</h1>

<p style="margin:0 0 8px 0;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:26px;line-height:1.3;color:#758461;">
…совсем скоро…
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:18px auto 28px auto;">
<tr>
<td style="width:56px;height:1px;line-height:1px;font-size:0;background-color:#DDD4CB;">&nbsp;</td>
<td style="padding:0 10px;">
<div style="width:6px;height:6px;border-radius:50%;background-color:#758461;line-height:6px;font-size:0;">&nbsp;</div>
</td>
<td style="width:56px;height:1px;line-height:1px;font-size:0;background-color:#DDD4CB;">&nbsp;</td>
</tr>
</table>

<p style="margin:0 0 18px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:16px;line-height:1.6;color:#404040;font-weight:400;">
Дорогие друзья,
</p>

<p style="margin:0 0 18px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.7;color:#70645C;font-weight:300;">
Мы очень рады каждому, кто будет рядом с нами в этот день, и с нетерпением ждём встречи с вами.
</p>

<p style="margin:0 0 28px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.7;color:#70645C;font-weight:300;">
А ещё на нашем сайте можно загрузить свои фотографии с церемонии в общую галерею и посмотреть снимки, которыми поделились другие гости.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto 36px auto;">
<tr>
<td align="center" style="border-radius:4px;background-color:#758461;">
<a href="{{site_url}}/ru/gallery" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Lato',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:4px;">
Открыть галерею
</a>
</td>
</tr>
</table>

<p style="margin:0;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:34px;line-height:1.4;color:#404040;white-space:pre-line;mso-line-height-rule:exactly;-webkit-text-size-adjust:100%;">
С любовью,
Юрий и Мария
</p>

</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>
$html_ru$,
           $text_ru$Юрий и Мария — совсем скоро

Дорогие друзья,

Мы очень рады каждому, кто будет рядом с нами в этот день, и с нетерпением ждём встречи с вами.

А ещё на нашем сайте можно загрузить свои фотографии в общую галерею и посмотреть снимки, которыми поделились другие гости:
{{site_url}}/ru/gallery

С любовью,
Юрий и Мария
$text_ru$,
           NULL
       )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO email_templates (slug, name, subject_template, body_html, body_text, sender_id)
VALUES (
           'welcome-shared-gallery-en',
           'Shared gallery invite (EN)',
           'Yurii & Mariia — see you soon',
           $html_en$
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
<title>Yurii &amp; Mariia — see you soon</title>
</head>
<body style="margin:0;padding:40px 16px;background-color:#F5F0E7;font-family:'Lato',system-ui,-apple-system,sans-serif;color:#404040;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;background-color:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD4CB;box-shadow:0 10px 40px rgba(64,64,64,0.04);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background-color:#758461;">&nbsp;</td>
</tr>
<tr>
<td style="padding:48px 36px 56px 36px;">

<h1 style="margin:0 0 6px 0;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#404040;letter-spacing:0.03em;line-height:1.2;">
Yurii &amp; Mariia
</h1>

<p style="margin:0 0 8px 0;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:26px;line-height:1.3;color:#758461;">
…the day is near…
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:18px auto 28px auto;">
<tr>
<td style="width:56px;height:1px;line-height:1px;font-size:0;background-color:#DDD4CB;">&nbsp;</td>
<td style="padding:0 10px;">
<div style="width:6px;height:6px;border-radius:50%;background-color:#758461;line-height:6px;font-size:0;">&nbsp;</div>
</td>
<td style="width:56px;height:1px;line-height:1px;font-size:0;background-color:#DDD4CB;">&nbsp;</td>
</tr>
</table>

<p style="margin:0 0 18px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:16px;line-height:1.6;color:#404040;font-weight:400;">
Dear friends,
</p>

<p style="margin:0 0 18px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.7;color:#70645C;font-weight:300;">
We are so happy about everyone who will be by our side on this day, and we can&rsquo;t wait to celebrate with you.
</p>

<p style="margin:0 0 28px 0;text-align:center;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.7;color:#70645C;font-weight:300;">
On our website you can also upload your own photos from the ceremony to a shared gallery and browse the pictures other guests have shared.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto 36px auto;">
<tr>
<td align="center" style="border-radius:4px;background-color:#758461;">
<a href="{{site_url}}/gallery" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Lato',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:4px;">
Open the gallery
</a>
</td>
</tr>
</table>

<p style="margin:0;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:34px;line-height:1.4;color:#404040;white-space:pre-line;mso-line-height-rule:exactly;-webkit-text-size-adjust:100%;">
With love,
Yurii &amp; Mariia
</p>

</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>
$html_en$,
           $text_en$Yurii & Mariia — see you soon

Dear friends,

We are so happy about everyone who will be by our side on this day, and we can't wait to celebrate with you.

On our website you can also upload your own photos to a shared gallery and browse the pictures other guests have shared:
{{site_url}}/gallery

With love,
Yurii & Mariia
$text_en$,
           NULL
       )
ON CONFLICT (slug) DO NOTHING;
