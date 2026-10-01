# Worked examples

Five of them: the smallest conversion that is still correct, a
single-collection blog, a multi-collection build, one that hits the `image()`
problem, and one where the structure had to be agreed with the user before any
YAML could be written.

None of these is a template. The shapes here are common, not canonical, and
every path, extension, and field name in them came from reading one particular
repo. Read yours. Where it disagrees with anything below, it wins.

## The minimal case

A stock Astro blog with one collection:

```ts
// src/content.config.ts
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog };
```

Its whole `.pages.yml`:

```yaml
media:
  input: public
  output: /
  rename: safe

content:
  - name: blog
    label: Blog
    type: collection
    path: src/content/blog
    filename: "{primary}.md"
    format: yaml-frontmatter
    view:
      fields: [title, description, pubDate]
    fields:
      - name: title
        type: string
      - name: description
        type: text
        options:
          maxlength: 280
      - name: body
        label: Body
        type: rich-text
      - name: pubDate
        label: Published Date
        type: date
```

Four things in there are worth understanding, and two are easy to get wrong.

`input: public` with `output: /` is the right pairing for an Astro site that
keeps images in `public/`. Astro serves `public/` at the site root, so a file
committed to `public/img1.jpg` is fetched at `/img1.jpg`, and that is exactly
the path the posts contain. Get this pair wrong in either direction and every
image resolves to a 404 that looks like a CMS bug.

`rename: safe` is not optional. Uploading straight into `public/` means the
filename an editor picked becomes a public URL with nothing between the two.
See the media section of `SKILL.md`.

`description` carries `maxlength: 280` even though the zod schema is a bare
`z.string()`. Nothing forced that; whoever converted it read the posts, saw a
one-line meta description, and picked `text` with a cap. That is the judgment
call the type cannot make for you.

`body` sits third in the list, between `description` and `pubDate`. Field order
is editor order and nothing else, so put the field people spend their time in
where they will look for it rather than at the bottom out of habit.

Now the two easy mistakes. The first is pluralising: `label: Blogs` reads
better in the sidebar, so `name: blogs` follows it out of habit while the Astro
key stays `blog`. Harmless until something calls `reference()`, at which point
it is a confusing afternoon. Label freely, match the key exactly.

The second is dropping `format`. Pages CMS infers `yaml-frontmatter` from the
`.md` filename, so a config without it works. Write it anyway. It is one line,
and it is the line that tells the next reader whether the body field is
deliberate.

## A real blog

A single-author notes site with two collections, one of which reaches the CMS.
The interesting parts are the decisions, not the YAML.

```ts
const notesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    author: z.string(),
    authorImage: z.string().optional(),
    readTime: z.string().optional(),
    category: z.string().refine(isValidCategory, { message: `...` }),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
  }),
});

const skillsCollection = defineCollection({ /* title, role, githubUrl, iconPath */ });

export const collections = { notes: notesCollection, skills: skillsCollection };
```

### `category` is an enum wearing a string costume

```ts
// src/config/categories.ts
export const CATEGORIES = ["Guides", "Notes", "Tools", "Releases"] as const;
```

```yaml
- name: category
  label: Category
  type: select
  options:
    values: [Guides, Notes, Tools, Releases]
```

The schema says `z.string()`. Mapping it to `type: string` would be the literal
reading and the wrong one: the refine closes the set, so a free-text box just
lets editors fail the build by typo. Follow the predicate to its array and copy
the values. Then accept that the copy drifts — `categories.ts` is the source of
truth and the CMS will happily keep offering four options after someone adds a
fifth.

### `author` gets a default zod never asked for

```yaml
- name: author
  label: Author
  type: string
  default: editorial

- name: authorImage
  label: Author image
  type: string
  default: /images/avatar.jpeg
```

`author` is `z.string()`, required, no default. The config gives it one anyway,
because this is a single-author blog and the alternative is retyping a name
into every post until one of them is misspelled. Defaults flow one way only:
free to add where the schema has none, never `required: true` where the schema
has one.

### `readTime` and the whole `skills` collection are missing

Both deliberate, and only one of them was the converter's call to make.

`readTime` is optional and derived, so the CMS has no reason to show it. That
omission is safe on its own terms and unsafe by default: with
`settings.content.merge` at its default `false`, the first editor to save a
post rewrites the file from the schema and `readTime` is gone from it. So the
omission comes with a setting:

```yaml
settings:
  content:
    merge: true
```

`skills` is different. It carries an SVG `iconPath` and a hex `color`, which
reads as repo content rather than editor content — but that is a guess about
who does what, and the person who runs the site knows. Ask, and take the answer.
Here it was yes, leave it out.

Neither omission is visible from the config, which is the problem with them. A
line of YAML comment saying `# skills is code-managed, agreed with the owner`
costs nothing and stops the next reader from assuming the conversion stalled.

### `.mdx`, and what that does to the body

```yaml
filename: "{primary}.mdx"
```

The loader pattern is `**/*.{md,mdx}`, so both extensions load, but `filename`
is one template and `.mdx` is what the folder actually holds.

The posts also open with things like
`import Callout from "../../components/Callout.astro";`. The config maps
`body` to `rich-text`, which is a markdown WYSIWYG being handed syntax it does
not model. That may round-trip cleanly and it may quietly flatten a component
into a paragraph. Open the most component-heavy post, save it without editing,
and diff before trusting it.

### `draft` earns its place in the list view

```yaml
view:
  fields: [title, description, publishDate, draft]
  primary: title
  sort: [publishDate, title, draft]
  default:
    sort: publishDate
    order: desc
```

`draft` defaults to `true`, so every new post starts unpublished. Putting the
column in `view.fields` is what makes that survivable — without it the list
gives no hint which posts are live, and something sits in draft for a month.

### The media folder is the cautionary tale

`media` is already right:

```yaml
media:
  input: public/images
  output: /images
  rename: safe
```

And the folder underneath it still holds files like
`public/images/posts/before-&-after.jpg`. An ampersand in a URL path,
committed long before `rename: safe` was set, and `rename` only governs new
uploads. This is the leftover the media section of `SKILL.md` warns about:
turning the setting on fixes the future and nothing else. Sweep the existing
folder, rename to `before-and-after.jpg`, and update the frontmatter that
points at it.

## The multi-collection case

### Source

```ts
// src/content.config.ts
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const faqs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faqs" }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** Short blurb shown on the list card and as the intro on the detail page. */
    summary: z.string(),
    location: z.string().optional(),
    image: z.string(),
    imageAlt: z.string().default(""),
    /** Extra photos shown in a grid under the body on the detail page. */
    gallery: z
      .array(z.object({ src: z.string(), alt: z.string().default("") }))
      .default([]),
  }),
});

const productCategories = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/product-categories" }),
  schema: z.object({
    label: z.string(),
    image: z.string(),
    order: z.number().default(0),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: z.object({
    brand: z.string(),
    name: z.string(),
    category: reference("productCategories"),
    image: z.string().nullable().default(null),
    description: z.string(),
  }),
});

export const collections = { faqs, events, productCategories, products };
```

### Decisions made before writing YAML

Reading the markdown files answered four things zod could not:

- `image` and `gallery[].src` hold paths like `/images/events/expo.jpg`, so
  they are `image` fields, not strings. Public paths, so `media.output` is
  `/images`.
- `summary` and `description` run two or three sentences, so `text`, not
  `string`.
- The faq answer lives in the markdown body, so `faqs` needs a `body` field
  and `question` is the primary.
- `path` for `productCategories` is `src/content/product-categories`. The
  Astro key is camelCase, the folder is kebab-case, and Pages CMS needs the
  folder. The `name` stays camelCase so `reference()` lines up.

### Result

```yaml
media:
  input: public/images
  output: /images
  rename: safe

content:
  - name: faqs
    label: FAQs
    type: collection
    path: src/content/faqs
    filename: "{primary}.md"
    format: yaml-frontmatter
    view:
      fields: [question, order]
      primary: question
      sort: [order, question]
      default:
        sort: order
        order: asc
    fields:
      - name: question
        label: Question
        type: string
        required: true
      - name: order
        label: Order
        type: number
        default: 0
      - name: body
        label: Answer
        type: rich-text

  - name: events
    label: Events
    type: collection
    path: src/content/events
    filename: "{primary}.md"
    format: yaml-frontmatter
    view:
      fields: [title, date, location]
      primary: title
      sort: [date, title]
      default:
        sort: date
        order: desc
    fields:
      - name: title
        label: Title
        type: string
        required: true
      - name: date
        label: Date
        type: date
        default: ""
        required: true
        options:
          format: yyyy-MM-dd
      - name: summary
        label: Summary
        type: text
        required: true
        description: Short blurb shown on the list card and as the intro on the detail page.
      - name: location
        label: Location
        type: string
      - name: image
        label: Image
        type: image
        required: true
      - name: imageAlt
        label: Image alt text
        type: string
        default: ""
      - name: gallery
        label: Gallery
        type: object
        list:
          collapsible:
            collapsed: true
            summary: "{alt}"
        description: Extra photos shown in a grid under the body on the detail page.
        fields:
          - name: src
            label: Photo
            type: image
            required: true
          - name: alt
            label: Alt text
            type: string
            default: ""
      - name: body
        label: Body
        type: rich-text

  - name: productCategories
    label: Product categories
    type: collection
    path: src/content/product-categories
    filename: "{primary}.md"
    format: yaml-frontmatter
    view:
      fields: [label, order]
      primary: label
      sort: [order, label]
      default:
        sort: order
        order: asc
    fields:
      - name: label
        label: Label
        type: string
        required: true
      - name: image
        label: Image
        type: image
        required: true
      - name: order
        label: Order
        type: number
        default: 0
      - name: body
        label: Body
        type: rich-text

  - name: products
    label: Products
    type: collection
    path: src/content/products
    filename: "{primary}.md"
    format: yaml-frontmatter
    view:
      fields: [name, brand, category]
      primary: name
      sort: [name, brand]
      search: [name, brand]
    fields:
      - name: brand
        label: Brand
        type: string
        required: true
      - name: name
        label: Name
        type: string
        required: true
      - name: category
        label: Category
        type: reference
        required: true
        options:
          collection: productCategories
          value: "{name}"
          label: "{fields.label}"
      - name: image
        label: Image
        type: image
      - name: description
        label: Description
        type: text
        required: true
      - name: body
        label: Body
        type: rich-text
```

### Why each non-obvious call was made

`date` carries both `default: ""` and `required: true`. Without the empty
default every new event is stamped with today, which is wrong for a field that
means "when the event happens". Required still forces the editor to pick one.

`order` has `default: 0` and no `required`. Astro fills the key in when it is
missing, so demanding it in the CMS would block a save over nothing.

`image` on `products` is `.nullable().default(null)`, so it gets neither
`required` nor `default`. Writing `default: null` would put a literal `null`
into the frontmatter of every new product. Astro's default already covers the
absent case.

`gallery` uses `list` with a collapsed summary. It is an array of objects and
those stack up fast in the editor.

`category` sets `value: "{name}"` because Astro resolves references by entry
id, which for this flat collection is the filename without `.md`. `label`
shows the human-readable category instead of a filename.

## The `image()` case

A different project, same idea, one extra problem:

```ts
const blogs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blogs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string().max(120),
      thumbnail: image(),
      author: z.string(),
      createdAt: z.coerce.date(),
    }),
});
```

The straightforward mapping:

```yaml
- name: blogs
  label: Blog posts
  type: collection
  path: src/content/blogs
  filename: "{primary}.md"
  format: yaml-frontmatter
  view:
    fields: [title, author, createdAt]
    primary: title
    sort: [createdAt, title]
    default:
      sort: createdAt
      order: desc
  fields:
    - name: title
      label: Title
      type: string
      required: true
    - name: excerpt
      label: Excerpt
      type: text
      required: true
      options:
        maxlength: 120
    - name: thumbnail
      label: Thumbnail
      type: image
      required: true
    - name: author
      label: Author
      type: string
      required: true
    - name: createdAt
      label: Created
      type: date
      default: ""
      required: true
      options:
        format: yyyy-MM-dd
    - name: body
      label: Body
      type: rich-text
```

That YAML is correct and the build can still fail. `thumbnail: image()` makes
Astro resolve the path through its asset pipeline, which only handles images
under `src/`. If `media.output` is `/images` pointing at `public/`, Astro
cannot resolve what the CMS wrote and the build dies on that entry.

Two ways out. Keep `image()` and put media under `src/`, checking that the
prefix Pages CMS writes is one Astro resolves. Or change the schema to
`z.string()`, store public paths, and lose image optimization on that field.

Either way, save one post through the CMS and run `astro build` before
declaring it done.

### Note on `excerpt`

`z.string().max(120)` becomes `options.maxlength: 120` on a `text` field. The
CMS now enforces the same limit the schema does, so editors find out while
typing instead of at build time. Carry `min`/`max` across whenever zod has
them. It is the cheapest quality win in the whole conversion.

## The one that needed a conversation first

A small agency site. The Astro config is not complicated:

```ts
export const collections = {
  caseStudies,      // glob over src/content/case-studies
  caseStudyTags,    // glob over src/content/case-study-tags
  clients,          // glob over src/content/clients
  team,             // glob over src/content/team
  jobs,             // glob over src/content/jobs
};
```

Plus `src/data/site.yml` holding nav labels and contact details, and
`src/pages/index.astro` with the whole homepage hardcoded in markup.

Mechanically this is five collections and forty minutes of table lookups. But
mechanically is not the job here — five top-level sidebar items and a homepage
nobody can touch is a CMS the client stops using in a month. So: do the five
collections, then stop and ask.

### The questions, in one round

Four, each with a recommendation, asked together rather than one at a time:

1. **Group the three case-study collections?** `caseStudies`, `caseStudyTags`,
   and `clients` are one subject with three menu entries. Recommended: group
   them under **Work**, leave `team` and `jobs` at the top level. Nothing moves
   on disk either way.
2. **Put `site.yml` in the CMS?** It is already YAML, so it is a ten-line
   `type: file` entry and no code change. Recommended: yes.
3. **The homepage.** Editable means moving the copy out of `index.astro` into a
   data file and rendering from it — a real change to their code, and the only
   one on the list. Recommended: yes for the hero and the three feature
   blurbs, no for the rest.
4. **Who edits?** Two people at the agency have GitHub; the client does not.
   That answer decides `settings.commit.identity` and whether collaborators
   need inviting.

The answers came back: group them, yes, yes but make the sections reorderable,
and invite the client.

### What each answer turned into

**Work group.** Navigation only, so the `path` on each collection is untouched
and `reference()` still resolves by collection name:

```yaml
content:
  - name: work
    label: Work
    type: group
    items:
      - name: caseStudies
        label: Case studies
        type: collection
        path: src/content/case-studies
        filename: "{primary}.md"
        format: yaml-frontmatter
        operations:
          rename: false
        fields: [...]
      - name: caseStudyTags
        label: Tags
        type: collection
        path: src/content/case-study-tags
        filename: "{primary}.md"
        format: yaml-frontmatter
        fields: [...]
      - name: clients
        label: Clients
        type: collection
        path: src/content/clients
        filename: "{primary}.md"
        format: yaml-frontmatter
        fields: [...]
```

The group's `name` is `work`, not `caseStudies`. It is not an Astro collection
and must not look like one.

`operations.rename: false` on `caseStudies` was not asked about, because it is
not a preference — those filenames are live URLs under `/work/[...slug]`, and
renaming one silently 404s a link the client has been sending to prospects.
Turning it off is the mechanical consequence of reading the routes.

**`site.yml`.**

```yaml
  - name: site
    label: Site settings
    type: file
    path: src/data/site.yml
    format: yaml
    operations:
      delete: false
    fields:
      - name: contact
        type: object
        fields:
          - name: email
            type: string
            pattern:
              regex: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
              message: Enter a valid email address
          - name: phone
            type: string
      - name: nav
        label: Navigation
        type: object
        list:
          collapsible:
            collapsed: true
            summary: "{label}"
        fields:
          - name: label
            type: string
            required: true
          - name: href
            type: string
            required: true
```

`delete: false` because a missing `site.yml` breaks every page, and files allow
deletion by default.

**The homepage, as blocks.** "Reorderable" is the word that decides this. Fixed
slots would have been three named object fields; reorderable means `block`.

The Astro side changed first — the copy moved to `src/data/home.yml`, a
`sections` array, rendered through a component map keyed on `type`:

```yaml
  - name: home
    label: Homepage
    type: file
    path: src/data/home.yml
    format: yaml
    operations:
      delete: false
    fields:
      - name: sections
        label: Sections
        type: block
        list:
          collapsible:
            collapsed: true
            summary: "{type}"
        blockKey: type
        blocks:
          - name: hero
            fields:
              - name: heading
                type: string
                required: true
              - name: image
                type: image
          - name: features
            fields:
              - name: items
                type: object
                list:
                  max: 3
                fields:
                  - name: title
                    type: string
                  - name: body
                    type: text
```

`blockKey: type` matters more than it looks. The default is `_block`, and
`_block` is not what the zod `discriminatedUnion` discriminates on, so leaving
it unset produces a homepage that saves cleanly in the CMS and fails
`astro build`.

The `features` repeat is an `object` with `list: true` nested inside the block,
not `list` on the block itself. There is no list-of-lists at the block root.

**Editors.** The client gets a collaborator invite, and:

```yaml
settings:
  content:
    merge: true
  commit:
    identity: user
```

`identity: user` puts real names on the commits instead of attributing
everything to the GitHub App, which is the difference between a useful
`git log` and a wall of identical entries. `merge: true` because several
collections omit derived fields.

### The part worth copying

The YAML above is this agency's, not yours. What transfers is the sequence: map
everything the schema decides, notice the four things the schema does not
decide, ask them together with a recommendation attached, then finish. The
conversation took two minutes and changed the shape of the whole file.

And note which decisions never became questions — `operations.rename: false`,
`blockKey: type`, `merge: true`. Those follow from the routes, the schema, and
the omissions. Asking about them would have been noise.
