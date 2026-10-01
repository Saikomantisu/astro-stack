# Components: define a field group once

**Use when:** The same field group is repeated across three or more collections.

**Ask first.** Factoring shared fields out usually means factoring the zod schema too, so it touches `content.config.ts` as well as `.pages.yml`.

An SEO object repeated across `blog`, `pages`, and `products` is three copies
that drift. `components` is the fix:

```yaml
components:
  seo:
    type: object
    label: SEO
    fields:
      - name: title
        type: string
        options:
          maxlength: 60
      - name: description
        type: text
        options:
          maxlength: 160
      - name: ogImage
        type: image

content:
  - name: blog
    type: collection
    path: src/content/blog
    fields:
      - name: title
        type: string
      - name: seo
        component: seo
```

`component` and `type` are mutually exclusive — a field uses one or the other.
Field-level keys override the component's, so `label: Meta` on the usage wins
over `label: SEO` on the definition.

The Astro side has to match. If `blog` and `pages` both have `seo` in their zod
schema, factor that out into a shared `const seoSchema = z.object({...})` in
`content.config.ts` at the same time, or the two definitions drift in the
opposite direction from the one you just fixed.

Worth doing at three usages. At two it is indirection for its own sake.
