# Nocturne Flow — Design System

Nocturne Flow is the internal design system for **Nocturne Mail**, a responsive, interactive webmail prototype. This name is for project documentation, not a promotional label inside the application.

## Principles

1. **Content first.** A clear folder navigation, scannable message list, and spacious reading pane are the primary hierarchy.
2. **One visual language.** Warm-light surfaces, pine-green accents, consistent spacing, icon geometry, and typography.
3. **Motion explains state.** Transitions communicate selection, removal, and the appearance of a compose sheet; they never delay input.
4. **Honest demo.** No real synchronization, email transmission, attachment download, or security claims are presented as working functionality.

## Tokens

| Role | Value |
| --- | --- |
| Canvas | `#F6F7F5` |
| Surface | `#FFFFFF` |
| Ink | `#202722` |
| Muted text | `#6D7871` |
| Border | `#E3E9E4` |
| Primary accent | `#315E51` |
| Accent soft | `#E5EEE8` |
| UI font | Platform system sans-serif / Pretendard fallback |
| Small/medium/large radius | 10 / 12 / 18–20px |
| Spacing rhythm | 4 / 8 / 12 / 16 / 24 / 32px |

## Layout

- **Wide desktop:** 236px navigation, 355–410px message list, flexible reader.
- **Compact desktop/tablet (up to 960px):** Navigation moves to a dismissible drawer.
- **Mobile (up to 700px):** Single-column list and reading screens with a visible back action.
- **Compose:** Accessible dialog with focus management; anchored floating sheet on desktop and bottom sheet on small screens.

## Motion

| Event | Treatment | Approximate duration |
| --- | --- | --- |
| Select message | Reading content fades and moves up slightly | 180ms |
| Archive/delete | List item fades/slides out, others reflow | 200ms |
| Open/close compose | Sheet slides and fades | 200–300ms |
| Open navigation drawer | Horizontal ease-out movement | 260ms |
| Hover/press buttons | Small color and scale feedback | 120–160ms |

All animations are optional. The application honors `prefers-reduced-motion` and uses almost-instant state changes when it is enabled. Movement favors `opacity` and `transform`, and repeated rows do not animate unnecessarily on initial load.

## Interactions

- Keyboard: `/` or `Ctrl/⌘ K` focuses search; `C` opens compose when not typing; Escape closes the navigation menu.
- Read/unread, stars, archive, snooze, and delete are local session state only.
- Compose requires recipient, subject, and body. “Send” adds a local demo entry to Sent; it never transmits an email.
- Empty folders, empty search results, and unavailable attachments explain their state instead of presenting fake data.

## Quality gates

- Run `pnpm check` and `pnpm run build:vercel`.
- Review desktop/tablet/mobile layouts and test keyboard focus, dialog dismissal, message selection, and compose flow.
- Check contrast, target sizes, horizontal overflow, and reduced-motion behavior before publishing.
