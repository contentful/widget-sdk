import React from 'react';
import PropTypes from 'prop-types';
import { Card, IconButton } from '@contentful/forma-36-react-components';

import RequestStatus from '../RequestStatus.es6';
import FetchEntity from '../FetchEntity/index.es6';
import WrappedReferenceCard from './WrappedReferenceCard.es6';
import WrappedAssetCard from './WrappedAssetCard.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

class FetchedEntityCard extends React.Component {
  static propTypes = {
    // TODO: Add support for `locale` prop.
    extraClassNames: PropTypes.string,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func
  };
  static defaultProps = {
    extraClassNames: ''
  };

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

  render() {
    const { entityType, extraClassNames, selected, disabled, onEdit, onRemove } = this.props;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={this.props.entityId}
            entityType={this.props.entityType}
            localeCode={widgetAPI.field.locale}
            render={fetchEntityResult => {
              const isLoading =
                fetchEntityResult.requestStatus === RequestStatus.Pending &&
                !fetchEntityResult.entity;

              if (fetchEntityResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingEntryReferenceCard();
              } else {
                const CardWrapper =
                  entityType === 'Entry' ? WrappedReferenceCard : WrappedAssetCard;

                return (
                  <CardWrapper
                    {...fetchEntityResult}
                    isLoading={isLoading}
                    extraClassNames={extraClassNames}
                    selected={selected}
                    disabled={disabled}
                    onEdit={onEdit}
                    onRemove={onRemove}
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

export default FetchedEntityCard;
