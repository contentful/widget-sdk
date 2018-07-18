# `generic` events with `scope: "markdown_editor"`

## Events

### `markdown_editor:action`
Tracks when the user triggers one of the markdown editor actions like _bold_ or _zen mode_.
This doesn't track keyboard shortcuts like `undo` or `redo`, except for exiting zen mode (`Escape`).

## Schema

- `scope: "markdown_editor"`
- `action:  "action"`

- `payload.action: {string}` The editor action activated
- `payload.zen: {boolean}` Whether zen mode was active when the action was triggered
- `payload.new_value` If the action is a toggle, the new value will be given
