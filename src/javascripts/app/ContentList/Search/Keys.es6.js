import keycodes from 'utils/keycodes.es6';

const Keys = {
  arrowUp: e => e.keyCode === keycodes.UP,
  arrowDown: e => e.keyCode === keycodes.DOWN,
  backspace: e => e.keyCode === keycodes.BACKSPACE,
  tab: e => e.keyCode === keycodes.TAB && !e.shiftKey,
  shiftTab: e => e.keyCode === keycodes.TAB && e.shiftKey,
  escape: e => e.keyCode === keycodes.ESC,
  enter: e => e.keyCode === keycodes.ENTER
};

export default Keys;
