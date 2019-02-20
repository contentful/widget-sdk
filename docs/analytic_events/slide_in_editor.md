# `slide_in_editor` event
Event for tracking user behavior on the slide-in reference navigation feature.

## Questions this event should allow us to answer:
* How many levels deep do users navigate?
* Do users navigating by using...
  * the "←" back arrow on the top entity?
  * peeking?
  * clicking a layer without peeking?
* Do users go back level by level vs. multiple levels at a time?
* How do the absolute number of link fetch events, DOM complexity (e.g. rich
  text editor and reference field elements to manage), and slide level effect
  the rate as which editors are able to edit and fully interact with a page?

## Schema
Snowplow schema: [slide_in_editor/1.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/slide_in_editor/jsonschema/1-0-0)

We track all of the following cases using the "`slide_in_editor`" event:

## Slide loading lifecycle events

* Initial load
  * `action`: `"load_init"`
  * `slide_uuid`
  * `slide_level`
  * `number_of_links`
  * `number_of_rich_text_editors`
  * `number_of_reference_field_editors`
  * `load_ms`: should always be 0
* ShareJS connects
  * `action`: `"load_sharejs_connected"`
  * `slide_uuid`
  * `slide_level`
  * `number_of_links`
  * `number_of_rich_text_editors`
  * `number_of_reference_field_editors`
  * `load_ms`: number of ms since initial load
* All initially fetched external links have rendered
  * `action`: `"load_links_rendered"`
  * `slide_uuid`
  * `slide_level`
  * `number_of_links`
  * `number_of_rich_text_editors`
  * `number_of_reference_field_editors`
  * `load_ms`: number of ms since initial load
* Page is fully interactive (shareJS is connected, all links are rendered and
  all field editors are present on the page)
  * `action`: `"load_fully_interactive"`
  * `slide_uuid`
  * `slide_level`
  * `number_of_links`
  * `number_of_rich_text_editors`
  * `number_of_reference_field_editors`
  * `load_ms`: number of ms since initial load

## Slide interactivity events

* Click on a slide to navigate back (potential peeking)
  * `action`: `"peek_click"`
  * `current_slide_level`: e.g. `2` for second slide-in level (3rd open entity)
  * `target_slide_level`: e.g. `0` for root level
  * `peek_hover_time_ms`: how long the user hovered on the slide (in ms) before clicking on it
* Click on "←" back arrow of a slided-in entity
  * `action`: `"arrow_back"`
  * `current_slide_level`
  * `target_slide_level`: always `current_slide_level - 1`
* Click on the Bulk editor's "Close" button
  * `action`: `"arrow_back"`
  * `current_slide_level`
  * `target_slide_level`: always `current_slide_level - 1`
* Click on a reference or creating a new entity from a reference field, resulting in slide-in
  * `action`: `"open" | "open_create"`
  * `current_slide_level`
  * `target_slide_level` *Note:* Can be smaller than `current_slide_level` in case of a circular reference.
* Entity "action > delete" which indirectly results in the top slide being closed
  * `action`: `"delete"`
  * `current_slide_level`
  * `target_slide_level`: always `current_slide_level - 1`
* (Dropped/TBD) ~~Use of native browser history back or forward button~~
  * ~~`action`: `"browser_back" | "browser_forward"`~~
  * ~~`current_slide_level`~~
  * ~~`target_slide_level`~~
