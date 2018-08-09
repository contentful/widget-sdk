import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/ui-component-library';

import { BLOCKS } from '@contentful/structured-text-types';
import entitySelector from 'entitySelector';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    change: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired
  };
  handleClick = async event => {
    event.preventDefault();
    // TODO: refactor using widgetAPI.dialogs
    try {
      const [entry] = await entitySelector.openFromField(this.props.field, 0);

      if (!entry) {
        return;
      }

      const linkedEntryBlock = {
        type: BLOCKS.EMBEDDED_ENTRY,
        object: 'block',
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

      change
        .insertBlock(linkedEntryBlock)
        .collapseToStartOfNextBlock();

      this.props.onToggle(change);
    } catch (error) {
      // the user closes modal without selecting an entry
    }
  };
  render () {
    return (
      <Button
        extraClassNames='structured-text__entry-link-block-button'
        size="small"
        icon="Description"
        buttonType="muted"
        data-test-id={`toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}`}
        onClick={this.handleClick}
      >
        Embed entry
      </Button>
    );
  }
}
