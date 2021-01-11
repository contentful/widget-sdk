import keycodes from 'utils/keycodes';

export const Keys = {
  arrowUp: (e: React.KeyboardEvent) => e.keyCode === keycodes.UP,
  arrowDown: (e: React.KeyboardEvent) => e.keyCode === keycodes.DOWN,
  backspace: (e: React.KeyboardEvent) => e.keyCode === keycodes.BACKSPACE,
  tab: (e: React.KeyboardEvent) => e.keyCode === keycodes.TAB && !e.shiftKey,
  shiftTab: (e: React.KeyboardEvent) => e.keyCode === keycodes.TAB && e.shiftKey,
  escape: (e: React.KeyboardEvent) => e.keyCode === keycodes.ESC,
  enter: (e: React.KeyboardEvent) => e.keyCode === keycodes.ENTER,
  space: (e: React.KeyboardEvent) => e.keyCode === keycodes.SPACE,
};
