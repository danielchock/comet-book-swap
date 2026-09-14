# Comet Book Swap

A free, student-run textbook exchange board for UT Dallas — post a book you're
selling, or a book you're looking for, and connect directly with another Comet
to work out the trade.

**Live site:** https://danielchock.github.io/comet-book-swap/

## The problem

UTD students currently juggle a handful of bad options for offloading or
finding used course textbooks:

- The campus bookstore's buyback and "used" prices are set by the store, not
  the market, and rarely favor the student.
- General marketplaces (Facebook Marketplace, Craigslist, Chegg) aren't
  scoped to UTD or to course codes, so a listing for "CS 3345" gets lost
  among unrelated ads, and buyers can't tell if a book actually matches their
  syllabus.
- Class GroupMe/Discord "anyone selling their textbook?" messages work for a
  day and then scroll off into the void — there's no persistent, searchable
  place to look.

Comet Book Swap is a single, lightweight board scoped to UTD course codes.
A seller lists a book once; anyone searching that course code finds it.
There's no listing fee, no shipping, no middleman — buyer and seller just
coordinate directly over NetID, email, or Discord and meet up on campus.

## What it does

- **Post a listing** as either *selling* (you have a book) or *wanted*
  (you're looking for one), with book title, course code, price (or budget),
  condition, optional notes, and a contact method.
- **Browse & search** listings in a card grid, filterable by type and
  searchable by course code or title.
- **Mark listings as sold** — sold listings drop out of the default view but
  can be revealed with a toggle, so the board doesn't get cluttered with
  stale posts.
- Everything is **stored locally in the browser** (`localStorage`) — there is
  no server, database, or account system. It ships pre-seeded with a couple
  of example listings so the board isn't empty on first load.

## Tech

Plain HTML, CSS, and JavaScript — no framework, no build step, no
dependencies beyond a Google Fonts stylesheet. This keeps it deployable as a
static site (e.g. GitHub Pages) with nothing to compile or configure.

- `index.html` — page structure and the "post a listing" form/modal
- `styles.css` — visual design (Fraunces + Manrope type, navy/orange/green
  palette)
- `app.js` — state, `localStorage` persistence, search/filter logic, and
  rendering

## Running it locally

Because there's no build step, you can just open the file directly:

```bash
open index.html
```

Or, for the most accurate experience (some browsers restrict `localStorage`
for `file://` pages), serve it with any static file server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Limitations

This is a client-side-only MVP: listings live in each visitor's own browser
storage, so a listing posted on one device won't be visible to someone
browsing on another device or in another browser. A future version would
need a small shared backend (e.g. a database + simple API) for listings to
actually sync across users.
