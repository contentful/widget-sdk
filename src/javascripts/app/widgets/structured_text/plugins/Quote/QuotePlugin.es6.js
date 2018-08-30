import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/structured-text-types';
import { applyChange } from '../shared/BlockToggleDecorator';
import commonNode from '../shared/NodeDecorator';

const plugin = (type, tagName, hotkey) => {
  return {
    renderNode: props => {
      if (props.node.type === type) {
        return commonNode(tagName)(props);
      }
    },
    onKeyDown: (e, change) => {
      if (isHotkey('enter', e)) {
        const { value } = change;
        const { blocks } = value;
        const getCurrentblock = blocks.get(0);

        if (getCurrentblock.type === type) {
          return change.splitBlock().setBlock(BLOCKS.PARAGRAPH);
        }
      } else if (isHotkey(hotkey, e)) {
        change.call(applyChange, type);
        return false;
      }
    }
  };
};

const QuotePlugin = (type = BLOCKS.QUOTE) => plugin(type, 'blockquote', 'cmd+shift+1');

export default QuotePlugin;
