import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem, Button } from '@contentful/ui-component-library';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { selectEntityAndInsert } from './Util.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    nodeType: PropTypes.string.isRequired,
    change: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    isButton: PropTypes.bool
  };

  static defaultProps = {
    isButton: false
  };

  handleClick = async (event, widgetAPI) => {
    event.preventDefault();
    const { change, nodeType } = this.props;
    await selectEntityAndInsert(nodeType, widgetAPI, change);
    this.props.onToggle(change);
  };

  render() {
    const { nodeType } = this.props;
    const type = getEntityTypeFromNodeType(nodeType);
    const typeName = type.toLowerCase();
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
              icon={type}
              buttonType="muted"
              testId={`toolbar-toggle-${nodeType}`}>
              {`Embed block ${typeName}`}
            </Button>
          ) : (
            <DropdownListItem
              isDisabled={this.props.disabled}
              extraClassNames={`${baseClass}-list-item`}
              size="small"
              onMouseDown={event => this.handleClick(event, widgetAPI)}
              testId={`toolbar-toggle-${nodeType}`}>
              {`Embed block ${typeName}`}
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
