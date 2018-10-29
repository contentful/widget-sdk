import isHotkey from 'is-hotkey';
import markDecorator from './MarkDecorator.es6';
import { haveMarks } from './UtilHave.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

export default function({ type, tagName, hotkey, logAction }) {
  return {
    renderMark: props => {
      if (props.mark.type === type) {
        return markDecorator(tagName, { className: `cf-slate-mark-${type}` })(props);
      }
    },
    onKeyDown(event, change) {
      if (isHotkey(hotkey, event)) {
        change.toggleMark(type);
        const action = haveMarks(change, type) ? 'mark' : 'unmark';
        logAction(action, { origin: actionOrigin.SHORTCUT, markType: type });
      }
    }
  };
}
