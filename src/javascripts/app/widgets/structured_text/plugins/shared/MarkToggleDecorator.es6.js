import * as React from 'react';
import { haveMarks } from './UtilHave';
import { ToolbarIconPropTypes } from './PropTypes';

export default ({ type, title, icon }) => Mark => {
  return class CommonToggleMark extends React.Component {
    static propTypes = ToolbarIconPropTypes;
    handleToggle = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();
      onToggle(change.toggleMark(type));
    };

    render() {
      const { change, disabled } = this.props;
      return (
        <Mark
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={haveMarks(change, type)}
          disabled={disabled}
        />
      );
    }
  };
};
