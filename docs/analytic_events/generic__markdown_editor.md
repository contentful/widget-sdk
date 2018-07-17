# `generic` events with `scope: "markdown_editor"`


## Schema

- `scope: "markdown_editor"`
- `action:  "action"`

All events related to incoming links share at least some of the following fields:

- `payload.action: {string}` The editor action activated
- `payload.zen: {boolean}` If zen mode was active when the action was triggered
- `payload.new_value` If the action is a toggle, the new value will be given

## Events

### `markdown_editor:action`
Get tracked when the user triggers one of the markdown editor actions like _bold_ or _zen mode_.


