import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntry from '../shared/FetchEntry/index.es6';
import FetchThumbnail from './FetchThumbnail/index.es6';
import Thumbnail from './Thumbnail.es6';
const ServicesConsumer = require('../../../../../reactServiceContext').default;
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

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

  handleEditClick = (event, entry) => {
    event.stopPropagation();
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

  renderReferenceCard(
    { entry, entryTitle, contentTypeName, entryDescription, entryStatus, requestStatus },
    thumbnailResult
  ) {
    const { isSelected } = this.props;
    return (
      <ReferenceCard
        title={entryTitle}
        contentType={contentTypeName}
        extraClassNames="structured-text__reference-card"
        description={entryDescription}
        selected={isSelected}
        status={entryStatus}
        thumbnailElement={<Thumbnail thumbnail={thumbnailResult.thumbnail} />}
        loading={requestStatus === RequestStatus.Pending}
        actionElements={
          <React.Fragment>
            <IconButton
              iconProps={{ icon: 'Edit' }}
              label="Edit entry"
              onClick={event => this.handleEditClick(event, entry)}
              buttonType="muted"
              testId="edit"
            />
            {this.renderDeleteButton()}
          </React.Fragment>
        }
      />
    );
  }

  renderMissingEntryReferenceCard() {
    const { isSelected } = this.props;
    return (
      <Card selected={isSelected}>
        <div style={{ display: 'flex' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '.875rem', // Equal to 14px when browser text size is set to 100%
              lineHeight: 1.5,
              flex: '1 1 0'
            }}>
            Entity missing or inaccessible
          </h1>
          {this.renderDeleteButton()}
        </div>
      </Card>
    );
  }

  renderDeleteButton() {
    const isDisabled = this.props.editor.props.readOnly;

    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label="Remove reference to entry"
        onClick={event => this.handleRemoveClick(event)}
        buttonType="muted"
        disabled={isDisabled}
        testId="delete"
      />
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
                return this.renderMissingEntryReferenceCard();
              } else {
                return (
                  <FetchThumbnail
                    node={node}
                    currentUrl={widgetAPI.currentUrl}
                    entry={fetchEntryResult.entryWrapper}
                    render={thumbnailResult => {
                      return this.renderReferenceCard(fetchEntryResult, thumbnailResult);
                    }}
                  />
                );
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

export default ServicesConsumer('slideInNavigator')(LinkedEntryBlock);
