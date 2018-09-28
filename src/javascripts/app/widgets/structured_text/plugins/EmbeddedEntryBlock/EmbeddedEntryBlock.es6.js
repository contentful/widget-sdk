import React from 'react';
import PropTypes from 'prop-types';

import FetechedReferenceCard from '../shared/FetchedReferenceCard/index.es6';
const ServicesConsumer = require('../../../../../reactServiceContext').default;

class LinkedEntryBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    $services: PropTypes.shape({
      slideInNavigator: PropTypes.object
    }).isRequired
  };

  getEntryId() {
    return this.props.node.data.get('target').sys.id;
  }

  handleEditClick() {
    this.props.$services.slideInNavigator.goToSlideInEntity(
      {
        id: this.getEntryId(),
        type: 'Entry'
      },
      2
    );
  }

  handleRemoveClick() {
    const { editor, node } = this.props;
    editor.change(change => change.removeNodeByKey(node.key));
  }

  render() {
    const { editor, isSelected } = this.props;
    const isDisabled = editor.props.readOnly;

    return (
      <div {...this.props.attributes}>
        <FetechedReferenceCard
          entityId={this.getEntryId()}
          entityType="Entry"
          disabled={isDisabled}
          editable={true}
          selected={isSelected}
          onEdit={() => this.handleEditClick()}
          onRemove={() => this.handleRemoveClick()}
          extraClassNames="structured-text__reference-card"
        />
      </div>
    );
  }
}

export default ServicesConsumer({
  as: 'slideInNavigator',
  from: 'navigation/SlideInNavigator'
})(LinkedEntryBlock);
