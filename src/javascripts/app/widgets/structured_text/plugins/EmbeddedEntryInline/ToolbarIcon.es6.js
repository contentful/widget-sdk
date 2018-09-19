import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem } from '@contentful/ui-component-library';
import { INLINES } from '@contentful/structured-text-types';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

export const createInlineNode = id => ({
  type: INLINES.EMBEDDED_ENTRY,
  object: 'inline',
  isVoid: true,
  data: {
    target: {
      sys: {
        id,
        type: 'Link',
        linkType: 'Entry'
      }
    }
  }
});

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    change: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired
  };
  handleMouseDown = async (event, widgetAPI) => {
    event.preventDefault();
    try {
      const [entry] = await widgetAPI.dialogs.selectSingleEntry();
      if (!entry) {
        return;
      }

      const node = createInlineNode(entry.sys.id);

      const { change } = this.props;
      this.props.onToggle(
        change
          .insertInline(node)
          .moveToStartOfNextText()
          .focus()
      );
    } catch (error) {
      // the user closes modal without selecting an entry
    }
  };
  render() {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <DropdownListItem
            disabled={this.props.disabled}
            extraClassNames="structured-text__entry-link-block-button"
            size="small"
            icon="Entry"
            buttonType="muted"
            testId={`toolbar-toggle-${INLINES.EMBEDDED_ENTRY}`}
            onMouseDown={event => this.handleMouseDown(event, widgetAPI)}>
            Embed inline entry
          </DropdownListItem>
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
