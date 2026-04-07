# Design System

Live reference: Palette icon button (bottom-right dev menu)
Definitions: `web/src/styles/variables.css`

**Border rule:** All borders use `--quaternary` unless explicitly specified otherwise. Never use `--black-alpha-`* or `rgba(0,0,0,*)` for borders.

---

### Colors

| Token                   | Hex     | Usage                               |
| ----------------------- | ------- | ----------------------------------- |
| `--primary`             | #3F3F46 | Text, interactive elements, strokes |
| `--secondary`           | #A1A1AA | Secondary text, hints               |
| `--tertiary`            | #D4D4D8 | Disabled states, light strokes      |
| `--quaternary`          | #E4E4E7 | Card borders, dividers              |
| `--white`               | #FFFFFF | Backgrounds                         |
| `--brand-pink`          | #ff9a9a | Brand accent                        |
| `--background-blue`     | #E0F1FC | Info backgrounds                    |
| `--background-gray`     | #E4E4E7 | Neutral backgrounds                 |
| `--background-green`    | #E6F6F3 | Success backgrounds                 |
| `--background-navy`     | #F4F6F7 | Light navy backgrounds              |
| `--background-pink`     | #FFE6E6 | Icon backgrounds                    |
| `--accent-navy-dark`    | #1E384A | Dark navy text/icons                |
| `--accent-navy-mid`     | #698192 | Mid navy text                       |
| `--accent-navy-light`   | #A9B7C1 | Light navy accents                  |
| `--accent-green-dark`   | #327A72 | Dark green text/icons               |
| `--accent-green-mid`    | #4BA098 | Success states, badges              |
| `--accent-green-light`  | #9DD9CF | Light green accents                 |
| `--accent-blue-dark`    | #2A5AA7 | Dark blue text/icons                |
| `--accent-blue-mid`     | #3B73CE | Selected states, links              |
| `--accent-blue-light`   | #90BBEF | Light blue accents                  |
| `--accent-yellow-dark`  | #E6A93B | Dark yellow text/icons              |
| `--accent-yellow-mid`   | #FFD07B | Warning states                      |
| `--accent-yellow-light` | #FFEED0 | Light yellow accents                |

---

### Typography Classes

| Class                     | Usage                                                         |
| ------------------------- | ------------------------------------------------------------- |
| `.type-tagline`           | Greeting headline ("Hey Sam...") - Quincy 36px/700            |
| `.type-prompt-question`   | AI prompts ("Where do you want to start?") - 20px/400 primary |
| `.type-section-header-lg` | Section titles large - 18px/700 primary                       |
| `.type-section-header-md` | Section titles medium - 16px/700 primary                      |
| `.type-section-header-sm` | Section titles small - 14px/700 primary                       |
| `.type-chip-header-lg`    | Chip header large - 16px/600 primary                          |
| `.type-chip-header-md`    | Chip header medium - 14px/600 primary                         |
| `.type-chip-header-sm`    | Chip header small - 12px/600 primary                          |
| `.type-chip-label-lg`     | Chip label large - 16px/400 primary                           |
| `.type-chip-label-md`     | Chip label medium - 14px/400 primary                          |
| `.type-body-lg`           | Body text large - 16px/400 primary                            |
| `.type-body-md`           | Body text medium - 14px/400 primary                           |
| `.type-body-sm`           | Body text small - 12px/400 primary                            |
| `.type-label-lg`          | Label large - 16px/500 primary                                |
| `.type-label-md`          | Label medium - 14px/500 primary                               |
| `.type-label-sm`          | Label small - 12px/500 primary                                |
| `.type-placeholder`       | Input placeholders - 16px/400 secondary                       |

**Type Style Usage:**

- Welcome nav chips (static): `.type-chip-header-lg`
- Conversational nav chips (compact): `.type-chip-header-md`
- Single-select message chips: `.type-chip-label-md`
- Multi-select message chips: `.type-chip-label-md`
- Role selector chips: `.type-chip-label-md`

---

### Components

Global interactive components shared across variants.

| Component                       | Location          | Usage                              |
| ------------------------------- | ----------------- | ---------------------------------- |
| `NavChipGrid variant="welcome"` | NavChips.tsx      | Welcome screen 3x2 card grid       |
| `NavChipGrid variant="compact"` | NavChips.tsx      | Conversation nav bar               |
| `MessageChip` (single)          | ChatInterface.tsx | Single-select options with check   |
| `MessageChip` (multi)           | ChatInterface.tsx | Multi-select with plus/check icons |

**Shared states:** Hover/Active = `--app-primary` border + `--gray-50` background

> V2-specific components (persona cards, journey tiles, location chips, etc.) → see `claude-v2.md` → Design System

---

### Text Inputs

All chat text inputs share these styles. Classes: `.welcome-input`, `.inline-input`, `.chat-input`, `.location-search-input`

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| Background        | `--primary` (#3F3F46)                    |
| Placeholder color | `--secondary` (#A1A1AA)                  |
| Text color        | `--primary` (#3F3F46)                    |
| Border            | 1px `--quaternary`, radius `--radius-lg` |
| Focus             | border changes to `--blue-400`           |

---

### Worker Cards

Three variants with shared header component. All headers have avatar, name, and badges vertically centered (align-items: center).

| Variant             | Class                       | Specs                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkerCardTeaser`  | `.worker-card-teaser`       | Minimal to entice. Header + "What retailers are saying about [Name]" AI summary. Label: `.type-section-header-sm`, Summary: 14px/400 primary, line-height 20px, Gap: 4px, No Actively Looking badge (`showActivelyLooking={false}`)                                                                                                                               |
| `WorkerCardCompact` | `.worker-card-compact`      | Chat view. Quote, work history, endorsements with +counts, store quotes                                                                                                                                                                                                                                                                                           |
| `WorkerCardFull`    | `.worker-card-full-overlay` | Detail panel. 35vw width, fixed right, close button (36px circle, primary bg, white X), Header: avatar + name stacked with location/shift verified, Section titles: 18px/700 primary (`.type-section-header`), Sections: 20px padding, 1px dividers, About: 16px primary (no italics), Stats: 28px bold + 12px labels. Clicking WorkerCardTeaser opens this panel |

**Shared Header:** `WorkerCardHeader` component

| Property | Value                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar   | 40px (default) or 64px (large via `size="large"`)                                                                                                                                                  |
| Name     | `.type-section-header-lg`                                                                                                                                                                          |
| Layout   | flex row, vertically centered; Shift Verified badge pushed to right via `margin-left: auto`                                                                                                        |
| Badges   | Shift Verified: `tag-green tag-sm` + BadgeCheck icon (right-aligned). Actively Looking: `tag-blue tag-sm` + Search icon. Hidden on Teaser (`showActivelyLooking={false}`), visible on Compact/Full |
| Props    | `showActivelyLooking` (default `true`) - pass `false` on WorkerCardTeaser                                                                                                                          |

---

### Worker Connection Status Model

V2-specific. See `claude-v2.md` → Milestone 4 for the full status model, flow diagram, status tags, and chat button rules.
