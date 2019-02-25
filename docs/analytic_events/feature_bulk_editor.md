# `feature_bulk_editor` event
Event for tracking user behavior on the bulk editor feature.

## Schema
Snowplow schema: [feature_bulk_editor/2.0.0.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/feature_bulk_editor/jsonschema/2-0-0)

## Covered bulk editor user interactions
The following are possible `action` values of this event:
 - `open`: Bulk editor opened.
 - `close`: Bulk editor closed.
 - `add`: An entry (link) is added either via _"Create new and link"_ or _"Link existing"_.
 - `unlink`: An entry (link) gets unlinked.
 - `status`: The user changes a linked entry's status to e.g. "published".
 - `navigate`: ? _Possibly irrelevant?
 - `expand`: The user clicks on an entry's top bar which collapses it.
 - `collapse`:  Counterpart to _expand_.
 - `edit_in_entry_editor`: Actions > "Open in entry editor".
 - `open_slide_in`: Tracked whenever slide-in entry editor was opened instead of a bulk editor for technical or UX reasons.

## Change-log
### Version `2-0-0`
 - Action names are no longer prefixed with `bulk_editor:`.
 - Solved a major `v1-0-0` tracking bug where ` "bulk_editor:action"` was tracked as `action` in case of the `unlink`, `navigate`, `collapse` and `expand` actions, making them indistinguishable.
