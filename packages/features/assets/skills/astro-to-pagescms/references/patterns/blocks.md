# Blocks: a page builder

**Use when:** A page is assembled from reorderable sections of different shapes.

**Ask first.** Blocks are right for genuinely open-ended sections and overkill for three fixed slots, and the choice usually implies a change to how the page renders.

`type: block` is a list whose items can have different shapes — the CMS
equivalent of `z.discriminatedUnion` inside an array.

```ts
const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), heading: z.string(), image: z.string() }),
  z.object({ type: z.literal("text"), body: z.string() }),
  z.object({
    type: z.literal("faqs"),
    items: z.array(z.object({ heading: z.string(), text: z.string() })),
  }),
]);
```

```yaml
- name: sections
  label: Sections
  type: block
  list: true
  blockKey: type
  blocks:
    - name: hero
      fields:
        - name: heading
          type: string
        - name: image
          type: image
    - name: text
      fields:
        - name: body
          type: rich-text
    - name: faqs
      fields:
        - name: items
          type: object
          list: true
          fields:
            - name: heading
              type: string
            - name: text
              type: rich-text
```

Which produces:

```yaml
sections:
  - type: hero
    heading: Welcome
    image: /images/hero.jpg
  - type: text
    body: Hello world
```

`blockKey` is the discriminator and defaults to `_block`. Set it to whatever
the zod `discriminatedUnion` discriminates on — `type` here — because Astro
will not parse `_block`. This is the single most common way to get blocks
wrong.

A block variant can be a `component`, which is how a hero used on six pages
stays one definition:

```yaml
blocks:
  - name: hero
    component: hero
```

`list: true` goes on the block field itself. To repeat something *inside* one
variant, nest an `object` with `list: true` — as `faqs` does above. There is no
list-of-lists at the block root.

The Astro side needs a component map to render it:

```astro
{page.data.sections.map((section) => {
  const Component = sectionComponents[section.type];
  return <Component {...section} />;
})}
```

Ask before proposing blocks. They are the right answer for a marketing site
whose pages are genuinely assembled from interchangeable sections, and the
wrong one for a page with three fixed slots, where three named object fields
are clearer to edit and simpler to render.
