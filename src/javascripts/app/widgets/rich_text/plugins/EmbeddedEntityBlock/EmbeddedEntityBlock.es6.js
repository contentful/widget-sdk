import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import FetchedEntityCard from '../shared/FetchedEntityCard/index.es6';

// TODO: Add slideIn functionality to WidgetAPI.
const slideInNavigator = getModule('navigation/SlideInNavigator');

class LinkedEntityBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  };

  getEntitySys() {
    const data = this.props.node.data;
    return {
      id: data.get('target').sys.id,
      type: data.get('target').sys.linkType
    };
  }

  handleEditClick() {
    slideInNavigator.goToSlideInEntity(this.getEntitySys());
  }

  handleRemoveClick() {
    const { editor, node } = this.props;
    editor.moveToRangeOfNode(node);
    editor.removeNodeByKey(node.key);
    editor.focus(); // Click on "x" removes focus.
  }

  render() {
    const { editor, isSelected } = this.props;
    const isDisabled = editor.props.readOnly;
    const readOnly = editor.props.actionsDisabled;
    const { id: entityId, type: entityType } = this.getEntitySys();
    return (
      <div {...this.props.attributes}>
        <FetchedEntityCard
          entityId={entityId}
          readOnly={readOnly}
          entityType={entityType}
          disabled={isDisabled}
          editable={true}
          selected={isSelected}
          onEdit={() => this.handleEditClick()}
          onRemove={() => this.handleRemoveClick()}
          extraClassNames="rich-text__reference-card"
        />
      </div>
    );
  }
}

export default LinkedEntityBlock;
