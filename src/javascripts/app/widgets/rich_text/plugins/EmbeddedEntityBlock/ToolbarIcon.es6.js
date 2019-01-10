import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem, Button, Icon } from '@contentful/forma-36-react-components';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { selectEntityAndInsert } from './Util.es6';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from '../shared/PluginApi.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    ...TOOLBAR_PLUGIN_PROP_TYPES,
    isButton: PropTypes.bool
  };

  static defaultProps = {
    isButton: false
  };

  handleClick = async (event, widgetAPI) => {
    event.preventDefault();
    const {
      change,
      nodeType,
      richTextAPI: { logAction }
    } = this.props;
    const logToolbarAction = (name, data) =>
      logAction(name, { origin: actionOrigin.TOOLBAR, ...data });
    await selectEntityAndInsert(nodeType, widgetAPI, change, logToolbarAction);
    this.props.onToggle(change);
  };

  render() {
    const { nodeType } = this.props;
    const type = getEntityTypeFromNodeType(nodeType);
    const baseClass = `rich-text__${nodeType}`;
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) =>
          this.props.isButton ? (
            <Button
              disabled={this.props.disabled}
              extraClassNames={`${baseClass}-button`}
              size="small"
              onClick={event => this.handleClick(event, widgetAPI)}
              icon={type === 'Asset' ? 'Asset' : 'EmbeddedEntryBlock'}
              buttonType="muted"
              testId={`toolbar-toggle-${nodeType}`}>
              {`Embed ${type.toLowerCase()}`}
            </Button>
          ) : (
            <DropdownListItem
              isDisabled={this.props.disabled}
              extraClassNames={`${baseClass}-list-item`}
              size="small"
              onClick={event => this.handleClick(event, widgetAPI)}
              testId={`toolbar-toggle-${nodeType}`}>
              <div className="cf-flex-grid">
                <Icon
                  icon={type === 'Asset' ? 'Asset' : 'EmbeddedEntryBlock'}
                  extraClassNames="rich-text__embedded-entry-list-icon"
                  color="secondary"
                />
                {type}
              </div>
            </DropdownListItem>
          )
        }
      </WidgetAPIContext.Consumer>
    );
  }
}

/**
 * Returns the entity type depending on the given node type.
 * @param {string} nodeType
 * @returns {string}
 */
function getEntityTypeFromNodeType(nodeType) {
  const words = nodeType.toLowerCase().split('-');
  if (words.indexOf('entry') !== -1) {
    return 'Entry';
  }
  if (words.indexOf('asset') !== -1) {
    return 'Asset';
  }
  throw new Error(`Node type \`${nodeType}\` has no associated \`entityType\``);
}
