import React from 'react';

import ToolbarIcon from './ToolbarIcon';
import EntryLinkBlock from './EntryLinkBlock';
import { BLOCKS } from '@contentful/structured-text-types';

export default ToolbarIcon;


export const EntryLinkBlockPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.ENTRY_LINK) {
        return <EntryLinkBlock {...props} />;
      }
    },
    onKeyDown (_event, _change) {
      // TODO: impement hotkey logic
    }
  };
};
