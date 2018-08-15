import isHotkey from 'is-hotkey';
import { applyChange } from '../shared/BlockToggleDecorator';
import { BLOCKS } from '@contentful/structured-text-types';

import commonNode from '../shared/NodeDecorator';

const plugin = (type, tagName, hotkey) => {
  return {
    renderNode: props => {
      if (props.node.type === type) {
        return commonNode(tagName)(props);
      }
    },
    onKeyDown: (e, change) => {
      if (e.key === 'Enter') {
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

// TODO: move hotkeys to components
export const Heading1Plugin = (type = BLOCKS.HEADING_1) =>
  plugin(type, 'h1', 'cmd+opt+1');
export const Heading2Plugin = (type = BLOCKS.HEADING_2) =>
  plugin(type, 'h2', 'cmd+opt+2');

export { default as Heading1 } from './Heading1';
export { default as Heading2 } from './Heading2';
export { default as HeadingDropdown } from './HeadingDropdown';
