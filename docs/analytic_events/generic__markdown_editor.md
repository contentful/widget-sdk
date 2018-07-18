# `generic` events with `scope: "markdown_editor"`

## Events

### `markdown_editor:action`
Tracks when the user triggers one of the markdown editor actions like _bold_ or _fullscreen mode_.
This doesn't track keyboard shortcuts like `undo` or `redo`, except for exiting fullscreen mode (`Escape`).

## Schema

- `scope: "markdown_editor"`
- `action:  "action"`

- `payload.action: {string}` The editor action activated
- `payload.new_value: {any?}` If the action is a toggle, the new value will be given
- `payload.fullscreen: {boolean}` Whether fullscreen mode was active when the action was triggered
