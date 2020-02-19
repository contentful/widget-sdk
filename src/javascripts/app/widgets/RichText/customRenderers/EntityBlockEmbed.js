import React from 'react';
import PropTypes from 'prop-types';
import FetchedEntityCard from 'app/widgets/shared/FetchedEntityCard';

export default class EntityBlockEmbed extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    entityType: PropTypes.string.isRequired,
    entityId: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    isReadOnly: PropTypes.bool.isRequired,
    onRemove: PropTypes.func,
    onOpenEntity: PropTypes.func,
    onEntityFetchComplete: PropTypes.func
  };

  render() {
    const {
      entityType,
      entityId,
      isSelected,
      isDisabled,
      isReadOnly,
      onRemove,
      onOpenEntity,
      onEntityFetchComplete
    } = this.props;
    return (
      <FetchedEntityCard
        entityType={entityType}
        entityId={entityId}
        selected={isSelected}
        disabled={isDisabled}
        readOnly={isReadOnly}
        editable={true}
        onRemove={onRemove}
        onEdit={onOpenEntity}
        onEntityFetchComplete={onEntityFetchComplete}
      />
    );
  }
}
