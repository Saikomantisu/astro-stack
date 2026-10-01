---
name: astro-to-pagescms
description: Wire Pages CMS into an Astro site — what Pages CMS can do, how to set it up, and how to turn Astro content collections into a `.pages.yml`. Use when adding a CMS to an Astro project, when editors need access to a collection, when deciding how content should be organized for non-technical editors, or when the zod schema changed and `.pages.yml` has fallen behind. Triggers on astro content collections, defineCollection, content.config.ts, pages cms, pagescms, .pages.yml.
---

# Pages CMS for Astro sites

Pages CMS is an open-source CMS for static sites in GitHub repositories. There
is no database and no content API: it reads and writes the repo's files, and
every save is a commit. For an Astro site that means editors get a UI and the
build keeps working exactly as it did.

The work splits in two. Most of it is translating an Astro zod schema into
Pages CMS YAML field definitions, which is mechanical and covered below. The
rest is deciding how the CMS should be organized for the people who will use
it, which is not yours to decide alone — see "Ask before you decide".

## What Pages CMS can do

Know the whole surface before mapping anything, because the shape of the config
depends on it. A schema that looks like four collections is sometimes one group
of four, or one collection plus three singleton files.

| Capability | Key | Use it for |
| --- | --- | --- |
| Folder of same-shaped files | `type: collection` | An Astro content collection |
| One file, its own schema | `type: file` | Site config, a landing page, `robots.txt` |
| A file holding one array | `type: file` + `list: true` | `authors.json`, a nav menu |
| Sidebar folder | `type: group` + `items` | Grouping related collections |
| 14 field types | `fields` | Everything from `string` to `block` |
| Reusable field groups | `components` | An SEO block repeated on every collection |
| Page builder | `type: block` | A landing page assembled from sections |
| CSV table editor | `format: datagrid` | Pricing tables, data files |
| Code editor | `format: code` | `_redirects`, snippets |
| Raw editor | omit `fields` | Any file editors should touch as text |
| Nested folders | `subfolders: true`, `view.layout: tree` | Docs trees, `src/content/docs/**` |
| Per-entry permissions | `operations` | Stop editors deleting a singleton |
| Commit message control | `settings.commit`, per-entry `commit` | Conventional commits, CI skip |
| Preserve unknown keys | `settings.content.merge` | Fields you deliberately did not expose |
| Buttons that run CI | `actions` | "Publish now", "Rebuild preview" |
| Editors without GitHub | collaborators, invited by email | Clients, writers |

`references/patterns.md` is an index that routes each structural one to a
short file of its own — read the row you need, not the set.
`references/pagescms-config.md` is the exact syntax for all of it.

## Ask before you decide

Translation is not a decision. `z.coerce.date()` becomes a `date` field, the
Astro collection key becomes `name`, a markdown collection needs a `body`.
Nobody needs consulting about any of that. Do it.

Structure is a decision, and it belongs to the user. Grouping four collections
under one menu, hiding a collection from editors, splitting a landing page into
blocks, changing a filename template that is also the URL — these are opinions
about how someone else will work, and the schema does not contain the answer.
Propose them. Do not enact them silently.

The shape that works: do everything mechanical first, then come back with the
structural questions in one round rather than trickling them out. Give a
recommendation with each. "There are four product collections — I'd put them
under one Products menu" is answerable in a second; "how would you like the
sidebar organized?" is homework. Ask with `AskUserQuestion` so the options are
clickable. Then continue with what they picked and finish the file.

When the user cannot be reached — a non-interactive run, or they already said
go ahead — take the conservative option, write the config, and list the calls
you made somewhere they will be read. Conservative means the option that
changes the least: no groups, no omissions, no filename template that moves
URLs that already exist.

### What to ask about

| When you see | Ask |
| --- | --- |
| Several related collections | Group them under one sidebar menu? |
| A collection of source-ish content (icons, SVG paths, code-managed copy) | Expose to editors, or leave out? |
| Fields that are derived or build-time only | Hide them, or leave them visible? |
| A landing page with repeating sections | Model as `block`, or leave as-is? |
| The same field group on three collections | Extract into `components`? |
| An `.mdx` collection with JSX in the bodies | `rich-text`, source mode, or plain `text`? |
| `image()` in the schema | Move media under `src/`, or drop `image()`? |
| Existing filenames that are also URLs | Confirm the filename template before changing it |
| A singleton that must never be deleted | Turn off `operations.delete`? |
| A site that deploys on every push | Every save is a deploy — is that wanted? |

Everything else, just map it.

## Setup

`.pages.yml` goes at the repo root. Pages CMS reads it per repository *and per
branch*, so a config on `main` does not exist on `content`.

Editors sign in at `app.pagescms.org` with GitHub, install the Pages CMS GitHub
App on the account or org that owns the repo, and pick the repo. People without
GitHub accounts are invited as collaborators by email; they can edit content
and media, and they cannot touch `.pages.yml`, manage collaborators, or reach
the cache admin. Collaborators live in the CMS database, not in the config
file, so there is nothing to write for them.

Pages CMS is also self-hostable if the hosted app is not an option — its docs
cover local, Vercel, and self-host installs.

Nothing about the Astro side changes. No integration, no dependency, no config
edit. Astro keeps reading the same files. That is worth saying out loud to a
user who expects an install step, and it is the reason the whole job is one
YAML file.

The one consequence to raise: a save is a commit, and on Netlify, Vercel, or
Pages a commit is a deploy. An editor fixing three typos ships three builds.
If that is a problem — metered builds, or content that should be reviewed —
point the CMS at a `content` branch and merge by PR, and put `.pages.yml` on
that branch too.

## Read these first

1. The Astro config. `src/content.config.ts` on Astro 5, `src/content/config.ts`
   on Astro 4.
2. One real content file per collection. Open the actual markdown and look at
   the frontmatter.
3. Where images are stored, and whether the schema uses the `image()` helper.
4. The routes. `src/pages/**` tells you which frontmatter keys are URLs, which
   are rendered, and which nothing reads.

Step 2 is the one people skip. Zod types are lossy: `z.string()` covers titles,
slugs, URLs, image paths, and three-paragraph blurbs, and those become four
different Pages CMS fields. The type alone cannot tell you which. The file can.

Every YAML block below is an illustration, not a starting point. Media does not
live in `public/images` because this document says so, bodies are not `.md`,
posts do not have a `publishDate`. Those are the conventions of some repo that
is not the one you are looking at. Copy the reasoning; derive the values from
the schema, the folder, and the files in front of you. When a worked example
and the actual repo disagree, the repo is right.

## Step 1: map the collection

Each `defineCollection` becomes one entry under `content:`.

```ts
const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({ /* ... */ }),
});
```

```yaml
content:
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
    fields: [] # step 2
```

| Astro | Pages CMS |
| --- | --- |
| key in `export const collections` | `name` (keep it identical) |
| humanized key | `label` |
| `glob()` loader over a folder | `type: collection` |
| `file()` loader over one data file | `type: file` plus `list: true` |
| `base: "./src/content/events"` | `path: src/content/events`, drop the `./` |
| `pattern: "**/*.md"` | `subfolders: true` |
| `pattern: "*.md"` | `subfolders: false` |
| `.md` / `.mdx` files | `format: yaml-frontmatter` plus a `body` field |
| `.json` files | `format: json` |
| `.yaml` / `.yml` files | `format: yaml` |
| TOML frontmatter (`+++`) | `format: toml-frontmatter`, `delimiters: "+++"` |
| Astro 4 `type: 'content'` | `format: yaml-frontmatter` plus a `body` field |
| Astro 4 `type: 'data'` | `format: json` or `yaml`, no body |

Keep the Pages CMS `name` byte-identical to the Astro collection key. Nothing
enforces it, but `reference()` fields point at collections by name and the
debugging gets tedious once the two drift.

`filename` decides entry ids, and entry ids are usually the URL slug under a
`[...slug]` route. `"{primary}.md"` slugifies the primary field, so an editor
who types a title picks the slug. Prefix with `{year}-{month}-{day}-` if the
existing files are dated. Changing this template on a collection that is
already published moves URLs, so confirm it rather than improving it.

A loader pattern like `**/*.{md,mdx}` accepts both extensions, but `filename`
is one template. Whichever extension you write there is the only one the CMS
will ever create; files already on disk with the other keep working. Look at
the folder and pick what it actually uses — `"{primary}.mdx"` for an MDX
collection, `"{primary}.md"` otherwise.

Deep collections — `src/content/docs/**` with nested folders — want
`subfolders: true` and `view.layout: tree`, which shows editors the folder
structure instead of a flat list of two hundred rows.

### The body is not in the schema

Astro never puts the markdown body in the zod schema. It arrives separately
through `render()`. Pages CMS has no such convention, so an undeclared body is
a body editors cannot reach. Add it by hand to every frontmatter collection:

```yaml
- name: body
  label: Body
  type: rich-text
```

The key must be exactly `body`. Pages CMS treats that name specially in
frontmatter formats and maps it to the content below the delimiters.

### MDX bodies need a decision

`rich-text` is a markdown WYSIWYG. MDX is markdown plus `import` statements and
JSX, and neither is markdown. An `.mdx` collection whose posts are plain prose
maps to `rich-text` with no trouble. One whose posts open with

```mdx
import Callout from "../../components/Callout.astro";
```

is asking the editor to round-trip syntax it does not model, and the failure
mode is a component silently flattened into a paragraph of text.

So find out before shipping the config rather than after. Set `body` to
`rich-text`, open the most component-heavy post in the collection, save it
untouched, and diff. A clean diff means `rich-text` is fine for this content.
A mangled one means the body needs source mode — `options.switcher` is on by
default, so the toggle is already there — or `type: text` to take the WYSIWYG
out of the loop entirely. Which one is the user's call; say what the diff
showed and let them pick.

## Step 2: map the fields

Pages CMS has two separate mechanisms for repeated values, and picking the
wrong one produces a config that loads but does not work.

- `list: true` repeats the whole widget. Use it for string, text, number,
  date, code, and object.
- `options.multiple` is built into the picker widgets. Use it for select,
  reference, image, and file.

### Strings

| Zod | Pages CMS |
| --- | --- |
| `z.string()`, short value | `type: string` |
| `z.string()`, a paragraph | `type: text` |
| `z.string()`, markdown | `type: rich-text` |
| `z.string()`, path to an image | `type: image` |
| `z.string()`, path to a document | `type: file` |
| `z.string()`, source code | `type: code`, `options.format` |
| `z.string().min(n)` | `options.minlength: n` |
| `z.string().max(n)` | `options.maxlength: n` |
| `z.string().regex(re)` | `pattern: { regex: ..., message: ... }` |
| `z.string().url()` | `type: string` plus a URL `pattern` |
| `z.string().email()` | `type: string` plus an email `pattern` |
| `z.string().uuid()` | `type: uuid`, `options.editable: false` |

`minlength` and `maxlength` belong to both `string` and `text`. Nothing else in
zod's string API has a Pages CMS counterpart, so `.trim()`, `.toLowerCase()`,
and friends silently do nothing on the CMS side.

### Numbers and booleans

| Zod | Pages CMS |
| --- | --- |
| `z.number()` | `type: number` |
| `z.number().min(a)` / `.max(b)` | `options.min` / `options.max` |
| `z.number().int()` | no equivalent, see below |
| `z.boolean()` | `type: boolean` |

The number field takes `min` and `max` and nothing else. There is no integer
constraint, so `z.number().int()` will happily receive `1.5` from the CMS and
fail at build time. Say so in `description`, or use a `pattern` on a string
field if the value has to be whole.

### Dates

| Zod | Pages CMS |
| --- | --- |
| `z.date()`, `z.coerce.date()` | `type: date`, `options.format: yyyy-MM-dd` |
| a date with a time component | add `options.time: true` |

```yaml
- name: date
  label: Date
  type: date
  options:
    format: yyyy-MM-dd
```

Two things bite here. Date fields prefill with today unless you set
`default: ""`, which quietly stamps every new entry with the creation date even
when the field means something else, like an event date. And `format` uses
date-fns tokens, not zod or Astro ones. `z.coerce.date()` parses almost
anything, so a wrong `format` will not fail the build. It just writes a
different shape than the files already on disk.

### Enums and fixed choices

| Zod | Pages CMS |
| --- | --- |
| `z.enum([...])` | `type: select`, `options.values` |
| `z.array(z.enum([...]))` | add `options.multiple: true` |
| `z.array(z.enum([...])).min(a).max(b)` | `options.min` / `options.max` |
| `z.nativeEnum(E)` | `type: select`, values written out by hand |
| `z.string().refine(isOneOf)` | `type: select`, values written out by hand |
| `z.literal("x")` | `type: string`, `hidden: true`, `default: "x"` |

```yaml
- name: status
  type: select
  options:
    values: [publish, coming-soon]
```

For friendlier labels, use the object form. The stored value is `name`, not
`value`, which is an easy one to get backwards:

```yaml
options:
  values:
    - name: coming-soon
      label: Coming soon
```

Whatever you write in `values` has to match the zod enum exactly. A label
mismatch is invisible in the CMS and fails at build.

A fixed set of choices does not always arrive as `z.enum`. Astro projects that
need the list at runtime too — for a filter UI, a nav, a colour map — usually
keep it in a const array and validate against it:

```ts
export const CATEGORIES = ["Guides", "Notes", "Tools", "Releases"] as const;

category: z.string().refine(isValidCategory, { message: "..." }),
```

The zod type is `z.string()`, so nothing in the schema looks enum-shaped. Grep
the refine's predicate to its source array and map it to `select` anyway —
`type: string` here hands editors a free-text box for a closed set, and every
typo becomes a build failure.

Copy the values by hand and remember that the copy is now the drift risk. The
const array is the source of truth, `.pages.yml` is a snapshot, and nothing
connects them. When someone adds a category, the CMS keeps offering the old
four. If the list changes often, a `reference` to a real collection of
categories drifts less than a copied array — that is a structural change, so
propose it rather than making it.

### Arrays and objects

| Zod | Pages CMS |
| --- | --- |
| `z.array(z.string())` | `type: string`, `list: true` |
| `z.array(X).min(a).max(b)` | `list: { min: a, max: b }` |
| `z.object({ ... })` | `type: object`, nested `fields` |
| `z.array(z.object({ ... }))` | `type: object`, `list: true`, nested `fields` |
| `z.tuple([...])` | approximate with `list: { min: n, max: n }` |
| `z.record(...)` | no equivalent |

```yaml
- name: faqs
  label: FAQs
  type: object
  list:
    collapsible:
      collapsed: true
      summary: "{question}"
  fields:
    - name: question
      type: string
    - name: answer
      type: text
```

Set a `summary` on any object list longer than about three entries. Without it
the editor shows a stack of identical collapsed rows.

### Images and files

| Zod | Pages CMS |
| --- | --- |
| `image()` | `type: image` |
| `z.array(image())` | `type: image`, `options.multiple: true` |
| `z.string()` holding an image path | `type: image` |
| `z.string()` holding a document path | `type: file` |

Note the asymmetry: multiple images use `options.multiple`, not `list: true`.

`image()` is the sharpest edge in this whole conversion. The helper returns
`ImageMetadata`, which means Astro has to resolve the path through its asset
pipeline at build time. That works for images under `src/`, and does not work
for anything in `public/`. Pages CMS, meanwhile, writes exactly one prefix into
the file, whatever `media.output` says. So the two have to be reconciled
deliberately:

- Point `media.input` and `media.output` at a directory under `src/` and
  confirm Astro resolves what the CMS writes.
- Or drop `image()` for `z.string()`, store public paths, and give up Astro's
  image optimization for those fields.

The second one edits the user's schema and costs them optimization, so ask
which they want. Then do not guess whether it worked: save one entry through
the CMS and run `astro build`. A broken `image()` path fails loudly, so the
check is cheap.

### References

| Zod | Pages CMS |
| --- | --- |
| `reference("authors")` | `type: reference`, `options.collection: authors` |
| `z.array(reference("authors"))` | add `options.multiple: true` |

```yaml
- name: category
  label: Category
  type: reference
  options:
    collection: productCategories
    value: "{name}"
    label: "{fields.label}"
```

Astro resolves a reference by entry id, which is the path relative to the
collection base with the extension stripped. Pages CMS `value` controls what
actually lands in the file, so set it rather than trusting the default. For a
flat collection `{name}` matches the Astro id. Once `subfolders: true` is on,
Astro's id includes the folder and `{name}` does not, so check a real entry.

Use `label` to show editors something readable. A dropdown of raw filenames is
technically correct and useless.

### Modifiers

| Zod | Pages CMS |
| --- | --- |
| no modifier | `required: true` |
| `.optional()`, `.nullable()`, `.nullish()` | omit `required` |
| `.default(v)` | `default: v`, and do not mark it required |
| `.nullable().default(null)` | omit both `required` and `default` |
| `.catch(v)` | `default: v` |
| `.describe("...")`, or a JSDoc comment | `description: "..."` |
| `.transform(fn)` | no equivalent |
| `.refine(fn)` | `pattern`, or `select` when it tests list membership |
| `z.union([...])` | no equivalent, see below |
| `z.discriminatedUnion(...)` | `type: block` |
| `z.any()`, `z.unknown()` | no equivalent, mark `hidden: true` |

A field carrying `.default()` is optional in the file, since Astro fills it in
when the key is missing. Marking it `required: true` blocks editors on
something Astro would have handled, and `default: ""` combined with
`required: true` produces a form nobody can save.

The table only runs one way. A CMS `default` is an editor convenience and owes
nothing to the schema, so it is fine — often better — to add one where zod has
none. On a single-author blog, `author` is `z.string()` with no default and
still deserves a `default:` in the config, because the alternative is retyping
the same name into every post and eventually misspelling it. The rule that
matters is the other direction: a zod `.default()` must not become
`required: true`.

`.transform()` and `.refine()` run after parsing, so the CMS never sees them.
The CMS writes the raw pre-transform value and the transform still applies at
build. That is usually fine. It stops being fine when a `.refine()` encodes a
rule editors can break, in which case restate it in `description` so at least
the failure is explicable. The exception is a `.refine()` that tests membership
in a list, which maps to `select` properly — see the enum section above.

For a plain `z.union`, pick the member that covers real content and accept the
narrowing, or split it into a `select` discriminator plus optional fields.
Neither is clean. A `z.discriminatedUnion` inside an array is a different
story: that is what `type: block` is for, and
`references/patterns/blocks.md` covers the mapping.

### What to leave out, and the setting that makes it safe

A faithful conversion is not an exhaustive one, but omission has a cost that is
easy to miss.

By default `settings.content.merge` is `false`, which means saving an entry
rewrites the file from the schema. **Keys that are not in `.pages.yml` are
discarded.** So a `readTime` you left out because editors have no business
touching it is not merely hidden — it is deleted from every post an editor
saves. Set `settings.content.merge: true` whenever the config deliberately
omits a field that exists in the content files:

```yaml
settings:
  content:
    merge: true
```

With that on, submitted fields are merged into the existing file and keys
outside the schema survive. Then the two normal kinds of omission are safe:

Fields the CMS has no business showing. A `readTime` computed from the body, an
`ogImage` generated at build, a `hidden` flag only the code sets. Optional in
zod, absent from `.pages.yml`, and editors never see a box they should not
touch. Omit a *required* one and the CMS produces entries that fail
`astro build` on a key the editor was never offered, so those stay — hide them
with `hidden: true` and a `default` instead.

Whole collections. Content that is really source — landing-page copy under
version control, a `skills` collection whose entries carry an SVG `iconPath` —
belongs to whoever edits the repo. This one is a judgment call about somebody
else's workflow, so ask before dropping a collection, and when the answer is
yes, leave a YAML comment saying so. The next reader will otherwise take a
missing collection for an unfinished conversion.

Either way the empty-diff check in step 5 is what proves it. Run it on a
collection with omitted fields specifically.

## Step 3: media

```yaml
media:
  input: public/images
  output: /images
  rename: safe
```

`input` is where files land in the repo. `output` is the prefix written into
content. The two are independent — files under `public/images/` can be
referenced as `/images/`, which is exactly what an Astro site needs. Named
sources work too when different collections upload to different places, and
image fields then select one with `options.media`. Details in
`references/pagescms-config.md`.

### Always set `rename: safe`

Pages CMS defaults to `rename: false`, which commits the uploaded filename
byte for byte. Editors upload from a phone or a design tool, so that filename
is `IMG 2847 (1).JPG`, or `Screenshot 2026-08-26 at 14.02.31.png`, or
something with an em dash in it. That path then goes straight into frontmatter
and into markdown image syntax, where:

- spaces break bare `![](...)` links, which stop at the first space;
- parentheses break them again, closing the link early;
- an uppercase extension resolves on a case-insensitive local filesystem and
  404s on the case-sensitive host the site deploys to;
- non-ASCII characters get percent-encoded inconsistently across the CMS, git,
  and the host.

`rename: safe` slugifies on upload, so the same file lands as `img-2847-1.jpg`
and every consumer agrees on the path. Set it on every media source, including
each entry of the array form. `rename: true` is the same thing; `rename:
random` is also safe but discards a name editors can recognize in the media
library, so prefer `safe` unless filename collisions are the actual problem.

Two things to hold on to. Field-level `options.rename` on an `image`, `file`,
or `rich-text` field overrides the media source, so setting it to `false`
there reopens the hole for that one field. And renaming applies to uploads
only: media already committed under unsafe names stays unsafe, so rename those
on disk and fix their references in content at the same time. A half-migrated
folder produces broken links that read like a CMS bug.

## Step 4: everything that is not a collection

Most Astro repos have content that is not a content collection, and it is
usually the part editors complain about. Each of these is a proposal, not a
default — raise it, then build what the user picks.

- **Site-wide values** — nav labels, footer text, contact details, social links
  — live in a `.ts`, `.json`, or `.yml` under `src/`. A `type: file` entry puts
  them in the CMS. → `patterns/singletons.md`
- **A landing page** whose copy is hardcoded in `.astro`. Moving it into a data
  file plus a `type: file` entry is the single highest-value thing you can do
  for a client site, and the biggest change to their code, so it is squarely a
  question to ask. → `patterns/singletons.md`
- **Repeating page sections** — hero, features, testimonials, CTA. `type: block`
  gives editors a real page builder. Worth it when the section list is genuinely
  open-ended, overkill when there are three fixed slots. → `patterns/blocks.md`
- **Repeated field groups** — an SEO object on every collection. `components`
  defines it once. → `patterns/components.md`
- **Many collections** — `type: group` nests them into one sidebar menu without
  changing where a single file is stored. This is the grouping question, and it
  is purely cosmetic on disk, which is what makes it safe to offer.
  → `patterns/groups.md`
- **Files editors should touch as text** — `_redirects`, `robots.txt`. A
  `type: file` with no `fields` gets a raw editor; `format: code` gets syntax
  highlighting; a `.csv` gets a spreadsheet. → `patterns/singletons.md`
- **Buttons that run CI** — `actions` wires a button to a workflow, for a
  "publish now" or a preview rebuild. → `patterns/actions.md`

Paths are relative to `references/`. Two more files there cover things that are
not proposals: `patterns/operations.md` for restricting create/rename/delete,
and `patterns/settings.md` for merge mode and commit messages.

## Step 5: verify

Do not trust the config until it round-trips.

1. Put `.pages.yml` at the repo root, on the branch editors will use.
2. Open an existing entry in the CMS, save it without editing, and run
   `git diff`. Empty diff means the mapping is faithful. Anything else is
   drift: reordered keys, a different date shape, quoting changes, a dropped
   field. Do this on a collection with omitted fields specifically — it is what
   proves `settings.content.merge` is set correctly.
3. Create one new entry per collection.
4. Run `astro build`. Zod errors point straight at the field that is wrong.
5. Load a page that renders the new entry. A build that passes still tells you
   nothing about whether the image path resolves in the browser.

Step 2 catches more than step 3. A config can accept new entries happily while
mangling every existing file it touches.

## Reference

Load what the task needs. Nothing here has to be read end to end.

- `references/patterns.md` — the index. A table routing each situation to one
  short file:

  | File | Covers |
  | --- | --- |
  | `patterns/groups.md` | `type: group`, nesting collections under one menu |
  | `patterns/singletons.md` | `type: file`, file-as-array, raw / code / datagrid editors |
  | `patterns/components.md` | `components`, reusing a field group |
  | `patterns/blocks.md` | `type: block`, `blockKey`, page builders |
  | `patterns/operations.md` | restricting create, rename, delete |
  | `patterns/settings.md` | `content.merge`, commit identity and templates |
  | `patterns/actions.md` | buttons that dispatch GitHub Actions workflows |

- `references/pagescms-config.md` — the complete `.pages.yml` syntax: every
  top-level key, every content property, all 14 field types and their exact
  `options`. A lookup table, not a read.
- `references/example.md` — five worked conversions, from a four-field blog to
  a site whose structure had to be agreed with the user first.
