import isHotkey from 'is-hotkey';
import markDecorator from './MarkDecorator';

export default function (options, hotkey) {
  return {
    renderMark: props => {
      if (props.mark.type === options.type) {
        return markDecorator(options.tagName)(props);
      }
    },
    onKeyDown (event, change) {
      if (isHotkey(hotkey, event)) {
        change.call(change => change.toggleMark(options.type));
      }
    }
  };
}
