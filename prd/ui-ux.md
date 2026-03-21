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
- notebook-inspired layout hints only where they help

## Theming

### Light mode

- clean paper-like background
- dark ink text
- soft gray dividers
- blue accent

### Dark mode

- charcoal surfaces
- muted contrast layers
- blue accent remains the primary interactive color
- avoid overly saturated neon styling

Future theme polish candidate:

- subtle day/night environmental cues such as minimalist sun-up or moon-up background graphics
- these should clarify morning versus evening without becoming decorative clutter
- prefer stronger, clean color over washed-out pastel treatment

## Layout model

### Top bar

Keep it small and quiet.

Current contents:

- brand icon and journal title linking back to today's entry
- current viewed date
- day/week switcher on the right
- theme toggle
- settings access

### Main content

Use a focused main column plus a real but minimal sidebar on larger screens.

Current larger-screen rhythm:

- main content holds the quote header and journal sections
- sidebar holds only contextual surfaces that earn their space

On mobile:

- the full experience collapses into one primary flow
- sidebar surfaces stack naturally below the main column

## Writing experience

This is the most important interaction in the product.

When the user engages a large text field:

- open a large elegant modal/sheet/card
- let it take most of the viewport
- dim or blur the background
- keep the writing surface clean and distraction-light
- show just enough surrounding context to feel grounded

For structured prompt cards:

- short fields should feel like part of the journal page, not like admin controls
- remove decorative markers or helper labels when they do not improve clarity
- return reclaimed space to the writing area instead of replacing it with more chrome

## Daily screen composition

Current intended order:

1. quote-only header
2. mood picker
3. morning prompt accordion
4. to relax list
5. free-form writing space
6. evening prompt accordion
7. sidebar with mood anchor, images, and tags

Behavior notes:

- today's prompt accordions default from local time in the saved timezone
- non-today entries start with both prompt sections expanded
- the mood anchor bubble appears only after a mood is selected
- prompt bodies use permanent card-based layouts instead of a switchable comparison mode
- morning uses one grouped three-line card plus two quieter writing cards below
- evening uses one grouped three-line card plus one wide reflection card below
- open prompt headers may use restrained ambient illustrations that reinforce morning versus evening
- on phone widths, those illustrations should collapse into tiny accents instead of competing with the writing

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
- `DateNavigation`
- `WeeklyReflectionCard`

## Motion

Motion should be subtle:

- soft modal entrance
- quick but calm hover/press states
- non-jarring save indicators

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
- no redundant sidebar empty state before selection

## Image attachment UX

Requirements:

- tap upload on mobile
- visible upload or saving state
- thumbnail previews
- easy preview and delete
- lightweight sidebar presentation instead of a large explanatory block

## Tag UX

Requirements:

- selected tags stay visible and compact
- `+ tag` reveals the input only when needed
- parsed hashtag chips stay visually lighter than manual tags
- no extra helper copy or suggestion blocks competing for space

## Date browsing UX

Needs to be effortless.

Preferred controls:

- previous day
- next day
- jump to today through the brand link
- compact calendar navigation
- quick day/week switching

A heavy dashboard calendar is not required.

## Weekly reflection UX

Should feel slightly more intentional than the daily flow, but still minimal.

Use:

- clean section cards
- mood/week summary at top
- life-area rating controls
- open text blocks for reflection
- links to the days in that week

## Empty states

Should feel warm and inviting, not sterile.

Examples:

- no entry yet for this date
- no weekly reflection yet
- no images yet

Avoid empty-state chrome that adds space without helping the user.

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
