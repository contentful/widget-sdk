import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { INLINES } from '@contentful/structured-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import { hasHyperlink, toggleLink, hasOnlyHyperlinkInlines } from './Util.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

export default class HyperlinkToolbarIcon extends Component {
  static propTypes = {
    change: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired
  };

  handleClick = async (event, createHyperlinkDialog) => {
    event.preventDefault();
    const { onToggle, change } = this.props;
    await toggleLink(change, createHyperlinkDialog);
    onToggle(change);
  };

  render() {
    const { disabled, change } = this.props;

    const isDisabled = disabled || !hasOnlyHyperlinkInlines(change.value);
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <ToolbarIcon
            disabled={isDisabled}
            type={INLINES.HYPERLINK}
            icon="Link"
            title="Hyperlink"
            onToggle={event => this.handleClick(event, widgetAPI.dialogs.createHyperlink)}
            isActive={hasHyperlink(change.value)}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
