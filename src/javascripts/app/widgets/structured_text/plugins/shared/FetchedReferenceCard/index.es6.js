import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import RequestStatus from '../RequestStatus.es6';
import FetchEntity from '../FetchEntity/index.es6';
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
            widgetAPI={widgetAPI}
            entityId={this.props.entityId}
            entityType={this.props.entityType}
            localeCode={widgetAPI.field.locale}
            render={fetchEntryResult => {
              if (fetchEntryResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingEntryReferenceCard();
              } else {
                // TODO: Render special asset card instead of using entry card.
                return this.renderReferenceCard(fetchEntryResult);
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }

  renderReferenceCard({
    entity,
    entityTitle,
    contentTypeName,
    entityDescription,
    entityStatus,
    entityFile,
    requestStatus
  }) {
    const { extraClassNames, selected } = this.props;
    const isLoading = requestStatus === RequestStatus.Pending && !entity;
    return (
      <ReferenceCard
        title={entityTitle || 'Untitled'}
        contentType={contentTypeName || 'Asset'}
        extraClassNames={extraClassNames}
        description={entityDescription}
        selected={selected}
        status={entityStatus}
        thumbnailElement={entityFile && <Thumbnail thumbnail={entityFile} />}
        loading={isLoading}
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
