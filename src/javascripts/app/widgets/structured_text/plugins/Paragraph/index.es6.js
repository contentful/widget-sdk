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
      if (isHotkey(hotkey, e)) {
        change.call(applyChange, type);
        return false;
      }
    }
  };
};

// TODO: move hotkeys to components
export const ParagraphPlugin = (type = BLOCKS.PARAGRAPH) =>
  plugin(type, 'p', 'cmd+opt+0');
