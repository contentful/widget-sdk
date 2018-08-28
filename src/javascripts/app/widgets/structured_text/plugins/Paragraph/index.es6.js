import isHotkey from 'is-hotkey';
import { BLOCKS } from '@contentful/structured-text-types';
import { applyChange } from '../shared/BlockToggleDecorator';
import CommonNode from '../shared/NodeDecorator';

const plugin = (type, tagName, tagProps, hotkey) => {
  return {
    renderNode: props => {
      if (props.node.type === type) {
        return CommonNode(tagName, tagProps)(props);
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
  plugin(type, 'div', { className: 'cf-slate-paragraph' }, 'cmd+opt+0');
