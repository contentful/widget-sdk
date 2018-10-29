# `feature_text_editor` event
Context event for tracking previews on the rich text editor.

## Questions this event should allow us to answer:
* How much time does it take to edit this field from first to last edit
  (or first publish)?
* How is ST affecting the reliance on content preview by editors?
* How are people using the rich text editor?

## Schema
Snowplow schema: [feature_text_editor/2.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/feature_text_editor/jsonschema/2-0-0)

## Usage

* Click on "open preview" in the entry editor (when there is at least one
  structured/rich text field)
  * **NB:** There may be multiple fields on any given entry. In this
    case, we fire a context event for _each_ field. This means that simply
    counting the number of `feature_text_editor`/`contentPreview` actions that
    are fired is _not_ a reliable indicator of the number of times a given entry 
    has been previewed.
  * `action: "contentPreview"
  * `editor_name`: The editor widget name (one of 'RichText' or 'Markdown')
  * `content_type_id`: Content type ID of the entry with the text editor
  * `entry_id`: Entry ID with the text editor widget
  * `field_id`: ID of field with the text editor widget
  * `field_locale: null`
  * `additional_data.active_locales`: Locales of the `field_id` that are currently vissible with a rich text instance
  * `is_fullscreen`: Whether the action was triggered while full-screen mode was
    active
