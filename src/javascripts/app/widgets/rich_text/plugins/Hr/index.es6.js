import React, { Component } from 'react';
import { BLOCKS } from '@contentful/rich-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import blockSelectDecorator from '../shared/BlockSelectDecorator.es6';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';

export const HrPlugin = () => {
  return {
    renderNode: (props, _editor, next) => {
      if (props.node.type === BLOCKS.HR) {
        return (
          <hr
            className={props.isSelected ? 'cf-slate-hr cf-slate-hr--selected' : 'cf-slate-hr'}
            {...props.attributes}
          />
        );
      }
      return next();
    }
  };
};

class Hr extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockSelectDecorator({
  type: BLOCKS.HR,
  title: 'HR',
  icon: 'HorizontalRule',
  applyChange: (change, type) => {
    const hr = {
      type,
      object: 'block',
    };

    if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
      change.insertBlock(hr);
    } else {
      change.setBlocks(hr);
    }

    change.insertBlock(BLOCKS.PARAGRAPH).focus();
  }
})(Hr);
