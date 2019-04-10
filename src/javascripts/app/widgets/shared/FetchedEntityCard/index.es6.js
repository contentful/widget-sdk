import { once, noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Card, IconButton } from '@contentful/forma-36-react-components';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity/index.es6';
import WrappedReferenceCard from './WrappedReferenceCard.es6';
import WrappedAssetCard from './WrappedAssetCard.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

class FetchedEntityCard extends React.Component {
  static propTypes = {
    // TODO: Add support for `locale` prop.
    className: PropTypes.string,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool,
    onEntityFetchComplete: PropTypes.func
  };
  static defaultProps = {
    className: '',
    onEntityFetchComplete: noop
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
    const { entityType, className, selected } = this.props;
    return (
      <Card selected={selected} className={className}>
        <div style={{ display: 'flex' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '.875rem', // Equal to 14px when browser text size is set to 100%
              lineHeight: 1.5,
              flex: '1 1 0'
            }}>
            {entityType} missing or inaccessible
          </h1>
          {this.renderDeleteButton()}
        </div>
      </Card>
    );
  }

  render() {
    const {
      entityId,
      entityType,
      className,
      selected,
      disabled,
      onEdit,
      onRemove,
      onClick,
      readOnly,
      size
    } = this.props;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={entityId}
            entityType={entityType}
            localeCode={widgetAPI.field.locale}
            render={fetchEntityResult => {
              const isPending = fetchEntityResult.requestStatus === RequestStatus.Pending;
              const isLoading = isPending && !fetchEntityResult.entity;
              if (!isPending) {
                this.handleEntityFetchComplete();
              }

              if (fetchEntityResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingEntryReferenceCard();
              } else {
                const WrapperComponent =
                  this.props.entityType === 'Entry' ? WrappedReferenceCard : WrappedAssetCard;
                const cardProps = {
                  ...fetchEntityResult,
                  readOnly,
                  size,
                  isLoading,
                  className,
                  selected,
                  disabled,
                  onEdit: () => onEdit(fetchEntityResult),
                  onClick: () => onClick(fetchEntityResult),
                  onRemove: () => onRemove(fetchEntityResult)
                };
                return <WrapperComponent {...cardProps} />;
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }

  handleEntityFetchComplete = once(() => this.props.onEntityFetchComplete());
}

export default FetchedEntityCard;
