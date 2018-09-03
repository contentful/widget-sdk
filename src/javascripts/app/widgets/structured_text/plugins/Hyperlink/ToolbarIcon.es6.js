import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { INLINES } from '@contentful/structured-text-types';
import { haveInlines } from '../shared/UtilHave';
import ToolbarIcon from '../shared/ToolbarIcon';
import { toggleLink } from './Util';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

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
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <ToolbarIcon
            disabled={disabled}
            type={INLINES.HYPERLINK}
            icon="Link"
            title="Hyperlink"
            onToggle={event => this.handleClick(event, widgetAPI.dialogs.createHyperlink)}
            isActive={haveInlines(change, INLINES.HYPERLINK)}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
