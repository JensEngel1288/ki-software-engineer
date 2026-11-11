# BookMonkey interactive star map

Task status: active
Definition status: agreed outcome; routine interaction choices delegated to implementation
Implementation status: Red phase

## Sources and scope

- The user requested: “mach mir die interaktive sternenkarte welche über einen extra tab auf der home seite erreichbar ist”.
- This selects the interactive spatial star-map idea from the preceding display-method discussion, not fictional book universes.
- The earlier discussion proposed keeping search and filters available across display modes. Existing personal-library
  behavior remains part of the regression contract, recorded in [the completed library brief](bookmonkey-library-completed.md).
- No GitHub issue or remote update was requested. This is an authorised local implementation task.

## User story

As a BookMonkey reader, I want an interactive star map available through an extra home-page tab, so I can explore books
spatially and open an interesting book's details.

## Acceptance scenarios

### SM1 — Home-page display tabs

Given the existing home page
When I choose the Universe tab
Then an interactive star map replaces the gallery without leaving the home page
And I can switch back without losing the current search or personal collection selection.

### SM2 — The matching collection becomes stars

Given a catalogue with more books than the gallery's initial ten-item limit
When I open Universe
Then every matching book has one star, including books beyond the first page
And the existing literal title search, filters, sort, and personal collection selection apply to the map.

### SM3 — Explore and open a book

Given the map is visible
When I select a star or choose a book through its accessible selector
Then I see that book's title, author, publisher, and cover preview
And I can follow a link to the existing details route for the same stable book ID.

### SM4 — Navigate the map

Given the map is visible
When I zoom, drag its background, or use its keyboard navigation
Then the map responds without navigating away
And Fit all restores the initial overview.

### SM5 — Constellations from available metadata

Given the map contains books from different publishers/authors
When I change the constellation grouping
Then the books are grouped using the selected real metadata and the matching book count remains unchanged.

### SM6 — Accessible, responsive, and recoverable

Given the page is used with a keyboard, a narrow viewport, either theme, or a search with no matches
When I switch tabs and interact with the map
Then tab selection and book controls remain keyboard accessible, the page has no horizontal overflow, and empty results
are explained using the existing feedback patterns.
And loading/error/retry behavior remains available while the map display is selected.

## Implementation choices

- Preserve the existing English UI; name the extra tab Universe and the default tab Gallery.
- Use SVG, deterministic pure layout, and existing Angular primitives; no new dependencies or bitmap assets.
- Group by publisher by default, with author as an alternate. Genre is absent from the current model.
- Provide selectable stars, a cover preview/details link, zoom/pan/Fit controls, and a native book selector as an accessible
  alternative to small visual targets. Use roving keyboard focus for stars and proper display-tab semantics.
- Keep the gallery's paging intact while giving the map the complete filtered/sorted collection. Reuse the same catalogue
  request and browser-local edits/state; no API writes, new routes, or accounts are needed.

## Validation plan

- Add `tests/universe.spec.ts` with scenario IDs and observe the missing tab fail before production changes.
- Verify all scenario cases and the existing details/list/library/error/theme suites in Chromium; run `npm run build`.
- Check desktop and 320px mobile rendering in both themes, pointer/keyboard map navigation, and no unexpected errors.
- Update architecture and book-feature guidance with the new presentation boundary and actual validation results.
