import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/structured-text-types';
import { applyChange } from './Util.es6';
import commonNode from '../shared/NodeDecorator.es6';

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
    },
    validateNode: node => {
      if (node.type !== BLOCKS.QUOTE) {
        return undefined;
      }

      if (node.getBlocks().size === 0) {
        return change => {
          return change.removeNodeByKey(node.key, BLOCKS.PARAGRAPH);
        };
      }
      return undefined;
    }
  };
};

const QuotePlugin = (type = BLOCKS.QUOTE) => plugin(type, 'blockquote', 'cmd+shift+1');

export default QuotePlugin;
