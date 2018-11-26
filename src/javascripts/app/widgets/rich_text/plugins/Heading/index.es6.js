import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/rich-text-types';
import { actionOrigin } from '../shared/PluginApi.es6';
import { toggleChange } from '../shared/BlockToggleDecorator.es6';
import CommonNode from '../shared/NodeDecorator.es6';

const newPlugin = (defaultType, tagName, hotkey) => ({ type = defaultType, richTextAPI }) => ({
  renderNode: props => {
    if (props.node.type === type) {
      return CommonNode(tagName, { className: 'cf-slate-heading' })(props);
    }
  },
  onKeyDown: (e, change) => {
    if (isHotkey('enter', e)) {
      const currentBlock = change.value.blocks.get(0);
      if (currentBlock.type === type) {
        return handleReturnKey();
      }
    } else if (isHotkey(hotkey, e)) {
      return handleHotkey();
    }

    function handleReturnKey() {
      const { value } = change;

      if (value.selection.startOffset === 0) {
        const initialRange = value.selection;
        change.splitBlock().setBlocksAtRange(initialRange, BLOCKS.PARAGRAPH);
      } else {
        change.splitBlock().setBlocks(BLOCKS.PARAGRAPH);
      }
      return change;
    }

    function handleHotkey() {
      const isActive = toggleChange(change, type);
      const actionName = isActive ? 'insert' : 'remove';
      richTextAPI.logAction(actionName, { origin: actionOrigin.SHORTCUT, nodeType: type });
      return false;
    }
  }
});

// TODO: move hotkeys to components
export const Heading1Plugin = newPlugin(BLOCKS.HEADING_1, 'h1', ['cmd+opt+1', 'ctrl+opt+1']);
export const Heading2Plugin = newPlugin(BLOCKS.HEADING_2, 'h2', ['cmd+opt+2', 'ctrl+opt+2']);
export const Heading3Plugin = newPlugin(BLOCKS.HEADING_3, 'h3', ['cmd+opt+3', 'ctrl+opt+3']);
export const Heading4Plugin = newPlugin(BLOCKS.HEADING_4, 'h4', ['cmd+opt+4', 'ctrl+opt+4']);
export const Heading5Plugin = newPlugin(BLOCKS.HEADING_5, 'h5', ['cmd+opt+5', 'ctrl+opt+5']);
export const Heading6Plugin = newPlugin(BLOCKS.HEADING_6, 'h6', ['cmd+opt+6', 'ctrl+opt+6']);

export { default as Heading1 } from './Heading1.es6';
export { default as Heading2 } from './Heading2.es6';
export { default as Heading3 } from './Heading3.es6';
export { default as Heading4 } from './Heading4.es6';
export { default as Heading5 } from './Heading5.es6';
export { default as Heading6 } from './Heading6.es6';
export { default as Paragraph } from './Paragraph.es6';
export { default as HeadingDropdown } from './HeadingDropdown.es6';
