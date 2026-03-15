# PRD: UI / UX

## Design intent

The app should feel like a refined digital journal page:
- calm
- premium
- spacious
- warm but minimal
- modern rather than nostalgic

The inspiration is subtle notebook/journal language, not a literal paper simulation.

## Platform priorities

- excellent on mobile web
- excellent on desktop
- responsive by design
- likely future native app candidate, so keep patterns clean

## Visual principles

- generous whitespace
- clear hierarchy
- soft dividers
- elegant typography rhythm
- restrained color use
- blue accent/highlight
- tasteful use of emoji
- notebook-inspired layout hints such as lines or ruled spacing only where helpful

## Theming

### Light mode
- clean paper-like background
- dark ink text
- soft gray dividers
- blue accent

### Dark mode
- black/charcoal surfaces
- muted contrast layers
- blue accent remains the primary interactive color
- avoid overly saturated neon look

## Layout model

### Top bar
Keep it small and quiet.

Contains:
- current date or viewed date
- quick navigation
- theme toggle
- settings access

### Main content
A focused central reading/writing column.

On larger screens:
- centered main column with breathing room
- optional small contextual side area only if it adds real value

On mobile:
- everything should collapse gracefully into one primary flow

## Writing experience

This is the most important interaction in the product.

When the user engages a large text field:
- open a large elegant modal/sheet/card
- it should take up most of the page
- the background should blur or dim
- the writing surface should feel clean and distraction-light
- show just enough surrounding context to feel grounded

The writing surface should resemble a modern journal page:
- large comfortable text area
- clear cursor visibility
- optional faint ruled guidance
- excellent spacing
- no cramped forms

## Daily screen composition

Recommended order:
1. mood picker
2. morning prompts
3. to relax list
4. daily capture
5. evening prompts
6. images
7. tags

This can adapt slightly on small screens, but should preserve emotional/logical flow.

## Components

Use shadcn/ui as the base design system where it fits:
- buttons
- cards
- dialog/drawer/sheet
- inputs
- textarea
- tooltip
- dropdown menu
- calendar/popover where needed

Do not let the app look like a generic admin dashboard.

Create a thin journal-specific layer of reusable components, for example:
- `JournalPageShell`
- `EntrySection`
- `MoodPicker`
- `WritingModal`
- `RelaxList`
- `TagChips`
- `ImageStrip`
- `WeeklyReflectionCard`

## Motion

Motion should be subtle:
- soft modal entrance
- quick but calm hover/press states
- non-jarring success/save indicators

Avoid:
- bouncy animations
- flashy transitions
- heavy parallax

## Mood picker UX

Requirements:
- instantly understandable
- 1-tap selection
- visible current selection
- large enough tap targets on mobile
- emoji-first, label-second

## Image attachment UX

Requirements:
- drag/drop on desktop if easy
- tap upload on mobile
- visible upload progress or saving state
- thumbnail previews
- easy remove before final save if practical

## Date browsing UX

Needs to be effortless.

Preferred controls:
- previous day
- next day
- jump to today
- compact date picker or mini calendar

A heavy full dashboard calendar is not required for MVP.

## Weekly reflection UX

Should feel slightly more intentional than the daily flow, but still minimal.

Use:
- section cards or clean blocks
- mood/week summary at top
- life-area rating controls
- open text blocks for reflection
- links to the days in that week

## Empty states

Should feel warm and inviting, not sterile.

Examples:
- no entry yet for this date
- no weekly reflection yet
- no tags yet
- no images yet

## Accessibility basics

- strong keyboard support on desktop
- visible focus states
- sufficient contrast in both themes
- touch-friendly targets on mobile
- labels not conveyed by color alone

## Anti-patterns to avoid

- dense settings-heavy layouts
- admin-dashboard visuals
- tiny textareas embedded inline for long writing
- too many cards fighting for attention
- aggressive borders/shadows everywhere
- over-skeuomorphic fake paper effects
