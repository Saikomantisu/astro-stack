import type { CollectionEntry } from "astro:content";

export type NewsEntry = CollectionEntry<"news">;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

export function sortNews(entries: NewsEntry[]): NewsEntry[] {
  return entries.toSorted(
    (a, b) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
      b.data.order - a.data.order,
  );
}

export function formatNewsDate(date: Date): string {
  return dateFormatter.format(date);
}
