# CloudCertPrep Email Templates

HTML email templates for Supabase transactional emails. Sent from `alex@cloudcertprep.io` via Brevo SMTP.

---

## Templates

| File | Supabase Template | When Sent |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | User registers with email/password |
| `reset-password.html` | **Reset Password** | User requests password reset |
| `magic-link.html` | **Magic Link** | User requests passwordless sign-in |
| `email-change.html` | **Change Email Address** | User updates their email address |

---

## How to Apply in Supabase

1. Go to **Supabase Dashboard** → your project → **Authentication** → **Email Templates**
2. Select the template to edit
3. Copy the full HTML from the corresponding file here
4. Paste it into the **Body** field
5. Update the **Subject line** (see below)
6. Click **Save**

### Subject Lines

| Template | Subject |
|---|---|
| Confirm signup | `Confirm your CloudCertPrep account` |
| Reset Password | `Reset your CloudCertPrep password` |
| Magic Link | `Your CloudCertPrep sign-in link` |
| Change Email Address | `Confirm your new CloudCertPrep email address` |

---

## Supabase Template Variables Used

| Variable | Description |
|---|---|
| `{{ .ConfirmationURL }}` | Full action URL with token (confirmation, reset, magic link) |
| `{{ .SiteURL }}` | Configured site URL (`https://www.cloudcertprep.io`) — set in Auth → URL Configuration |
| `{{ .NewEmail }}` | New email address (email-change template only) |

---

## Design Notes

- Dark theme matching the app: `#0F1923` background, `#1A2332` card, `#FF9900` orange
- Table-based layout for maximum email client compatibility (Gmail, Apple Mail, Outlook, iOS, Android)
- All styles are inline — no external CSS
- Logo pulls from `https://www.cloudcertprep.io/logo-email.png` (works in all modern clients; ignored in Outlook 2007/2010)
- Font: system font stack matching the app (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial`)
- Max width: 580px

---

## Supabase Site URL Configuration

Make sure **Authentication → URL Configuration → Site URL** is set to:
```
https://www.cloudcertprep.io
```

And **Redirect URLs** includes:
```
https://www.cloudcertprep.io/**
```

This ensures `{{ .SiteURL }}` resolves correctly and reset/confirm links redirect back to the right place.
