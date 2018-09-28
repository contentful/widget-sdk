import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem, Button } from '@contentful/ui-component-library';
import { BLOCKS } from '@contentful/structured-text-types';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { selectEntryAndInsert } from './Util.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
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
    const change = this.props.change;
    await selectEntryAndInsert(widgetAPI, change);
    this.props.onToggle(change);
  };

  render() {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) =>
          this.props.isButton ? (
            <Button
              disabled={this.props.disabled}
              extraClassNames="structured-text__entry-link-block-button"
              size="small"
              onClick={event => this.handleClick(event, widgetAPI)}
              icon="Entry"
              buttonType="muted"
              testId={`toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`}>
              Embed block entry
            </Button>
          ) : (
            <DropdownListItem
              isDisabled={this.props.disabled}
              extraClassNames="structured-text__entry-link-block-list-item"
              size="small"
              onMouseDown={event => this.handleClick(event, widgetAPI)}
              testId={`toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`}>
              Embed block entry
            </DropdownListItem>
          )
        }
      </WidgetAPIContext.Consumer>
    );
  }
}
