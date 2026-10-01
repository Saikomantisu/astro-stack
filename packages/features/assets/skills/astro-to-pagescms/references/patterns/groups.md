# Groups: one sidebar menu, many collections

**Use when:** Several collections crowd the sidebar and belong to one subject.

**Ask first.** Which collections belong together is the user's call. The upside: grouping is navigation only, so nothing moves on disk and the worst case is a menu somebody dislikes.

A site with `products`, `productCategories`, `productReviews`, and
`productFaqs` gives editors four top-level menu items that all say "product".
`type: group` nests them into one.

```yaml
content:
  - name: products_menu
    label: Products
    type: group
    items:
      - name: products
        label: All products
        type: collection
        path: src/content/products
        filename: "{primary}.md"
        format: yaml-frontmatter
        fields: [...]
      - name: productCategories
        label: Categories
        type: collection
        path: src/content/product-categories
        filename: "{primary}.md"
        format: yaml-frontmatter
        fields: [...]
```

Four things matter about this.

A group is navigation only. It has no `path`, creates no editor route, and
changes nothing on disk — the files stay exactly where Astro expects them. That
is what makes grouping safe to offer: the worst case is a menu somebody
dislikes.

The nested collections keep their own `name`, and that `name` still has to
match the Astro collection key. The group's `name` is separate and is not an
Astro anything, so give it something that cannot collide — `products_menu`, not
`products`.

`reference()` still points at the collection name, not the group. Nesting
does not change addressing.

Groups can contain groups, collections, and files, so a docs site can be
`Docs > Guides / API / Changelog` with a settings file in the same menu.

Ask before grouping. Two collections rarely need it; five almost always do. The
question to put to the user is which collections belong together, not whether
grouping is a good idea in the abstract.
