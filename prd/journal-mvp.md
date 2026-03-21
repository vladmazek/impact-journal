# PRD: Journal MVP

## Purpose

Define the current minimum lovable product for Impact Journal.

## Product position

Impact Journal is a private, elegant journal for one person. It combines quick emotional check-ins, a calm writing space, lightweight tags, image attachments, and a weekly reflection rhythm.

## Target user

The sole user of the app:

- wants a very low-friction daily journaling habit
- likes a guided structure without feeling boxed in
- wants room for free writing
- wants a calm, premium interface
- sometimes wants to attach a photo to remember the day
- wants the journal to stay personal, private, and lightweight

## MVP goals

- make daily journaling easy enough to actually use
- preserve emotional context with minimal effort
- support both short structured prompts and longer reflection
- allow quick photo capture/attachment
- make browsing by date feel natural
- keep the interface calm instead of dashboard-heavy

## Core objects

- User
- DailyEntry
- WeeklyReflection
- Tag
- ImageAttachment

## Daily journaling flow

### Quote-first header

Every daily entry opens with a single motivational quote.

Current behavior:

- one random quote per page load
- author shown in the accent position
- quote shown as the primary header content

### Fast mood check

One-tap mood choice using 7 emoji options.

Current set:

- 😄 Great
- 🙂 Good
- 😐 Okay
- 😮‍💨 Tired
- 😣 Stressed
- 😔 Low
- 😤 Angry

Store both:

- internal value
- display emoji/label pairing

After selection:

- the picker collapses
- a sidebar mood anchor appears
- clicking the sidebar mood anchor reopens the picker

Before selection:

- no sidebar mood anchor should appear

### Morning section

Fields:

- gratitude item 1
- gratitude item 2
- gratitude item 3
- what would make today great
- daily affirmation

Current layout:

- one full-width grouped card for the three gratitude lines
- two writing cards below for `what would make today great` and `daily affirmation`
- stacked vertically on mobile and two-up on larger screens where it helps
- the open header includes a sunrise illustration, with a tiny accent-only version on phone widths

### “To relax” list

A small lightweight list for things that help the user unwind later.

MVP shape:

- 0 to 5 short items
- quick add/remove
- no nested tasks or due dates

### Daily capture

A free-form long writing area for:

- notes about the day
- annoyances
- observations
- anything that does not fit the structured prompts
- optional image attachment context

### Evening section

Fields:

- amazing/good thing 1
- amazing/good thing 2
- amazing/good thing 3
- how could today have been better / what to improve tomorrow

Current layout:

- one full-width grouped card for the three good things
- one wide reflection card below for `how could today have gone better?`
- stacked cleanly on mobile without a separate comparison mode
- the open header includes a moon-and-stars night illustration, with a tiny accent-only version on phone widths

### Prompt accordion behavior

Current behavior:

- on today's page, morning/evening prompt accordions default from the saved timezone
- before local noon: morning open, evening collapsed
- from local noon onward: evening open, morning collapsed
- on non-today entries: both prompt sections start expanded

## Weekly reflection flow

Create one reflection per ISO week.

Fields:

- overall week mood
- energy level summary
- wins
- hard moments
- what felt off
- intention for next week

Life-area rating set for MVP:

- work
- family/home
- health
- stress
- personal fulfillment

Each life area:

- simple 1–5 rating
- optional short note

Weekly screen should also show:

- the moods chosen across that week
- count of completed daily entries
- quick links back to the week's days

## Entry behaviors

### One entry per date

The app maintains one daily entry per local calendar date.

### Save behavior

Preferred behavior:

- autosave after a short debounce
- visible save reassurance in the UI

### Completion model

The app uses simple inferred states:

- not started
- in progress
- completed

Completion is inferred from mood plus meaningful content.

## Tags

MVP tag features:

- reusable tags
- manual add/remove from a lightweight sidebar control
- type `#tag` in entry text to suggest/create a tag
- parsed hashtags harvested from morning fields, evening fields, and daily capture
- manual tags preserved independently from parsed tags

Non-goals:

- nested tags
- tag groups
- boolean search language

## Images

MVP image features:

- upload image to daily entry
- show gallery/previews on the entry
- click/tap to enlarge
- delete from the entry

Accepted file types:

- jpeg
- png
- webp
- heic/heif when the runtime can process them

Non-goals:

- PDFs
- audio
- video
- OCR
- advanced editing

## Browse and navigation

Primary navigation modes:

- today
- previous/next day
- compact calendar navigation
- weekly reflection page
- day/week toggle in the top bar

The app is mostly browsed by date, not by complex search.

## Settings for MVP

Current settings page includes:

- theme
- display name
- login email
- home location autocomplete
- derived timezone
- avatar upload
- password change

## Success criteria

The MVP is successful if the user can:

- log in
- open today's entry
- read the quote-first header without extra dashboard clutter
- complete the guided prompts
- choose a mood in one tap
- jot a free-form reflection
- add one or more images
- add tags easily
- revisit prior days
- complete one weekly reflection
- update account details and home location
- feel that the app is pleasant enough to use daily

## Explicit non-goals

- public pages
- social/community features
- AI coaching
- reminders
- advanced analytics
- sharing/export workflows
- multiple journals/workspaces
