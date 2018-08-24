import * as React from 'react';
import { haveBlocks } from './UtilHave';
import { ToolbarIconPropTypes } from './PropTypes';

export default ({ type, title, icon }) => Block => {
  return class BlockDecorator extends React.Component {
    static propTypes = ToolbarIconPropTypes
    handleSelect = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();

      onToggle(change.setBlocks(type));
    };

    render () {
      const { change } = this.props;

      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleSelect}
          isActive={haveBlocks(change, type)}
        />
      );
    }
  };
};
