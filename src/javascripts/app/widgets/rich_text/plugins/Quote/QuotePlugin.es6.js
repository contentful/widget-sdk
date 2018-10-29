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
    renderNode: props => {
      if (props.node.type === type) {
        return commonNode(tagName)(props);
      }
    },
    onKeyDown: (e, change) => {
      if (isHotkey(hotkey, e)) {
        const isActive = applyChange(change, type);
        const actionName = isActive ? 'insert' : 'remove';
        logAction(actionName, { origin: actionOrigin.SHORTCUT, nodeType: type });
        return false;
      }
      if (isHotkey('Backspace', e) && isSelectionInQuote(change) && !haveTextInSomeBlocks(change)) {
        change.unwrapBlock(BLOCKS.QUOTE);
      }
    }
  };
};

const QuotePlugin = newPlugin(BLOCKS.QUOTE, 'blockquote', 'cmd+shift+1');

export default QuotePlugin;
