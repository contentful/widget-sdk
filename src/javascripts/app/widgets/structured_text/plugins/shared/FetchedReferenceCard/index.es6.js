import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import RequestStatus from '../RequestStatus.es6';
import FetchEntity from '../FetchEntity/index.es6';
import FetchThumbnail from '../FetchThumbnail/index.es6';
import Thumbnail from './Thumbnail.es6';
const ServicesConsumer = require('../../../../../../reactServiceContext').default;
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

class FetchedReferenceCard extends React.Component {
  static propTypes = {
    // TODO: Add support for `locale` prop.
    extraClassNames: PropTypes.string,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    $services: PropTypes.shape({
      slideInNavigator: PropTypes.object
    }).isRequired
  };
  static defaultProps = {
    extraClassNames: ''
  };

  render() {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            entityId={this.props.entityId}
            entityType={this.props.entityType}
            currentUrl={widgetAPI.currentUrl}
            render={fetchEntryResult => {
              if (fetchEntryResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingEntryReferenceCard();
              } else {
                return (
                  <FetchThumbnail
                    entry={fetchEntryResult.entryWrapper}
                    currentUrl={widgetAPI.currentUrl}
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

  renderReferenceCard(
    { entryTitle, contentTypeName, entryDescription, entryStatus, requestStatus },
    thumbnailResult
  ) {
    const { extraClassNames, selected } = this.props;
    return (
      <ReferenceCard
        title={entryTitle}
        contentType={contentTypeName}
        extraClassNames={extraClassNames}
        description={entryDescription}
        selected={selected}
        status={entryStatus}
        thumbnailElement={<Thumbnail thumbnail={thumbnailResult.thumbnail} />}
        loading={requestStatus === RequestStatus.Pending}
        actionElements={
          <React.Fragment>
            {this.props.onEdit && this.renderEditButton()}
            {this.props.onRemove && this.renderDeleteButton()}
          </React.Fragment>
        }
      />
    );
  }

  renderMissingEntryReferenceCard() {
    const { extraClassNames, selected } = this.props;
    return (
      <Card selected={selected} extraClassNames={extraClassNames}>
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

  renderEditButton() {
    return (
      <IconButton
        iconProps={{ icon: 'Edit' }}
        label={`Edit referenced ${this.props.entityType.toLowerCase()}`}
        onClick={event => {
          event.stopPropagation();
          this.props.onEdit();
        }}
        buttonType="muted"
        disabled={false} // Even if disabled, user can always open the reference.
        testId="edit"
      />
    );
  }

  renderDeleteButton() {
    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label={`Remove reference to ${this.props.entityType.toLowerCase()}`}
        onClick={event => {
          event.stopPropagation();
          this.props.onRemove();
        }}
        buttonType="muted"
        disabled={this.props.disabled}
        testId="delete"
      />
    );
  }
}

export default ServicesConsumer({
  as: 'slideInNavigator',
  from: 'navigation/SlideInNavigator'
})(FetchedReferenceCard);
