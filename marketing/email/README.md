# FORya partnership emails

Two versions, same design:

- `forya-partner-brands.html`: for brands, inviting them to bring their catalogue onto FORya.
- `forya-partner-creators.html`: for influencers and creators with their own label.

## Merge fields

| Field | Example |
|---|---|
| `{{first_name}}` | Sophie |
| `{{brand_name}}` | Their brand or label |
| `{{sender_name}}` | Zaryab |
| `{{sender_title}}` | Co-founder |
| `{{reply_email}}` | The address replies should go to (also used by the buttons) |
| `{{unsubscribe_url}}` | Your sending tool's unsubscribe link |

If your tool uses a different syntax (Mailchimp `*|FNAME|*`, Brevo `{{ contact.FIRSTNAME }}`),
find-and-replace these before importing. The subject line and the preheader (the preview
text in the inbox) are in the `<title>` and the hidden block at the top of `<body>`.

## Images

They load from `https://forya.onrender.com/email/…` (files in `frontend/public/email/`).
Don't move or rename those files while emails are out. If you change domain, update `HOST`
in `build.cjs` and rebuild.

## Sending

- Mailchimp, Brevo, HubSpot, Klaviyo: create a campaign → "Code your own" / "Paste HTML".
- Gmail or Outlook one-to-one: these don't accept pasted HTML. Open the file in a browser,
  select all, copy and paste into a new message; or use a tool such as GMass / Mailmeteor.
- Send a test to yourself (Gmail and Outlook) before each batch.

## Rebuilding

`node marketing/email/build.cjs` re-renders the graphics, both templates and the previews.
