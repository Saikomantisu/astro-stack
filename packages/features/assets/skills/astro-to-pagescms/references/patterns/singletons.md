# Singletons: `type: file`

**Use when:** Content that is one file, not a folder: site config, a landing page, robots.txt, a JSON array.

**Ask first** when it means moving values out of `.ts` source into a data file — that is a change to the user's code. A `type: file` entry over a data file that already exists is just mapping.

Astro sites keep site-wide values in a `.ts` export, a JSON file, or a YAML
file under `src/`. Anything that is not a `.ts` export can go straight into the
CMS.

```yaml
content:
  - name: site
    label: Site settings
    type: file
    path: src/data/site.yml
    format: yaml
    operations:
      delete: false
    fields:
      - name: title
        type: string
        required: true
      - name: tagline
        type: text
      - name: social
        type: object
        fields:
          - name: twitter
            type: string
          - name: github
            type: string
```

`operations.delete: false` is worth setting on any singleton. Files default to
create `true`, rename `false`, delete `true`, and a deleted `site.yml` breaks
the build for everyone.

If the values currently live in `src/config.ts` as a TypeScript export, the CMS
cannot edit them — it edits data files, not source. Moving them to YAML and
importing that instead is a code change to the user's repo, so ask first.

## A file that is one array

`src/data/authors.json` holding `[{ name, email, avatar }, ...]` maps to a file
entry with `list: true`, where `fields` describes one element:

```yaml
- name: authors
  label: Authors
  type: file
  path: src/data/authors.json
  format: json
  list: true
  fields:
    - name: name
      type: string
    - name: email
      type: string
    - name: avatar
      type: image
```

This is also what an Astro `file()` loader points at, so a collection defined
with `loader: file("src/data/authors.json")` becomes this, not a
`type: collection`.

## Files with no schema at all

Omit `fields` and Pages CMS falls back to a raw text editor. Good for
`public/robots.txt`, a `_headers` file, anything editors occasionally need to
touch as text.

```yaml
- name: robots
  label: robots.txt
  type: file
  path: public/robots.txt
```

`format: code` gets syntax highlighting instead, and `format: datagrid` gets a
spreadsheet — inferred automatically for `.csv`, so a pricing table in
`src/data/pricing.csv` becomes an editable grid with no extra config.
