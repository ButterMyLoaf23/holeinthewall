# Rexburg Bites UX wireframes

These low-fidelity wireframes describe the responsive layout in `src/index.html` and `src/css/styles.css`. They keep the content light so the team can review hierarchy and flow before adding more visual detail.

## Desktop: explore and compare

```text
┌──────────────────────────────────────────────────────────────────────┐
│ RB rexburgbites       Explore   Favorites (0)       Sign in  ◐ Share │
├──────────────────────────────────────────────────────────────────────┤
│ Your local table awaits                         ● Rexburg, ID         │
│ Good food is closer than you think.             28 places nearby      │
│ Find spots locals keep coming back to.                                │
│ [ Search restaurants, dishes, or neighborhoods ] [All] [Coffee] ...  │
├───────────────────────────────┬──────────────────────────────────────┤
│ CURATED FOR YOU                │              INTERACTIVE MAP          │
│ 6 places to try      Top rated │                                      │
│ ─────────────────────────────  │                         [Re-center]   │
│ [image] Restaurant name   ♡    │  • Featured local spots              │
│         cuisine · ★ 4.8       │                                      │
│ [image] Restaurant name   ♡    │                                      │
└───────────────────────────────┴──────────────────────────────────────┘
```

## Mobile: search first, map second

```text
┌──────────────────────────┐
│ RB rexburgbites   ☼  ☰   │
├──────────────────────────┤
│ Good food is             │
│ closer than you think.   │
│ ● Rexburg, ID            │
│ [ Search...              ]│
│ [All] [Coffee] [Mexican] │  ← horizontal scroll
├──────────────────────────┤
│ 6 places to try  Top rated│
│ [image] Restaurant    ♡  │
│         cuisine · rating │
│ [image] Restaurant    ♡  │
│         cuisine · rating │
├──────────────────────────┤
│        MAP PREVIEW        │
│                  [Re-center]
└──────────────────────────┘
```

## Accessibility notes

- A skip link moves keyboard and screen-reader users directly to the finder.
- Results announce updates with `aria-live`; favorite changes use a short status message.
- Restaurant cards support Enter and Space, while favorite buttons remain independently actionable.
- Focus rings, contrast-aware colors, 44px touch targets, and reduced-motion support are included in the CSS.
