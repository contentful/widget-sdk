import React, { Component } from 'react';
import { BLOCKS } from '@contentful/rich-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import blockDecorator from '../shared/BlockSelectDecorator.es6';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';

export const HrPlugin = () => {
  return {
    renderNode: props => {
      if (props.node.type === BLOCKS.HR) {
        return <hr className={props.isSelected ? 'hr--selected' : ''} {...props.attributes} />;
      }
    }
  };
};

class Hr extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: BLOCKS.HR,
  title: 'HR',
  icon: 'HorizontalRule',
  applyChange: change => {
    const hr = {
      type: BLOCKS.HR,
      object: 'block',
      isVoid: true
    };

    if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
      change.insertBlock(hr);
    } else {
      change.setBlocks(hr);
    }

    return change.insertBlock(BLOCKS.PARAGRAPH).focus();
  }
})(Hr);
