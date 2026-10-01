# Actions: buttons that run GitHub Actions

**Use when:** A button in the CMS should trigger a GitHub Actions workflow.

**Ask first.** An action only earns its place when the build is decoupled from push; on a site that already deploys on commit it adds a button that does nothing new.

```yaml
content:
  - name: blog
    type: collection
    path: src/content/blog
    actions:
      - name: preview
        label: Rebuild preview
        workflow: preview.yml
        ref: current
        scope: entry
        confirm:
          title: Rebuild preview?
          message: Takes about a minute.
          button: Rebuild
```

Actions can sit at the repo level (`actions` at the top of `.pages.yml`, shown
in the sidebar), on a collection, on a single entry, on a file, or on a media
source. `scope: collection` or `scope: entry` picks which header the button
appears in.

The workflow must accept a `payload` string input:

```yaml
on:
  workflow_dispatch:
    inputs:
      payload:
        description: Pages CMS payload as JSON
        required: true
        type: string
```

Pages CMS sends one JSON object in `inputs.payload` carrying `source`
(`"pages-cms"`), `action` (name and label), `repository` (owner, repo, ref,
sha), `triggeredBy`, `context` (type, name, path, data), and `inputs` (values
from any extra `fields` declared on the action). Extra fields take `name`,
`label`, `type` (`text`, `textarea`, `select`, `checkbox`, `number`),
`required`, `default`, and `options` for selects.

A confirmation dialog is shown by default; `confirm: false` skips it, and
`cancelable: false` removes the cancel button.

The Astro use is a deploy hook. If the site builds on push, editors already get
that for free and an action adds nothing. It earns its place when the build is
decoupled — a scheduled rebuild, a preview environment, an external index to
refresh after content changes.
