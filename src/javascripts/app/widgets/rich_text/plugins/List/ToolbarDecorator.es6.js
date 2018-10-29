import * as React from 'react';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from '../shared/PluginApi.es6';
import EditList from './EditListWrapper.es6';

const applyChange = (change, type, logAction) => {
  const {
    utils,
    changes: { unwrapList, wrapInList }
  } = EditList();
  const log = name => logAction(name, { origin: actionOrigin.TOOLBAR, nodeType: type });

  if (utils.isSelectionInList(change.value)) {
    if (utils.getCurrentList(change.value).type !== type) {
      const currentList = utils.getCurrentList(change.value);
      change.setNodeByKey(currentList.key, type);
      log('insert');
    } else {
      unwrapList(change);
      log('remove');
    }
  } else {
    wrapInList(change, type);
    log('insert');
  }

  return change.focus();
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
    static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

    handleToggle = e => {
      const {
        change,
        onToggle,
        richTextAPI: { logAction }
      } = this.props;
      e.preventDefault();
      applyChange(change, type, logAction);
      onToggle(change);
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
