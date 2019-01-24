import isHotkey from 'is-hotkey';
import markDecorator from './MarkDecorator.es6';
import { haveMarks } from './UtilHave.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

export default function({ type, tagName, hotkey, logAction }) {
  return {
    renderMark: (props, _editor, next) => {
      if (props.mark.type === type) {
        return markDecorator(tagName, { className: `cf-slate-mark-${type}` })(props);
      }
      return next();
    },
    onKeyDown(event, editor, next) {
      if (isHotkey(hotkey, event)) {
        editor.toggleMark(type);

        const action = haveMarks(editor, type) ? 'mark' : 'unmark';
        logAction(action, { origin: actionOrigin.SHORTCUT, markType: type });
        return;
      }
      return next();
    }
  };
}
