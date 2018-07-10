import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ENTRY_LINK, PARAGRAPH } from '../../constants/Blocks';
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
        type: ENTRY_LINK,
        object: 'block',
        data: {
          sys: {
            id: entry.sys.id,
            link: 'Link',
            linkType: 'Entry'
          }
        }
      };

      const { change } = this.props;

      change.setBlocks(PARAGRAPH).insertBlock(linkedEntryBlock);

      this.props.onToggle(change);
    } catch (error) {
      // the user closes modal without selecting an entry
    }
  };
  render () {
    const { change } = this.props;
    return (
      <ToolbarIcon
        type={ENTRY_LINK}
        icon="PlusCircle"
        title="Link Entry"
        onToggle={this.handleClick}
        isActive={haveBlocks(change, ENTRY_LINK)}
      />
    );
  }
}
