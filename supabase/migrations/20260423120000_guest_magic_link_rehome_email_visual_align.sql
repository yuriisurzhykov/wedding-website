-- Rehome magic-link email: same visual shell and typography as guest RSVP confirmation,
-- card body only uses existing placeholders (no summary / when_where / extras).

UPDATE email_templates
SET body_html = $html_en$
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
<title>{{subject}}</title>
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
<td style="padding:48px 36px 64px 36px;">

<h1 style="margin:0 0 20px 0;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#404040;letter-spacing:0.03em;line-height:1.25;">
{{greeting_html}}
</h1>

<p style="margin:0 0 16px 0;text-align:left;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.65;color:#70645C;font-weight:300;">
{{lead}}
</p>

{{magic_link_html}}

<p style="margin:40px 0 0 0;padding:0 8px 12px 8px;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:34px;line-height:1.4;color:#404040;white-space:pre-line;mso-line-height-rule:exactly;-webkit-text-size-adjust:100%;">
{{sign_off_html}}
</p>

</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>
$html_en$
WHERE slug = 'guest-magic-link-rehome-en';

UPDATE email_templates
SET body_html = $html_ru$
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
<title>{{subject}}</title>
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
<td style="padding:48px 36px 64px 36px;">

<h1 style="margin:0 0 20px 0;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#404040;letter-spacing:0.03em;line-height:1.25;">
{{greeting_html}}
</h1>

<p style="margin:0 0 16px 0;text-align:left;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.65;color:#70645C;font-weight:300;">
{{lead}}
</p>

{{magic_link_html}}

<p style="margin:40px 0 0 0;padding:0 8px 12px 8px;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:34px;line-height:1.4;color:#404040;white-space:pre-line;mso-line-height-rule:exactly;-webkit-text-size-adjust:100%;">
{{sign_off_html}}
</p>

</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>
$html_ru$
WHERE slug = 'guest-magic-link-rehome-ru';
