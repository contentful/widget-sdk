import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropdownListItem, Button } from '@contentful/ui-component-library';
import { BLOCKS } from '@contentful/structured-text-types';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';
import logger from 'logger';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

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

  handleMouseDown = async (event, widgetAPI) => {
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
      let newChange = change;
      if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
        newChange = change.insertBlock(linkedEntryBlock);
      } else {
        newChange = change.setBlocks(linkedEntryBlock);
      }
      this.props.onToggle(newChange.insertBlock(BLOCKS.PARAGRAPH).focus());
    } catch (error) {
      logger.logException(error);
    }
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
              onMouseDown={event => this.handleMouseDown(event, widgetAPI)}
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
              onMouseDown={event => this.handleMouseDown(event, widgetAPI)}
              testId={`toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`}>
              Embed block entry
            </DropdownListItem>
          )
        }
      </WidgetAPIContext.Consumer>
    );
  }
}
