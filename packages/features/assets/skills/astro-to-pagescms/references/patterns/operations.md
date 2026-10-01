# Operations: what editors are allowed to do

**Use when:** Editors should not be able to create, rename, or delete something.

**Decide yourself** when the routes make it obvious — a collection whose filenames are live URLs should not be renameable. Ask when it is a preference about trust.

```yaml
operations:
  create: false
  rename: false
  delete: false
```

Defaults: collections allow all three; files allow create and delete but not
rename.

The one that matters for Astro is `rename`. A collection entry's filename is
usually its URL slug, so renaming is publishing a redirect nobody wrote. Turn
it off on any collection whose routes are indexed, and say why in a comment.

`delete: false` on singletons, as above.
