# Pages CMS configuration reference

Target-side lookup for `.pages.yml`. Everything here is from the Pages CMS docs
at `pagescms.org/docs/`. Where a detail is not covered there, this file says so
rather than guessing.

The file lives at the repository root and is read per repository *and per
branch*.

Jump to what you need — this is a lookup table, not a document to read through.

| Section | Covers |
| --- | --- |
| [Top level](#top-level) | the five root keys |
| [Content entry](#content-entry) | `collection`, `file`, `group`, and every entry property |
| [Editors](#editors) | which editor an entry gets: fields, raw, code, datagrid |
| [view](#view) | list columns, primary, sort, search, tree layout |
| [filename](#filename) | templates and every placeholder |
| [operations](#operations) | create / rename / delete, and the per-type defaults |
| [Field properties](#field-properties-all-types) | the keys every field type accepts |
| [list](#list) | `min`, `max`, collapsible, summary tokens |
| [Field types](#field-types) | all 14, each with its exact `options` |
| [components](#components) | reusable field definitions |
| [media](#media) | string / object / array forms, `rename`, per-source commits |
| [settings](#settings) | `content.merge`, commit identity and templates |
| [actions](#actions) | workflow dispatch, the `payload` input, extra fields |
| [collaborators](#collaborators) | what they can and cannot do |

## Top level

```yaml
media: ...      # upload locations and public path rewriting
content: ...    # collections, files, and groups
components: ... # reusable field definitions
settings: ...   # repo-wide behavior, merge mode, commit templates
actions: ...    # repo-level GitHub Actions buttons
```

Recommended order to write them in: media, content, components, settings,
actions.

## Content entry

| Property | Required | Meaning |
| --- | --- | --- |
| `name` | yes | internal id, unique |
| `label` | no | UI label |
| `type` | yes | `collection`, `file`, or `group` |
| `path` | yes | folder for collections, file path for files, unused by groups |
| `fields` | no | field definitions; omit for a raw editor |
| `filename` | no | filename template, collections only |
| `exclude` | no | files to ignore, e.g. `["README.md"]` |
| `format` | no | `yaml-frontmatter`, `json-frontmatter`, `toml-frontmatter`, `yaml`, `json`, `toml`, `datagrid`, `code`, `raw` |
| `delimiters` | no | custom frontmatter delimiters, e.g. `"+++"`, or the array form |
| `subfolders` | no | `true` or `false` |
| `list` | no | for `type: file`, store the whole file as a top-level array |
| `view` | no | collection list settings |
| `operations` | no | per-entry create/rename/delete controls |
| `commit` | no | per-entry commit settings, same shape as `settings.commit` |
| `actions` | no | collection or file action buttons |
| `items` | no | child entries inside a `group` |

Three types:

- `collection` — many files sharing one schema, in a folder.
- `file` — one file with its own schema.
- `group` — navigation only. No `path`, no editor route, `items` holds nested
  groups, collections, and files.

### Editors

Which editor an entry gets:

| Config | Editor |
| --- | --- |
| `fields` declared | structured field form (the default) |
| `fields` omitted or empty | raw file editor |
| `format: code` | code editor with syntax highlighting |
| `format: datagrid`, or a `.csv` path | CSV-style table |

## view

Collections only.

```yaml
view:
  fields: [title, published, author.name]
  primary: title
  sort: [date, title]
  search: [title]
  layout: list        # or tree
  default:
    search: ""
    sort: date
    order: desc
```

| Key | Meaning |
| --- | --- |
| `fields` | columns shown in the list, in order; dotted paths reach into objects |
| `primary` | main label; defaults to `title` when a field by that name exists |
| `sort` | fields offered as sort options |
| `search` | fields indexed for search |
| `default.search` | default search query |
| `default.sort` | default sort field |
| `default.order` | `asc` or `desc` |
| `layout` | `list` or `tree` |
| `node` | tree node config, string or object |
| `node.filename` | which file represents a folder node, e.g. `index.md` |
| `node.hideDirs` | `all`, `nodes`, or `others` |

Tree layout:

```yaml
view:
  layout: tree
  node:
    filename: index.md
    hideDirs: others
  fields: [title]
  primary: title
```

## filename

String form, or an object when the filename input needs controlling:

```yaml
filename: "{primary}.md"
```

```yaml
filename:
  template: "{year}-{month}-{day}-{primary}.md"
  field: create   # false = hidden, create = only on new entries, true = always
```

Placeholders: `{primary}`, `{slug}` (alias for primary), `{year}`, `{month}`,
`{day}`, `{hour}`, `{minute}`, `{second}`, `{fields.<name>}`, and `{<name>}` as
shorthand for the last one. Date parts are zero-padded. Field values are
slugified.

`{primary}` resolves to `view.primary`, else a field named `title`, else the
first field.

## operations

```yaml
operations:
  create: true
  rename: false
  delete: false
```

| Type | `create` | `rename` | `delete` |
| --- | --- | --- | --- |
| `collection` | `true` | `true` | `true` |
| `file` | `true` | `false` | `true` |

`.pages.yml` itself is handled separately and cannot be deleted.

## Field properties, all types

| Property | Meaning |
| --- | --- |
| `name` | required, the key in stored data |
| `type` | required unless `component` is set |
| `component` | reuse a definition from `components`, mutually exclusive with `type` |
| `label` | UI label, `false` hides it |
| `description` | helper text under the field |
| `required` | mandatory |
| `hidden` | not shown in the editor |
| `readonly` | shown but not editable, inherits down into nested fields |
| `pattern` | regex validation, string and text only |
| `default` | initial value on new entries |
| `list` | repeat as an array |
| `options` | type-specific |

`pattern` takes a bare string or an object:

```yaml
pattern:
  regex: "^[A-Z]{3}-\\d{4}$"
  message: "Use format ABC-1234"
```

In frontmatter formats the field named `body` maps to the content below the
delimiters.

## list

On a field, repeats it as an array. On a `type: file` entry, declares that the
file itself is a top-level array and `fields` describes one element.

```yaml
list:
  min: 1
  max: 6
  collapsible:
    collapsed: true
    summary: "{title} ({index})"
```

| Key | Meaning |
| --- | --- |
| `min` | minimum item count |
| `max` | maximum item count |
| `collapsible` | collapse object and block items |
| `collapsible.collapsed` | default collapsed state |
| `collapsible.summary` | text shown on a collapsed item |

`summary` accepts `{index}` (1-based), `{fields.<name>}`, and `{<name>}`.

## Field types

Fourteen: `block`, `boolean`, `code`, `date`, `file`, `image`, `number`,
`object`, `reference`, `rich-text`, `select`, `string`, `text`, `uuid`.

### string

`options`: `minlength`, `maxlength`. Single-line input.

```yaml
- name: slug
  type: string
  required: true
  pattern: "^[a-z0-9-]+$"
  options:
    minlength: 3
    maxlength: 80
```

### text

`options`: `minlength`, `maxlength`. Multi-line plain text, no formatting.

```yaml
- name: summary
  type: text
  pattern:
    regex: "^(?s).{20,500}$"
    message: "Summary must be between 20 and 500 characters"
  options:
    minlength: 20
    maxlength: 500
```

### rich-text

WYSIWYG. `options`:

| Key | Meaning |
| --- | --- |
| `format` | `markdown` (default) or `html` |
| `switcher` | show the Editor/Source toggle, defaults to `true` |
| `media` | media source name for image uploads, or `false` to disable uploads |
| `path` | default upload folder |
| `extensions` | allowed image extensions |
| `categories` | allowed categories, currently `image` |
| `rename` | `false`, `true`/`safe`, or `random` |

```yaml
- name: body
  label: Body
  type: rich-text
  options:
    media: content_images
    path: public/images/blog
    rename: safe
    switcher: true
```

### number

`options`: `min`, `max`. No step, no integer constraint.

### boolean

No options. Set `default: true` or `default: false`.

### date

`options`: `time`, `format` (date-fns tokens), `min`, `max`, `step`.

```yaml
- name: publish_at
  type: date
  default: ""
  options:
    time: true
    format: yyyy-MM-dd'T'HH:mm
```

Prefills with the current date, or current date and time when `time: true`.
`default: ""` turns that off.

### select

`options`: `values` (required), `multiple`, `min`, `max`, `placeholder`.
Only static local values. For anything dynamic use `reference`.

```yaml
- name: categories
  type: select
  options:
    values:
      - name: art
        label: Art
      - name: fashion
        label: Fashion
```

`name` is stored, `label` is displayed. A plain array of strings works when
the two are the same.

### reference

`options`: `collection`, `multiple`, `min`, `max`, `search`, `value`, `label`.

```yaml
- name: author
  type: reference
  options:
    collection: authors
    search: "name,email,fields.role"
    value: "{primary}"
    label: "{primary}"
```

`value` and `label` accept `{path}`, `{name}`, `{primary}`,
`{fields.<path>}`, and `{<path>}`. `search` is a comma-separated string, not
an array.

### image

`options`: `media`, `path`, `multiple`, `extensions`, `categories`, `unique`,
`rename`.

```yaml
options:
  multiple:
    max: 6
```

Multiple images go through `options.multiple`, not `list: true`. `rename`
takes `false`, `true`, `safe`, or `random`. `unique: true` blocks duplicate
paths when multiple is on.

### file

Same shape as `image`, pointed at documents rather than images.

### object

No options. Declare nested `fields`. Add `list: true` for an array of objects.

```yaml
- name: authors
  type: object
  list: true
  fields:
    - name: name
      type: string
    - name: email
      type: string
```

`required` applies to the object itself, not automatically to its children. On
an optional object, child `required` rules only kick in once the object has
content.

### uuid

`options`: `editable`, `generate`. Generates a v4 UUID when there is no
explicit `default`. Set `default: ""` to start empty.

```yaml
- name: id
  type: uuid
  options:
    editable: false
```

### code

Code editor with syntax highlighting, for snippets, templates, and small config
blocks.

`options.format`: `yaml`, `yml`, `javascript`, `js`, `jsx`, `typescript`, `ts`,
`tsx`, `json`, `html`, `htm`, `markdown`, `mdx`.

```yaml
- name: snippet
  type: code
  options:
    format: javascript
```

### block

A list whose items can have different shapes — the page-builder field.

| Key | Meaning |
| --- | --- |
| `blocks` | list of block definitions, each with `name` plus `fields` or `component` |
| `blockKey` | key storing the selected block type, defaults to `_block` |

```yaml
- name: sections
  label: Sections
  type: block
  list: true
  blockKey: type
  blocks:
    - name: hero
      component: hero
    - name: text
      fields:
        - name: body
          type: rich-text
```

```yaml
sections:
  - type: hero
    heading: Welcome
    image: /images/hero.jpg
  - type: text
    body: Hello world
```

Repeating data inside one variant means nesting an `object` with `list: true`;
`list: true` at the block root repeats the block, not its contents. The docs
show `blocks` and `blockKey` at the field root in every example while listing
them in the options table — follow the examples, and check the rendered output
before relying on it.

## components

Reusable field definitions, referenced with `component` instead of `type`.

```yaml
components:
  seo:
    type: object
    label: SEO
    fields:
      - name: title
        type: string
      - name: description
        type: text

content:
  - name: pages
    type: collection
    path: content/pages
    fields:
      - name: seo
        component: seo
        label: Meta
```

Field-level values override the component's, so `label: Meta` wins over
`label: SEO`. Whether a component may reference another component is not
covered in the docs.

## media

String form:

```yaml
media: media   # means input: media, output: /media
```

Object form:

```yaml
media:
  input: src/media
  output: /media
  rename: safe
  categories: [image]
```

Named sources, selected per field with `options.media`:

```yaml
media:
  - name: images
    label: Images
    input: media/images
    output: /media/images
    rename: safe
    extensions: [png, jpg, webp]
  - name: docs
    label: Documents
    input: media/docs
    output: /media/docs
    rename: safe
    categories: [document]
```

| Key | Meaning |
| --- | --- |
| `name` | required when using the array form |
| `label` | UI label |
| `input` | where files are written in the repo, required |
| `output` | prefix written into content files, required |
| `extensions` | allowlist, e.g. `["png", "jpg", "webp"]` |
| `categories` | `image`, `document`, `video`, `audio`, `compressed`, `code`, `font`, `spreadsheet` |
| `rename` | `false` keeps the original, `true`/`safe` slugifies, `random` generates |
| `commit` | per-source commit settings |
| `actions` | media action buttons |

`input` and `output` are independent. Files stored at `media/images/` can be
referenced as `/media/images/` in content.

`rename` defaults to `false`, which commits whatever the editor's file was
called, spaces and capitals and all. Always write `rename: safe`, on every
source in the array form. See the media section of `SKILL.md` for what breaks
without it.

Per-source commit templates:

```yaml
media:
  - name: images
    input: media/images
    output: /media/images
    commit:
      templates:
        create: "chore(media): add {filename}"
        update: "chore(media): update {filename}"
        delete: "chore(media): remove {filename}"
        rename: "chore(media): rename {oldFilename} -> {newFilename}"
```

### rename on fields

`image`, `file`, and `rich-text` all take `options.rename`, which overrides the
media source for that field. It exists to tighten a source that is loose, not
to loosen one that is safe. Leave it unset and inherit `safe`.

## settings

```yaml
settings:
  hide: false
  content:
    merge: false
  commit:
    identity: app
    templates:
      create: "Create {path} (via Pages CMS)"
      update: "Update {path} (via Pages CMS)"
      delete: "Delete {path} (via Pages CMS)"
      rename: "Rename {oldPath} to {newPath} (via Pages CMS)"
```

| Key | Meaning |
| --- | --- |
| `hide` | `true` hides the Settings page (the `.pages.yml` editor) from the UI |
| `content.merge` | `false` (default) rewrites files from the schema and discards keys outside it; `true` merges submitted fields into the existing file and preserves unknown keys |
| `commit.identity` | `app` (default) lets GitHub attribute the commit to the App; `user` sends the current user's name and email |
| `commit.templates` | commit message templates per action |

Template tokens: `{action}`, `{path}`, `{filename}`, `{name}`, `{owner}`,
`{repo}`, `{branch}`, `{user}`, `{userName}`, `{userEmail}`, `{oldPath}`,
`{newPath}`, `{oldFilename}`, `{newFilename}`.

`templates` and `identity` can both be overridden per content entry and per
media source, via a `commit` key on that entry or source.

## actions

Buttons that dispatch a GitHub Actions workflow. Declared at the top level (for
the sidebar) or on a collection, file, or media source.

| Key | Required | Meaning |
| --- | --- | --- |
| `name` | yes | internal id |
| `label` | yes | button text |
| `workflow` | yes | workflow filename in `.github/workflows/` |
| `ref` | no | git ref; `current` uses the active branch |
| `scope` | no | on collections: `collection` or `entry` |
| `cancelable` | no | defaults to `true` |
| `confirm` | no | `false` to skip, or `{ title, message, button }` |
| `fields` | no | extra inputs collected before dispatch |

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

`inputs.payload` is one JSON object carrying `source` (`"pages-cms"`), `action`
(name, label), `repository` (owner, repo, ref, sha), `triggeredBy`, `context`
(type, name, path, data), and `inputs` (values from the action's `fields`).

Action `fields` take `name`, `label`, `type` (`text`, `textarea`, `select`,
`checkbox`, `number`), `required`, `default`, and `options` for selects.

GitHub users can rerun and cancel runs; collaborators can only cancel their
own. Cancellation is unavailable until a run exists.

## collaborators

Not configured in `.pages.yml` — they live in the Pages CMS database. Invited
by email, for people without GitHub accounts. They can open the repos they were
invited to and edit content and media, subject to each entry's `operations`.
They cannot manage `.pages.yml`, manage other collaborators, or reach cache
admin.

By default their writes go through the GitHub App installation token with no
committer metadata; `settings.commit.identity: user` attributes commits to them
instead.
