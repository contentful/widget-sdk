# `generic` events with `scope: "reference_editor"`
All events documented here were implemented to learn about [TP #26385](https://contentful.tpondemand.com/entity/26385)
_Inline a linked reference (1:1) to its parent form (prototype)_.


## `reference_editor:toggle_inline_editor`
DEPRECATED
Gets tracked whenever the user clicks on the toggle button enabling/disabling the 1:1 inline
references editor BETA on a reference field. 

**Only use data from events with `payload.version >= 3`** (see change-log below for details)

### Schema

- `scope: "reference_editor"`

- `action: "toggle_inline_editor"`

- `payload.version: 4 | 3 | 2 | 1`  
Version of the schema documented here.  

- `payload.toggle_state: {boolean}`
  - `true`: User toggled the inline editor on
  - `false`: User toggled the inline editor off
  
- `payload.selector: {string}` (_since: `version: 4`_)  
Unique ID of the field plus locale showing the widget.

- `payload.locales_count: {number}`  
Number of locales the user has currently active in the UI. At least `1` as the user can't hide the space's default locale.

- `payload.fields_count: {number}`  
Total number of fields on the inlined entry's content type. Should be between `0` (no entry linked) and 50 (currently the maximum number of fields per content type).<sup>1</sup>

- `payload.localized_fields_count: {number}`  
Number of fields on the inlined entry's content type that have localization enabled.<sup>1</sup>

- `payload.widgets_count: {number}`  
Total number of widgets visible for the user on the inlined entry.<sup>1</sup>

<sup>1</sup> _If there is no linked entry but the field validation only allows a link to entries of one specific content type than we track the info according to this content type. Otherwise we track `0`._

### Change log
- In `version: 4` we introduced `payload.selector`
- In `version: 3` we changed the local storage key saving the toggle state for the user. This means all the previously toggled-on widgets got toggled off again which basically reset the whole test (by then there were less than 400 events tracked)
- Since `version: 2` we track all field/widget related information for the inlined entry instead of the entry containing the widget


## `reference_editor:create_entry` and `:edit_entry`

Get tracked when the user creates a new entry via a reference editor widget on a 1:1 reference
entry field (`:create_entry`) or if the user visits the inlined entry by clicking on the card or the edit icon (`:edit_entry`).

**Only use data from events with `payload.version >= 2`** (see change-log below for details)

### Schema

- `scope: "reference_editor"`

- `action: "create_entry" | "edit_entry"`

- `payload.version: 2 | 1`  
Version of the schema documented here.

- `payload.is_inline_editing_feature_flag_enabled: {boolean}` (_since: `version: 2`_)  
Whether the `feature-at-02-2018-inline-reference-field` feature flag is enabled for the user.

- `payload.is_inline_editing_enabled_for_field: {boolean}` (_since: `version: 2`_, only `:create_entry` event)  
Whether the inline editor is enabled on the field.

- `payload.fields_count: {number}`  
Total number of fields on the created/visited entry's content type. Should be between `0` (no entry linked) and 50 (currently the maximum number of fields per content type).

- `payload.localized_fields_count: {number}`  
Number of fields on the created/visited entry's content type that have localization enabled.

- `payload.widgets_count: {number}`  
Total number of widgets visible for the user on the created/visited entry.

### Change log
- `version: 2`
  - We now only track this event for 1:1 reference fields rather than 1:*
  - The `is_inline_editing_feature_flag_enabled` field was added.
  - The `is_inline_editing_enabled_for_field` field was added for the `reference_editor:create_entry` event.
