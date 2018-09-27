import React from 'react';
import PropTypes from 'prop-types';
import { InlineReferenceCard, DropdownListItem } from '@contentful/ui-component-library';

import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';

const ServicesConsumer = require('../../../../../reactServiceContext').default;
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { INLINES } from '@contentful/structured-text-types';

class EmbeddedEntryInline extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    $services: PropTypes.shape({
      slideInNavigator: PropTypes.object
    }).isRequired
  };

  handleEditClick = entry => {
    this.props.$services.slideInNavigator.goToSlideInEntity(
      {
        id: entry.sys.id,
        type: 'Entry'
      },
      2
    );
  };

  handleRemoveClick = event => {
    event.stopPropagation();
    const { editor, node } = this.props;
    editor.change(change => change.removeNodeByKey(node.key));
  };

  renderMissingNode() {
    const { isSelected } = this.props;

    return (
      <InlineReferenceCard testId={INLINES.EMBEDDED_ENTRY} selected={isSelected}>
        Entity missing or inaccessible
      </InlineReferenceCard>
    );
  }

  renderNode(fetchEntryResult) {
    return (
      <InlineReferenceCard
        testId={INLINES.EMBEDDED_ENTRY}
        selected={this.props.isSelected}
        title={`${fetchEntryResult.contentTypeName}: ${fetchEntryResult.entryTitle}`}
        status={fetchEntryResult.entryStatus}
        extraClassNames="structured-text__inline-reference-card"
        isLoading={fetchEntryResult.requestStatus === RequestStatus.Pending}
        dropdownListItemNodes={[
          <DropdownListItem key="edit" onClick={() => this.handleEditClick(fetchEntryResult.entry)}>
            Edit
          </DropdownListItem>,
          <DropdownListItem key="remove" onClick={this.handleRemoveClick}>
            Remove
          </DropdownListItem>
        ]}>
        {fetchEntryResult.entryTitle}
      </InlineReferenceCard>
    );
  }

  render() {
    const entryId = this.props.node.data.get('target').sys.id;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            entityId={entryId}
            entityType="Entry"
            currentUrl={widgetAPI.currentUrl}
            render={fetchEntryResult => {
              if (fetchEntryResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingNode();
              } else {
                return this.renderNode(fetchEntryResult);
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

export default ServicesConsumer({
  as: 'slideInNavigator',
  from: 'navigation/SlideInNavigator'
})(EmbeddedEntryInline);
