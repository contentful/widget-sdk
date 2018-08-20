import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/ui-component-library';
import { BLOCKS } from '@contentful/structured-text-types';

import WidgetAPIContext from 'app/widgets/WidgetAPIContext';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    change: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired
  };
  handleClick = async (event, widgetAPI) => {
    event.preventDefault();
    try {
      const [entry] = await widgetAPI.dialogs.selectSingleEntry();

      if (!entry) {
        return;
      }

      const linkedEntryBlock = {
        type: BLOCKS.EMBEDDED_ENTRY,
        object: 'block',
        isVoid: true,
        data: {
          target: {
            sys: {
              id: entry.sys.id,
              type: 'Link',
              linkType: 'Entry'
            }
          }
        }
      };

      const { change } = this.props;

      change.insertBlock(linkedEntryBlock).collapseToStartOfNextBlock();

      this.props.onToggle(change);
    } catch (error) {
      // the user closes modal without selecting an entry
    }
  };
  render () {
    return (
      <WidgetAPIContext.Consumer>
        {({widgetAPI}) => (
          <Button
            disabled={this.props.disabled}
            extraClassNames="structured-text__entry-link-block-button"
            size="small"
            icon="Description"
            buttonType="muted"
            data-test-id={`toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`}
            onClick={(event) => this.handleClick(event, widgetAPI)}
          >
            Embed entry
          </Button>
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
