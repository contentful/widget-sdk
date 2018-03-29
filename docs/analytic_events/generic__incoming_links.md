# `generic` events with `scope: "incoming_links"`


## Schema

- `scope: "incoming_links"`
- `action:  "dialog_open" | "dialog_confirm" | "dialog_link_click" | "sidebar_link_click" | "query"`

All events related to incoming links share at least some of the following fields:

- `payload.incoming_links_count: {number}`

- `payload.entity_id`  
The ID of the entity the incoming links are pointing to.

- `payload.entity_type: "Entry" | "Asset"`

- `payload.dialog_action: "unpublish" | "delete" | "archive"`

- `payload.dialog_session_id: {string}`  
UUID that allows multiple events triggered by the same confirmation dialog instance to be connected.


## Events

### `incoming_links:dialog_open` and `incoming_links:dialog_confirm`
Get tracked when the user triggers one of the `dialog_action`s like _delete_ in the entry editor
resulting in the confirmation dialog being shown to the user (`:dialog_open`) or when clicking the
confirm button on the dialog (`:dialog_confirm`).

`payload` fields:
- `incoming_links_count`
- `entity_id`
- `entity_type`
- `dialog_action`
- `dialog_session_id`

### `incoming_links:dialog_link_click` and `incoming_links:sidebar_link_click`
Get tracked when the user clicks on an incoming link in a confirmation dialog (`:dialog_link_click`)
or the sidebar (`:sidebar_link_click`).

`payload` fields:
- `link_entity_id: {string}`  
Entity id an incoming link is pointing to.
- `incoming_links_count`
- `entity_id`
- `entity_type`
- `dialog_action` <sup>1</sup>
- `dialog_session_id` <sup>1</sup>

<sup>1</sup> Only `:dialog_link_click`


### `incoming_links:query`
Gets tracked on every entry/asset editor load when incoming links are fetched.

`payload` fields:
- `incoming_links_count`
- `entity_type`
- `entity_id`

