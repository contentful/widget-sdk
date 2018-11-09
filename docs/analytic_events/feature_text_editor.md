# `feature_text_editor` event
Context event for tracking previews on the rich text editor.

## Questions this event should allow us to answer:
* How much time does it take to edit this field from first to last edit
  (or first publish)?
* How is ST affecting the reliance on content preview by editors?
* How are people using the rich text editor?
* How much are people copying and pasting content into the rich text field
  (e.g. from Google Docs), compared with the markdown editor?

## Schema
Snowplow schema: [feature_text_editor/2.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/feature_text_editor/jsonschema/2-0-0)

## Covered use-cases

* Rich text editor actions
  * Click on any of the editor toolbar actions
  * Triggering a toolbar action via shortcut

* Pasting text or markup into the rich text field
  * **NB:** We rely upon the browser's native
    [`window.getSelection`](https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection)
    BOM method to get the user's selected text range and a corresponding
    character count. This relies upon Slate's plain text state to accurately
    reflect the selected character range. In the future, we may choose to
    use Slate's [Selection](https://docs.slatejs.org/slate-core/selection)
    API, which is available in later versions of Slate. In the meantime,
    `character_count_selection` may not be a 100% reliable reflection of the
    plain text character count.
  * `action`: `"paste"`
  * `character_count_after`: character count of the field after the paste
    event
  * `character_count_before`: character count of the field before the paste
    event
  * `character_count_selection`: character count of user's current text
    selection in the field - if the user isn't selecting any text, this
    defaults to `0`

* Click on "open preview" in the entry editor (when there is at least one rich text field)
  * **NB:** There may be multiple fields on any given entry. In this
    case, we fire a context event for _each_ field. This means that simply
    counting the number of `feature_text_editor`/`contentPreview` actions that
    are fired is _not_ a reliable indicator of the number of times a given entry 
    has been previewed.
  * `action`: `"contentPreview"`
  * `editor_name`: The editor widget name (one of 'RichText' or 'Markdown')
  * `content_type_id`: Content type ID of the entry with the text editor
  * `entry_id`: Entry ID with the text editor widget
  * `field_id`: ID of field with the text editor widget
  * `field_locale: null`
  * `additional_data.active_locales`: Locales of the `field_id` that are currently vissible with a rich text instance
  * `is_fullscreen`: Whether the action was triggered while full-screen mode was
    active
