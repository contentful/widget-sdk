import isHotkey from 'is-hotkey';
import markDecorator from './MarkDecorator.es6';

export default function({ type, tagName }, hotkey) {
  return {
    renderMark: props => {
      if (props.mark.type === type) {
        return markDecorator(tagName, { className: `cf-slate-mark-${type}` })(props);
      }
    },
    onKeyDown(event, change) {
      if (isHotkey(hotkey, event)) {
        change.call(change => change.toggleMark(type));
      }
    }
  };
}
