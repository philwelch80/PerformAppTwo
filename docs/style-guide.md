# Style guide

Tokens live in `src/tokens.css` (single source). Pictures are in `docs/mockups/`. Where a mockup breaks a rule below, follow the rule.

## Look
Teal accent, Inter Tight, dark header, cool neutrals, light theme only (no dark mode). No other fonts; numbers use tabular numerals.

## Rules
1. **Colour never carries meaning alone.** Session types show S / C / R beside the tint. Selected = outline, not just colour.
2. **Phase, subphase and block bands are neutral** (`--band-*`). The mockups tint them with session-type colours; that is wrong.
3. **One selected thing:** outline only the selected row or cell, not its ancestors.
4. **Touch targets are 44 px** (`--control-touch`). `--control-compact` (36 px) is for dense desktop rows only.
5. **Text contrast is at least 4.5:1** on its background. Use `--text-muted` for secondary text, never the mockups' lighter greys. `--line-dashed` is for borders only, never text.
6. **One focus ring:** 2 px `--focus-ring`, visible on every interactive element.
7. **Destructive actions** use `--danger` text on a secondary button, in the same place every time, and always a confirm dialog that says what is lost.

## Components
| Component | Style |
|---|---|
| Header | `--header` 64 px, brand 18/700, tabs 14/600 with `--header-raised` on the active one, right-aligned "Prototype · shared plan" pill (`--header-line` border) |
| Primary button | `--accent` fill, white text, 14/600, 44 px, `--radius-s`, padding 0 16px |
| Secondary button | white, 1px `--line-strong`, `--text`, same size |
| Danger button | secondary style with `--danger` text |
| Input / select | white, 1px `--line-strong`, 44 px (40 px in panels), `--radius-s`, 14 px |
| Tag pill | 12/600, `--surface-sunken`, `--radius-pill`; selected = `--accent-soft` with `--accent-strong` text |
| Card | white, 1px `--line`, `--radius-m`, padding 16–24 |
| Session chip (grid cell) | session-type bg and fg, 12/600, `--radius-s`, min height 30 px |
| Empty slot | 1px dashed `--line` border, no fill |
| Modal / panel | white, `--radius-l`, title 20/700 with `--tracking-title`, 14 px subtitle in `--text-soft`, actions bottom-right (Cancel secondary, then primary) |
| Section label | 11/700 uppercase, `--tracking-label`, `--text-muted` |
| Quick-view panel | `--panel-width` (420 px), right-hand, slides in |

## Dropped on purpose
Dark mode, IBM Plex, amber accent, any second font or accent colour.
