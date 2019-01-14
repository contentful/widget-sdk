import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/rich-text-types';
import { applyChange, isSelectionInQuote } from './Util.es6';
import commonNode from '../shared/NodeDecorator.es6';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

const newPlugin = (defaultType, tagName, hotkey) => ({
  type = defaultType,
  richTextAPI: { logAction }
}) => {
  return {
    renderNode: (props, _editor, next) => {
      if (props.node.type === type) {
        return commonNode(tagName)(props);
      }
      return next();
    },
    onKeyDown: (e, editor, next) => {
      if (isHotkey(hotkey, e)) {
        const isActive = applyChange(editor);
        const actionName = isActive ? 'insert' : 'remove';
        logAction(actionName, { origin: actionOrigin.SHORTCUT, nodeType: type });
        return;
      }
      if (isHotkey('Backspace', e) && isSelectionInQuote(editor) && !haveTextInSomeBlocks(editor)) {
        editor.unwrapBlock(BLOCKS.QUOTE).delete();
        return;
      }
      return next();
    }
  };
};

const QuotePlugin = newPlugin(BLOCKS.QUOTE, 'blockquote', ['mod+shift+1']);

export default QuotePlugin;
