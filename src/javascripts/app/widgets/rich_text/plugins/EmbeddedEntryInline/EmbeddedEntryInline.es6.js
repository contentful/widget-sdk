import React from 'react';
import PropTypes from 'prop-types';
import { InlineReferenceCard, DropdownListItem } from '@contentful/forma-36-react-components';

import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';

const ServicesConsumer = require('../../../../../reactServiceContext').default;
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { INLINES } from '@contentful/rich-text-types';

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

  renderNode({ requestStatus, contentTypeName, entity, entityTitle, entityStatus }) {
    const isLoading = requestStatus === RequestStatus.Pending && !entity;
    return (
      <InlineReferenceCard
        testId={INLINES.EMBEDDED_ENTRY}
        selected={this.props.isSelected}
        title={`${contentTypeName}: ${entityTitle}`}
        status={entityStatus}
        extraClassNames="rich-text__inline-reference-card"
        isLoading={isLoading}
        dropdownListItemNodes={
          <React.Fragment>
            <DropdownListItem onClick={() => this.handleEditClick(entity)}>Edit</DropdownListItem>
            <DropdownListItem
              onClick={this.handleRemoveClick}
              isDisabled={this.props.editor.props.readOnly}>
              Remove
            </DropdownListItem>
          </React.Fragment>
        }>
        {entityTitle || 'Untitled'}
      </InlineReferenceCard>
    );
  }

  render() {
    const entryId = this.props.node.data.get('target').sys.id;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={entryId}
            entityType="Entry"
            localeCode={widgetAPI.field.locale}
            render={fetchEntityResult => {
              if (fetchEntityResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingNode();
              } else {
                return this.renderNode(fetchEntityResult);
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
