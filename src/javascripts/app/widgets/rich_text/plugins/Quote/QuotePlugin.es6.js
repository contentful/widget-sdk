import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/rich-text-types';
import { applyChange, isSelectionInQuote } from './Util.es6';
import commonNode from '../shared/NodeDecorator.es6';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';

const plugin = (type, tagName, hotkey) => {
  return {
    renderNode: props => {
      if (props.node.type === type) {
        return commonNode(tagName)(props);
      }
    },
    onKeyDown: (e, change) => {
      if (isHotkey(hotkey, e)) {
        change.call(applyChange, type);
        return false;
      }
      if (isHotkey('Backspace', e) && isSelectionInQuote(change) && !haveTextInSomeBlocks(change)) {
        change.unwrapBlock(BLOCKS.QUOTE);
      }
    }
  };
};

const QuotePlugin = (type = BLOCKS.QUOTE) => plugin(type, 'blockquote', 'cmd+shift+1');

export default QuotePlugin;
