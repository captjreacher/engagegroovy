# Contact Form Configuration

The production site uses **FormSubmit** for contact form submissions.

## FormSubmit Endpoint

**Activation Hash:** `b3b8fa08e07860d7b35ea92e3681b10b`

**Form Action URL:**
```
https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b
```

## Required Form Configuration

The contact.html form should have:

```html
<form action="https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b" method="POST">
  <!-- Form fields -->
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <!-- etc -->
</form>
```

## FormSubmit Features (Optional)

You can add these hidden fields to customize behavior:

```html
<!-- Redirect after submission -->
<input type="hidden" name="_next" value="https://engagegroovy.com/thank-you.html">

<!-- Custom subject line -->
<input type="hidden" name="_subject" value="New contact form submission from EngageGroovy">

<!-- Disable reCAPTCHA -->
<input type="hidden" name="_captcha" value="false">

<!-- Template style (table, box, basic) -->
<input type="hidden" name="_template" value="table">
```

## Activation Status

⚠️ **Action Required:**

The FormSubmit endpoint needs to be activated:

1. Check the activation email sent to your address
2. Click **"Activate Form"** button
3. Verify by submitting a test form

Once activated, all submissions from `https://engagegroovy.com/contact.html` will be forwarded to your email.

## After Import

After running `npm run import:cpanel-live`, verify that `site/contact.html` contains:

```bash
grep -i "formsubmit.co" site/contact.html
```

Should show:
```
action="https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b"
```

If missing or using a different endpoint, you'll need to update it manually.

## Alternative: Backend Integration

The archived Express app in `archived-localhost-app/` has a `/api/contact/submit` endpoint with Supabase integration.

If you want to replace FormSubmit with a custom backend:

1. Deploy the Express app to a Node.js hosting service (Railway, Render, Fly.io)
2. Update contact.html form action to point to your API
3. Configure CORS to allow requests from engagegroovy.com

But for now, **FormSubmit is the production solution** - keep it as-is when importing.
