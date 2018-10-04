import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem, Button } from '@contentful/ui-component-library';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { getNodeType, selectEntityAndInsert } from './Util.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    type: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
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
    const { change, type } = this.props;
    await selectEntityAndInsert(type, widgetAPI, change);
    this.props.onToggle(change);
  };

  render() {
    const { type } = this.props;
    const typeName = type.toLowerCase();
    const baseClass = `structured-text__${typeName}-link-block`;
    const nodeType = getNodeType(type);
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
