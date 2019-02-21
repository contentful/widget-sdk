# `editor_load` event
Event for the editor load sequence.

## Questions this event should allow us to answer:

* How do the absolute number of link fetch events, DOM complexity (e.g. rich
  text editor and reference field elements to manage), and slide level effect
  the rate as which editors are able to edit and fully interact with a page?

## Schema

Snowplow schema: [slide_in_editor/1.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/editor_load/jsonschema/1-0-0)

## Use-cases

We track all of the following cases using the "`load_editor`" event:

* Initial load
  * `action`: `"init"`
  * `slide_uuid`
  * `total_slide_count`
* ShareJS connects
  * `action`: `"sharejs_connected"`
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load
* All initially fetched external links have rendered
  * `action`: `"links_rendered"`
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
  * `slide_uuid`
  * `slide_level` (zero-indexed)
  * `link_count`
  * `rich_text_editor_instance_count`
  * `link_field_editor_instance_count`: refers to reference and media fields
  * `total_slide_count`
  * `load_ms`: number of ms since initial load
