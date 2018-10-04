import React from 'react';
import PropTypes from 'prop-types';

import FetechedReferenceCard from '../shared/FetchedReferenceCard/index.es6';
const ServicesConsumer = require('../../../../../reactServiceContext').default;

class LinkedEntityBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    $services: PropTypes.shape({
      slideInNavigator: PropTypes.object
    }).isRequired
  };

  getEntitySys() {
    const data = this.props.node.data;
    return {
      id: data.get('target').sys.id,
      type: data.get('target').sys.linkType
    };
  }

  handleEditClick() {
    this.props.$services.slideInNavigator.goToSlideInEntity(this.getEntitySys(), 2);
  }

  handleRemoveClick() {
    const { editor, node } = this.props;
    editor.change(change => change.removeNodeByKey(node.key));
  }

  render() {
    const { editor, isSelected } = this.props;
    const isDisabled = editor.props.readOnly;
    const { id: entityId, type: entityType } = this.getEntitySys();
    return (
      <div {...this.props.attributes}>
        <FetechedReferenceCard
          entityId={entityId}
          entityType={entityType}
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

// TODO: Add slideIn functionality to WidgetAPI.
export default ServicesConsumer({
  as: 'slideInNavigator',
  from: 'navigation/SlideInNavigator'
})(LinkedEntityBlock);
