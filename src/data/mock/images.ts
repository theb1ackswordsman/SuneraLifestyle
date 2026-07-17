// ─── Stock imagery (Unsplash, hotlinked) ──────────────────────────────────────
// On-theme placeholder photos for the Ayurvedic wellness + ethnic-wear catalog.
// These are PLACEHOLDERS — the admin can replace every product image via the
// admin panel (Cloudinary upload). All IDs were visually verified.

export function img(id: string, w = 800): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export const STOCK = {
  wellness: {
    tea:         "1564890369478-c89ca6d9cde9", // teapot + herbal cup
    teaCup:      "1544787219-7f47ccb76574",     // cup of tea
    herbs:       "1615485500704-8e990f9900f7",  // loose herbs / churna
    powder:      "1610725664285-7c57e6eeac3f",  // herbal powder in pouch
    powderScoop: "1593095948071-474c5cc2989d",  // powder with scoop
    dropper:     "1608571423902-eed4a5ad8108",  // amber dropper bottle
    capsules:    "1584308666744-24d5c474f2ae",  // capsules / tablets
    spa:         "1600334129128-685c5582fd35",  // spa / wellness
  },
  ethnic: {
    saree:       "1610030469983-98e550d6193c",  // woman in saree
    kurti:       "1583391733956-3750e0ff4e8b",  // woman in anarkali kurti
  },
} as const;
