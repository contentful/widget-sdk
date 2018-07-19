import * as React from 'react';
import { BLOCKS } from '@contentful/structured-text-types';
import { haveBlocks } from './UtilHave';
import { ToolbarIconPropTypes } from './PropTypes';

export const applyChange = (change, type) => {
  const isActive = haveBlocks(change, type);
  return change.setBlocks(isActive ? BLOCKS.PARAGRAPH : type);
};

export default ({ type, title, icon }) => Block => {
  return class BlockDecorator extends React.Component {
    static propTypes = ToolbarIconPropTypes
    handleToggle = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();

      onToggle(applyChange(change, type));
    };

    render () {
      const { change } = this.props;

      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={haveBlocks(change, type)}
        />
      );
    }
  };
};
