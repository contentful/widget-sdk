import React from 'react';
import ToolbarIcon from './ToolbarIcon';
import EntryLinkBlock from './EntryLinkBlock';
import { BLOCKS } from '@contentful/structured-text-types';

export default ToolbarIcon;

export const EntryLinkBlockPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.EMBEDDED_ENTRY) {
        return <EntryLinkBlock {...props} />;
      }
    },
    onKeyDown(e, change) {
      if (e.key === 'Enter') {
        const { value } = change;
        const { blocks } = value;
        const getCurrentblock = blocks.get(0);

        if (getCurrentblock.type === BLOCKS.EMBEDDED_ENTRY) {
          return change.insertBlock(BLOCKS.PARAGRAPH).focus();
        }
      }
    }
  };
};
