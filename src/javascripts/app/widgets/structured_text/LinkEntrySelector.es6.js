import React, { Component } from 'react';
import PropTypes from 'prop-types';
import entitySelector from 'entitySelector';
import { TextLink } from '@contentful/ui-component-library';

export default class LinkEntrySelector extends Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired
  };
  async onClick (event) {
    event.preventDefault();
    const [entity] = await entitySelector.openFromField(this.props.field, 0);
    const linkedEntryBlock = {
      type: 'entry',
      data: {
        sys: {
          id: entity.sys.id,
          contentType: {
            sys: {
              id: entity.sys.contentType.sys.id
            }
          }
        }
      }
    };
    this.props.onSelect(linkedEntryBlock);
  }

  render () {
    return (
      <TextLink onClick={event => this.onClick(event)} icon="Plus">
        Link entry
      </TextLink>
    );
  }
}
