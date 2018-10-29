import * as React from 'react';
import { BLOCKS } from '@contentful/rich-text-types';
import { haveBlocks } from './UtilHave.es6';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from './PluginApi.es6';

/**
 * Toggles formatting between a given node type and a plain paragraph.
 *
 * @param {slate.Change} change
 * @param {stirng} type
 * @returns {boolean} New toggle state after the change.
 */
export const toggleChange = (change, type) => {
  const isActive = haveBlocks(change, type);
  change.setBlocks(isActive ? BLOCKS.PARAGRAPH : type);
  return !isActive;
};

const isBlockActive = (change, type) => haveBlocks(change, type);

export default ({
  type,
  title,
  icon,
  applyChange = toggleChange,
  isActive = isBlockActive
}) => Block => {
  return class BlockToggleDecorator extends React.Component {
    static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

    handleToggle = e => {
      const {
        change,
        onToggle,
        richTextAPI: { logAction }
      } = this.props;
      e.preventDefault();

      const isActive = applyChange(change, type);
      const actionName = isActive ? 'insert' : 'remove';
      onToggle(change);
      logAction(actionName, { origin: actionOrigin.TOOLBAR, nodeType: type });
    };

    render() {
      const { change, disabled, richTextAPI } = this.props;

      return (
        <Block
          type={type}
          icon={icon}
          title={title}
          onToggle={this.handleToggle}
          isActive={isActive(change, type)}
          disabled={disabled}
          richTextAPI={richTextAPI}
        />
      );
    }
  };
};
