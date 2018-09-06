import * as React from 'react';
import { BLOCKS } from '@contentful/structured-text-types';
import { haveBlocks } from './UtilHave.es6';
import { ToolbarIconPropTypes } from './PropTypes.es6';

export const toggleChange = (change, type) => {
  const isActive = haveBlocks(change, type);
  return change.setBlocks(isActive ? BLOCKS.PARAGRAPH : type);
};

const isBlockActive = (change, type) => haveBlocks(change, type);

export default ({
  type,
  title,
  icon,
  applyChange = toggleChange,
  isActive = isBlockActive
}) => Block => {
  return class BlockDecorator extends React.Component {
    static propTypes = ToolbarIconPropTypes;
    handleToggle = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();

      onToggle(applyChange(change, type));
    };

    render() {
      const { change, disabled } = this.props;

      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={isActive(change, type)}
          disabled={disabled}
        />
      );
    }
  };
};
