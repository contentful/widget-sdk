import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { InlineReferenceCard, DropdownListItem } from '@contentful/forma-36-react-components';

import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { INLINES } from '@contentful/rich-text-types';

// TODO: Add slideIn functionality to WidgetAPI.
const slideInNavigator = getModule('navigation/SlideInNavigator');

class EmbeddedEntryInline extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    onEntityFetchComplete: PropTypes.func
  };

  handleEditClick = entry => {
    slideInNavigator.goToSlideInEntity({
      id: entry.sys.id,
      type: 'Entry'
    });
  };

  handleRemoveClick = event => {
    event.stopPropagation();
    const { editor, node } = this.props;
    editor.removeNodeByKey(node.key);
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
        className="rich-text__inline-reference-card"
        isLoading={isLoading}
        dropdownListItemNodes={
          !this.props.editor.props.actionsDisabled ? (
            <React.Fragment>
              <DropdownListItem onClick={() => this.handleEditClick(entity)}>Edit</DropdownListItem>
              <DropdownListItem
                onClick={this.handleRemoveClick}
                isDisabled={this.props.editor.props.readOnly}>
                Remove
              </DropdownListItem>
            </React.Fragment>
          ) : null
        }>
        {entityTitle || 'Untitled'}
      </InlineReferenceCard>
    );
  }

  render() {
    const { onEntityFetchComplete } = this.props;
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
              if (fetchEntityResult.requestStatus !== RequestStatus.Pending) {
                onEntityFetchComplete && onEntityFetchComplete();
              }
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

export default EmbeddedEntryInline;
