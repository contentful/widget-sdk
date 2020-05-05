# `editor_load` event
Event for the editor load sequence. Tracks different stages of loading and their timings for the entry and asset editor.

## Questions this event should allow us to answer:

* How do the absolute number of link fetch events, DOM complexity (e.g. rich
  text editor and reference field elements to manage), and slide level effect
  the rate as which editors are able to edit and fully interact with a page?

## Schema

Snowplow schema: [editor_load/2.0.1.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/editor_load/jsonschema/2-0-1)

## Use-cases

We track all of the following cases using the "`editor_load`" event:

* Initial load
  * `action`: `"init"`
  * `slide_uuid`
  * `total_slide_count`
  * `load_ms`: `0`
* Editor main entry is loaded
  * `action`: `"entity_loaded"`
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load
* ShareJS connects, or we run in a ShareJS-less editor
  * `action`: `"sharejs_connected" | "doc_connected"`
  * `slides_controller_uuid`
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load
* All initially fetched external links have rendered
  * `action`: `"links_rendered"`
  * `slides_controller_uuid`
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load
* Page is fully interactive (shareJS is connected, all links are rendered and
  all field editors are present on the page)
  * `action`: `"fully_interactive"`
  * `slides_controller_uuid`
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load

*Notes:*
 - Either `sharejs_connected` or `links_rendered` can finish first, depending on ShareJS and CMA speed and whether there are any links to be rendered in the first place.
 - `doc_connected` - in case ShareJS is disabled - is expected to finish together or just the fraction of a second after `entity_loaded`.
 - We currently only trigger this event for entry editor slides, not for asset and bulk editor slides.

## Change-log
### Version `2-0-1`
 - Introduce `action: "doc_connected"` as substitute for `sharejs_connected` in case of CMA powered editor (relevant if `feature-pen-04-2020-sharejs-removal-multi` feature flag is enabled).
### Version `2-0-0`
 - Introduced action `"entry_loaded"`
 - Added `slides_controller_uuid` to identify which slides were visible in the same browser/tab around the same time.
 - `slide_level` will now always be set, also for the `"init"` event.
 - `init` action events now always have a `load_ms` set to `0`. This was not previously set for these events while the field was required by the schema, meaning all the `init` events were lost.
