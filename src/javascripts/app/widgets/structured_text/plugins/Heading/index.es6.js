import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/structured-text-types';
import { applyChange } from '../shared/BlockToggleDecorator';
import CommonNode from '../shared/NodeDecorator';

const plugin = (type, tagName, hotkey) => {
  return {
    renderNode: props => {
      if (props.node.type === type) {
        return CommonNode(tagName, { className: 'cf-slate-heading' })(props);
      }
    },
    onKeyDown: (e, change) => {
      if (isHotkey('enter', e)) {
        const { value } = change;
        const { blocks } = value;
        const getCurrentblock = blocks.get(0);

        if (getCurrentblock.type === type) {
          return change.splitBlock().setBlocks(BLOCKS.PARAGRAPH);
        }
      } else if (isHotkey(hotkey, e)) {
        change.call(applyChange, type);
        return false;
      }
    }
  };
};

// TODO: move hotkeys to components
export const Heading1Plugin = (type = BLOCKS.HEADING_1) => plugin(type, 'h1', 'cmd+opt+1');
export const Heading2Plugin = (type = BLOCKS.HEADING_2) => plugin(type, 'h2', 'cmd+opt+2');
export const Heading3Plugin = (type = BLOCKS.HEADING_3) => plugin(type, 'h3', 'cmd+opt+3');
export const Heading4Plugin = (type = BLOCKS.HEADING_4) => plugin(type, 'h4', 'cmd+opt+4');
export const Heading5Plugin = (type = BLOCKS.HEADING_5) => plugin(type, 'h5', 'cmd+opt+5');
export const Heading6Plugin = (type = BLOCKS.HEADING_6) => plugin(type, 'h6', 'cmd+opt+6');

export { default as Heading1 } from './Heading1';
export { default as Heading2 } from './Heading2';
export { default as Heading3 } from './Heading3';
export { default as Heading4 } from './Heading4';
export { default as Heading5 } from './Heading5';
export { default as Heading6 } from './Heading6';
export { default as Paragraph } from './Paragraph';
export { default as HeadingDropdown } from './HeadingDropdown';
