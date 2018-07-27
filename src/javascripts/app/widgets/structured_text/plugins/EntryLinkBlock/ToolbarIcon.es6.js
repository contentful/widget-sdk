import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { BLOCKS } from '@contentful/structured-text-types';
import ToolbarIcon from '../shared/ToolbarIcon';
import { haveBlocks } from '../shared/UtilHave';

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
              link: 'Link',
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
    const { change } = this.props;
    return (
      <ToolbarIcon
        type={BLOCKS.EMBEDDED_ENTRY}
        icon="PlusCircle"
        title="Link Entry"
        onToggle={this.handleClick}
        isActive={haveBlocks(change, BLOCKS.EMBEDDED_ENTRY)}
      />
    );
  }
}
