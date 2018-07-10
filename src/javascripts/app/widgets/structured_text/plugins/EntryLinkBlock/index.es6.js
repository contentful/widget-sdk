import React from 'react';

import ToolbarIcon from './ToolbarIcon';
import EntryLinkBlock from './EntryLinkBlock';
import { ENTRY_LINK } from '../../constants/Blocks';

export default ToolbarIcon;


export const EntryLinkBlockPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === ENTRY_LINK) {
        return <EntryLinkBlock {...props} />;
      }
    },
    onKeyDown (_event, _change) {
      // TODO: impement hotkey logic
    }
  };
};
