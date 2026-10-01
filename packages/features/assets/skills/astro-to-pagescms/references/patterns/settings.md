# Settings

**Use when:** Repo-wide behavior: preserving omitted fields, commit messages, commit attribution.

**Decide yourself.** `merge` follows from what the config omits and `identity` from who is editing. Neither is a matter of taste.

```yaml
settings:
  hide: false
  content:
    merge: true
  commit:
    identity: user
    templates:
      create: "content: add {filename}"
      update: "content: update {filename}"
      delete: "content: remove {filename}"
      rename: "content: rename {oldFilename} -> {newFilename}"
```

`content.merge` is the one with teeth — see the omission section in `SKILL.md`.
Default `false` rewrites files from the schema and drops unknown keys; `true`
merges and preserves them.

`commit.identity` defaults to `app`, which attributes every edit to the GitHub
App. Setting it to `user` puts the editor's name and email on the commit, which
is what makes `git log` useful on a site with several writers. Collaborators
invited by email get attributed this way too.

Commit templates take `{action}`, `{path}`, `{filename}`, `{name}`, `{owner}`,
`{repo}`, `{branch}`, `{user}`, `{userName}`, `{userEmail}`, `{oldPath}`,
`{newPath}`, `{oldFilename}`, `{newFilename}`. Two Astro-specific uses: match
a conventional-commit convention the repo already enforces in CI, or include
`[skip ci]` on media commits so uploads do not each trigger a build.

Templates can be overridden per content entry and per media source.

`hide: true` hides the Settings page — that is, the `.pages.yml` editor — from
the UI. Useful once the config is stable and the people using the CMS have no
reason to edit it.
