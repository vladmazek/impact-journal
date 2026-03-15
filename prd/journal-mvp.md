# PRD: Journal MVP

## Purpose

Define the minimum lovable product for Impact Journal.

## Product position

Impact Journal is a private, elegant journal for one person. It combines quick daily emotional check-ins with a calm writing space and lightweight weekly reflection.

## Target user

The sole user of the app:
- wants a very low-friction daily journaling habit
- likes a guided structure
- wants room for free writing
- wants a calm, premium interface
- sometimes wants to attach a photo to remember the day

## MVP goals

- make daily journaling easy enough to actually use
- preserve emotional context with minimal effort
- support both short structured prompts and longer reflection
- allow quick photo capture/attachment
- make browsing by date feel natural

## Core objects

- User
- DailyEntry
- WeeklyReflection
- Tag
- ImageAttachment

## Daily journaling flow

### Morning section
Fields:
- gratitude item 1
- gratitude item 2
- gratitude item 3
- what would make today great
- daily affirmation

### Fast mood check
One-tap mood choice using 6–7 emoji options.

Recommended default set:
- 😄 Great
- 🙂 Good
- 😐 Okay
- 😮‍💨 Tired
- 😣 Stressed
- 😔 Low
- 😤 Overwhelmed

Store both:
- internal value
- display emoji/label pairing

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
- quick links back to the week’s days

## Entry behaviors

### One entry per date
The app should maintain one daily entry per local calendar date.

### Save behavior
Accept either:
- explicit save button with dirty-state indicator, or
- autosave with visible save state

Preferred:
- autosave after short debounce plus explicit reassurance in UI

### Completion model
Entry does not need a heavy workflow engine.

Support simple states:
- not started
- in progress
- completed

Completion can be inferred from meaningful content presence.

## Tags

MVP tag features:
- reusable tags
- tap existing tag chip to add to entry
- type `#tag` in free text to suggest/create a tag
- tags displayed on entry card/header

Non-goals:
- nested tags
- tag groups
- boolean search language

## Images

MVP image features:
- upload image to daily entry
- optionally add caption later if easy, otherwise skip for MVP
- show small gallery/previews on the entry
- click/tap to enlarge only if easy; otherwise basic preview is sufficient

Accepted file types:
- jpeg
- png
- webp
- heic only if practical; otherwise defer

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
- date picker or compact calendar
- weekly reflection page

The app is mostly browsed by date, not by complex search.

## Settings for MVP

Minimal settings page:
- theme
- account email display
- password change if easy
- maybe mood label customization later, but not required

## Success criteria

The MVP is successful if the user can:
- log in
- open today’s entry
- complete the guided prompts
- choose a mood in one tap
- jot a free-form reflection
- add one or more images
- add tags easily
- revisit prior days
- complete one weekly reflection
- feel that the app is pleasant enough to use daily

## Explicit non-goals

- public pages
- social/community features
- AI coaching
- reminders
- advanced analytics
- sharing/export workflows
- multiple journals/workspaces
