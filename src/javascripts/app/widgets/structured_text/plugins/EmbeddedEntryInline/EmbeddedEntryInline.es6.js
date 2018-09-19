import React from 'react';
import PropTypes from 'prop-types';
import { InlineReferenceCard, DropdownListItem } from '@contentful/ui-component-library';

import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntry from '../shared/FetchEntry/index.es6';

const ServicesConsumer = require('../../../../../reactServiceContext').default;
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

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
      <InlineReferenceCard selected={isSelected}>
        Entity missing or inaccessible
      </InlineReferenceCard>
    );
  }

  renderNode(fetchEntryResult) {
    return (
      <InlineReferenceCard
        title={`${fetchEntryResult.contentTypeName}: ${fetchEntryResult.entryTitle}`}
        status={fetchEntryResult.entryStatus}
        extraClassNames="structured-text__inline-reference-card"
        isLoading={fetchEntryResult.requestStatus === RequestStatus.Pending}
        dropdownListItemNodes={[
          <DropdownListItem key="edit" onClick={_ => this.handleEditClick(fetchEntryResult.entry)}>
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
    const { node } = this.props;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntry
            node={node}
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

export default ServicesConsumer('slideInNavigator')(EmbeddedEntryInline);
