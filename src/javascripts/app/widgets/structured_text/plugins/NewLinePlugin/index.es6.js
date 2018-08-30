import isHotkey from 'is-hotkey';

export default function() {
  return {
    onKeyDown(event, change) {
      if (isHotkey('shift+enter', event)) {
        return change.insertText('\n');
      }
    }
  };
}
