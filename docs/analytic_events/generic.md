# `generic` event
This event tracks arbitrary schemaless data via its `payload` property.

We use it for “affordable” tracking to quickly generate data for learnings that are not intended for long term usage.

All different kind of `generic` events are documented in separate files and treated as separate events.

- [`incoming_links:dialog_open`](generic__incoming_links.md)
- [`incoming_links:dialog_close`](generic__incoming_links.md)
- [`incoming_links:dialog_confirm`](generic__incoming_links.md)
- [`incoming_links:dialog_link_click`](generic__incoming_links.md)
- [`incoming_links:query`](generic__incoming_links.md)
- [`reference_editor:create_entry`](generic__reference_eidtor.md)
- [`reference_editor:edit_entry`](generic__reference_eidtor.md)
- [`reference_editor:toggle_inline_editor`](generic__reference_eidtor.md)

## Schema
Snowplow schema: [generic/1.0.1.json](https://github.com/contentful/com.contentful-schema-registry/blob/master/schemas/com.contentful/generic/jsonschema/1-0-1)

- `scope: {string}`  
Groups generic events by a common topic.

- `action: {string}`  
Further specifies the action the event is about within its `scope`.

- `payload: {object}`  
Arbitrary schemaless data. The loose schema of this data should be documented for each generic event in the list above.

- `organization_id: {string}`
- `space_id: {string}`
- `executing_user_id: {string}`
