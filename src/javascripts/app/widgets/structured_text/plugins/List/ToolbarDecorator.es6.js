import * as React from 'react';
import { ToolbarIconPropTypes } from '../shared/PropTypes';

import EditList from './EditListWrapper';

const applyChange = (change, currentType) => {
  const { utils, changes } = EditList();
  let newChange;

  if (utils.isSelectionInList(change.value)) {
    if (utils.getCurrentList(change.value).type !== currentType) {
      newChange = change.setNodeByKey(utils.getCurrentList(change.value).key, currentType);
    } else {
      newChange = changes.unwrapList(change);
    }
  } else {
    newChange = changes.wrapInList(change, currentType);
  }

  return newChange;
};

const isActive = (change, type) => {
  const list = EditList().utils.getCurrentList(change.value);

  if (list) {
    return list.type === type;
  }
  return false;
};

export default ({ type, title, icon }) => Block => {
  return class ToolbarDecorator extends React.Component {
    static propTypes = ToolbarIconPropTypes;
    handleToggle = e => {
      const { change, onToggle } = this.props;
      e.preventDefault();

      onToggle(applyChange(change, type));
    };

    render() {
      const { change } = this.props;
      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={isActive(change, type)}
          disabled={this.props.disabled}
        />
      );
    }
  };
};
