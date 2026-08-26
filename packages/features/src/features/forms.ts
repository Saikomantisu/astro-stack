import type { FeatureTemplate } from "../contracts.js";
import { defineFeature } from "../define-feature.js";

const contactFormTemplate: FeatureTemplate = {
  destination: "src/components/ContactForm.astro",
  content:
    '---\nconst endpoint = "/api/contact";\n---\n\n<form action={endpoint} method="post" data-contact-form>\n  <p>\n    <label>\n      Name (optional)\n      <input name="name" autocomplete="name" />\n    </label>\n  </p>\n  <p>\n    <label>\n      Email\n      <input name="email" type="email" autocomplete="email" required />\n    </label>\n  </p>\n  <p>\n    <label>\n      Message\n      <textarea name="message" rows="6" required></textarea>\n    </label>\n  </p>\n  <button type="submit">Send message</button>\n  <p aria-live="polite" data-contact-status></p>\n</form>\n\n<script>\n  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");\n  const status = document.querySelector<HTMLElement>("[data-contact-status]");\n\n  form?.addEventListener("submit", async (event) => {\n    event.preventDefault();\n    if (!status) return;\n    status.textContent = "Sending…";\n\n    try {\n      const response = await fetch(form.action, {\n        method: "POST",\n        body: new FormData(form),\n        headers: { Accept: "application/json" },\n      });\n      if (!response.ok) throw new Error("Unable to send the message.");\n      form.reset();\n      status.textContent = "Thanks — your message has been sent.";\n    } catch {\n      status.textContent = "Unable to send your message. Please try again.";\n    }\n  });\n</script>\n',
};

const resendRoute: FeatureTemplate = {
  destination: "src/pages/api/contact.ts",
  content: `import type { APIRoute } from "astro";\nimport { Resend } from "resend";\n\nconst value = (formData: FormData, key: string): string => {\n  const entry = formData.get(key);\n  return typeof entry === "string" ? entry.trim() : "";\n};\n\nexport const POST: APIRoute = async ({ request }) => {\n  const formData = await request.formData();\n  const name = value(formData, "name");\n  const email = value(formData, "email");\n  const message = value(formData, "message");\n\n  if (!email || !message)\n    return new Response(JSON.stringify({ error: "Email and message are required." }), {\n      status: 400,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const apiKey = import.meta.env.RESEND_API_KEY;\n  const from = import.meta.env.RESEND_FROM_EMAIL;\n  const to = import.meta.env.RESEND_TO_EMAIL;\n  if (!apiKey || !from || !to)\n    return new Response(JSON.stringify({ error: "Email delivery is not configured." }), {\n      status: 500,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const { error } = await new Resend(apiKey).emails.send({\n    from,\n    to: [to],\n    subject: \`New contact form message from \${name || email}\`,\n    replyTo: email,\n    text: \`Name: \${name || "Not provided"}\\nEmail: \${email}\\n\\n\${message}\`,\n  });\n  if (error)\n    return new Response(JSON.stringify({ error: "Unable to send the message." }), {\n      status: 502,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  return new Response(JSON.stringify({ ok: true }), {\n    status: 200,\n    headers: { "Content-Type": "application/json" },\n  });\n};\n`,
};

const webhookRoute: FeatureTemplate = {
  destination: "src/pages/api/contact.ts",
  content:
    'import type { APIRoute } from "astro";\n\nconst value = (formData: FormData, key: string): string => {\n  const entry = formData.get(key);\n  return typeof entry === "string" ? entry.trim() : "";\n};\n\nexport const POST: APIRoute = async ({ request }) => {\n  const formData = await request.formData();\n  const email = value(formData, "email");\n  const message = value(formData, "message");\n  if (!email || !message)\n    return new Response(JSON.stringify({ error: "Email and message are required." }), {\n      status: 400,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const webhookUrl = import.meta.env.WEBHOOK_URL;\n  if (!webhookUrl)\n    return new Response(JSON.stringify({ error: "Webhook delivery is not configured." }), {\n      status: 500,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const response = await fetch(webhookUrl, {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      name: value(formData, "name"),\n      email,\n      message,\n    }),\n  });\n  if (!response.ok)\n    return new Response(JSON.stringify({ error: "Unable to deliver the message." }), {\n      status: 502,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  return new Response(JSON.stringify({ ok: true }), {\n    status: 200,\n    headers: { "Content-Type": "application/json" },\n  });\n};\n',
};

export const formFeatures = [
  defineFeature({
    id: "forms:none",
    selection: {
      group: "features.forms",
      value: "none",
      label: "None",
    },
    isSelected: (configuration) => configuration.features.forms === "none",
  }),
  defineFeature({
    id: "forms:resend",
    selection: {
      group: "features.forms",
      value: "resend",
      label: "Resend",
    },
    isSelected: (configuration) => configuration.features.forms === "resend",
    requires: [
      {
        capability: "server-runtime",
        code: "resend-requires-server-runtime",
        path: "features.forms",
        message:
          "Resend requires a server-capable deployment target and cannot be used with static output.",
        suggestion:
          "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
      },
    ],
    contributions: {
      dependencies: [
        { name: "resend", version: "^6.17.2", type: "dependency" },
      ],
      templates: [contactFormTemplate, resendRoute],
      environmentVariables: [
        {
          name: "RESEND_API_KEY",
          example: "re_your_api_key",
          comment:
            "Create a sending-only API key and verify the sender domain in Resend.",
        },
        {
          name: "RESEND_FROM_EMAIL",
          example: "contact@your-domain.com",
        },
        { name: "RESEND_TO_EMAIL", example: "you@your-domain.com" },
      ],
      projectNotes: [
        "Set RESEND_API_KEY in .env before the contact form will work.",
      ],
      starterPage: [
        {
          id: "contact-form",
          slot: "contact",
          projectTypes: ["marketing", "client"],
          imports: [
            "import ContactForm from '../components/ContactForm.astro';",
          ],
          content: "<ContactForm />",
        },
      ],
    },
  }),
  defineFeature({
    id: "forms:webhooks",
    selection: {
      group: "features.forms",
      value: "webhooks",
      label: "Webhooks",
    },
    isSelected: (configuration) => configuration.features.forms === "webhooks",
    requires: [
      {
        capability: "server-runtime",
        code: "webhooks-require-server-runtime",
        path: "features.forms",
        message:
          "Webhook forwarding requires a server-capable deployment target and cannot be used with static output.",
        suggestion:
          "Choose Vercel, Netlify, or Cloudflare, or remove the webhook integration.",
      },
    ],
    contributions: {
      templates: [contactFormTemplate, webhookRoute],
      environmentVariables: [
        {
          name: "WEBHOOK_URL",
          example: "https://example.com/contact-webhook",
          comment:
            "URL that will receive contact form submissions. Keep it private.",
        },
      ],
      projectNotes: [
        "Set WEBHOOK_URL in .env before the contact form will work.",
      ],
      starterPage: [
        {
          id: "contact-form",
          slot: "contact",
          projectTypes: ["marketing", "client"],
          imports: [
            "import ContactForm from '../components/ContactForm.astro';",
          ],
          content: "<ContactForm />",
        },
      ],
    },
  }),
] as const;
