# `translation_sidebar` event
Event for the translation sidebar widget.

## Questions this event should allow us to answer:

* Which sidebar view mode (focused/single or multiple locale) do editors prefer?
* How often do editors or translators update focused or active locales?

## Schema

Snowplow schema: [translation_sidebar/1.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/translation_sidebar/jsonschema/1-0-0)

## Use-cases

We track all of the following cases using the "`translation_sidebar`" event:

* Sidebar view mode toggle
  * `action`: `"toggle_widget_mode"`
  * `current_mode`: `"single"` or `"multiple"`

### Single locale mode events
* Update focused locale (from the dropdown)
  * `action`: `"change_focused_locale"`
  * `current_mode`: `"single"`

### Multiple locale mode events
* Active locale deselect (from the pills widget)
  * `action`: `"deselect_active_locale"`
  * `current_mode`: `"multiple"`
  * `previous_active_locale_count`: integer representing the previous number of active locales
  * `current_active_locale_count`: integer representing the current number of active locales
* Save active locales (from the active locale modal)
  * `action`: `"update_active_locales"`
  * `current_mode`: `"multiple"`
  * `previous_active_locale_count`: integer representing the previous number of active locales
  * `current_active_locale_count`: integer representing the current number of active locales
