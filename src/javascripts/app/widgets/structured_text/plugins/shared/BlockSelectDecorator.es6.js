import * as React from 'react';
import { haveBlocks } from './UtilHave';
import { ToolbarIconPropTypes } from './PropTypes';

export default ({
  type,
  title,
  icon,
  applyChange = (change, type) => change.setBlocks(type)
}) => Block => {
  return class BlockDecorator extends React.Component {
    static propTypes = ToolbarIconPropTypes;
    handleSelect = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();

      onToggle(applyChange(change, type));
    };

    render () {
      const { change, disabled } = this.props;

      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleSelect}
          isActive={haveBlocks(change, type)}
          disabled={disabled}
        />
      );
    }
  };
};
