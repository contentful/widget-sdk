import * as React from 'react';
import { haveBlocks } from './UtilHave.es6';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from './PluginApi.es6';

export default ({
  type,
  title,
  icon,
  applyChange = (change, type) => change.setBlocks(type)
}) => Block => {
  return class BlockSelectDecorator extends React.Component {
    static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

    handleSelect = e => {
      const {
        change,
        onToggle,
        richTextAPI: { logAction }
      } = this.props;
      e.preventDefault();

      applyChange(change, type);
      onToggle(change);
      logAction('insert', { origin: actionOrigin.TOOLBAR, nodeType: type });
    };

    render() {
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
