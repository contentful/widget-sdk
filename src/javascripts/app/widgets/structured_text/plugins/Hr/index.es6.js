import React, { Component } from 'react';
import { BLOCKS } from '@contentful/structured-text-types';
import ToolbarIcon from '../shared/ToolbarIcon';
import blockDecorator from '../shared/BlockSelectDecorator';
import { haveTextInSomeBlocks } from '../shared/UtilHave';

export const HrPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.HR) {
        return (
          <hr
            className={props.isSelected ? 'hr--selected' : ''}
            {...props.attributes}
          />
        );
      }
    }
  };
};

class Hr extends Component {
  render () {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: BLOCKS.HR,
  title: 'HR',
  icon: 'HorizontalRule',
  applyChange: (change, type) => {
    let newChange;
    if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
      newChange = change.insertBlock(type);
    } else {
      newChange = change.setBlocks(type);
    }

    return newChange.insertBlock(BLOCKS.PARAGRAPH).focus();
  }
})(Hr);
