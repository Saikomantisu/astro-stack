# Patterns beyond a plain collection

An index. Each pattern lives in its own file under `patterns/` — read the row
you need, not the set.

Everything here is a structural choice about somebody else's workflow, so the
rule from `SKILL.md` applies: propose it, get an answer, then build it. None of
these is a default. Each file says whether it is yours to decide or the user's.

| What you are looking at | Read | Gives you |
| --- | --- | --- |
| Several collections on one subject crowding the sidebar | [`patterns/groups.md`](patterns/groups.md) | `type: group` + `items`, navigation-only nesting |
| Site config, a landing page, `robots.txt`, a JSON array | [`patterns/singletons.md`](patterns/singletons.md) | `type: file`, `list: true` on a file, raw / code / datagrid editors |
| The same field group repeated on three collections | [`patterns/components.md`](patterns/components.md) | `components` + `component:` on a field |
| A page assembled from reorderable sections | [`patterns/blocks.md`](patterns/blocks.md) | `type: block`, `blocks`, `blockKey` |
| Editors who should not create, rename, or delete | [`patterns/operations.md`](patterns/operations.md) | `operations` and its per-type defaults |
| Omitted fields being wiped, or useless commit messages | [`patterns/settings.md`](patterns/settings.md) | `settings.content.merge`, `commit.identity`, templates |
| A button that should kick off CI | [`patterns/actions.md`](patterns/actions.md) | `actions`, workflow dispatch, the `payload` input |

## If you only read one thing

Two of these bite silently, so check them even when you are not reaching for
the pattern deliberately:

- **`settings.content.merge`** defaults to `false`, which means saving an entry
  rewrites the file from the schema and **deletes every key the config does not
  declare**. Any deliberate omission needs `merge: true`.
  ([`patterns/settings.md`](patterns/settings.md))
- **`blockKey`** defaults to `_block`, which is not what an Astro
  `discriminatedUnion` discriminates on. A block field left at the default
  saves cleanly in the CMS and fails `astro build`.
  ([`patterns/blocks.md`](patterns/blocks.md))

For exact syntax of any key mentioned here, see
[`pagescms-config.md`](pagescms-config.md).
