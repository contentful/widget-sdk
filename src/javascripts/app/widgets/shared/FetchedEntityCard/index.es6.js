import { once, noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Card, IconButton } from '@contentful/forma-36-react-components';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity/index.es6';
import WrappedEntityCard from './WrappedEntityCard.es6';
import WrappedAssetCard from './WrappedAssetCard.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import StateLink from 'app/common/StateLink.es6';

class FetchedEntityCard extends React.Component {
  static propTypes = {
    // TODO: Add support for `locale` prop.
    className: PropTypes.string,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    readOnly: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    onEntityFetchComplete: PropTypes.func,
    cardDragHandleComponent: PropTypes.element,
    cardComponent: PropTypes.func
  };
  static defaultProps = {
    className: '',
    onClick: noop,
    onEntityFetchComplete: noop
  };

  renderDeleteButton(fetchEntityResult) {
    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label={`Remove reference to ${this.props.entityType.toLowerCase()}`}
        onClick={event => {
          event.stopPropagation();
          this.props.onRemove(fetchEntityResult);
        }}
        buttonType="muted"
        disabled={this.props.disabled}
        testId="delete"
      />
    );
  }

  renderMissingEntryReferenceCard(fetchEntityResult) {
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
          {this.renderDeleteButton(fetchEntityResult)}
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
      size,
      cardDragHandleComponent,
      cardComponent
    } = this.props;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={entityId}
            entityType={entityType}
            localeCode={widgetAPI.field.locale}
            fetchFile={entityType === 'Asset' || size !== 'small'}
            render={fetchEntityResult => {
              const isPending = fetchEntityResult.requestStatus === RequestStatus.Pending;
              const isLoading = isPending && !fetchEntityResult.entity;
              if (!isPending) {
                this.handleEntityFetchComplete();
              }

              if (fetchEntityResult.requestStatus === RequestStatus.Error) {
                return this.renderMissingEntryReferenceCard(fetchEntityResult);
              } else {
                const isEntry = entityType === 'Entry';
                const entityId = fetchEntityResult.entity
                  ? fetchEntityResult.entity.sys.id
                  : undefined;

                const WrapperComponent = cardComponent
                  ? cardComponent
                  : isEntry
                  ? WrappedEntityCard
                  : WrappedAssetCard;

                const cardProps = {
                  entityType,
                  ...fetchEntityResult,
                  readOnly,
                  size,
                  isLoading,
                  className,
                  selected,
                  disabled,
                  onEdit: () => onEdit(fetchEntityResult),
                  onClick: event => {
                    event.preventDefault();
                    onClick(fetchEntityResult);
                  },
                  onRemove: () => onRemove(fetchEntityResult),
                  cardDragHandleComponent
                };
                return (
                  <StateLink
                    to={entityType === 'Asset' ? 'spaces.detail.assets.detail' : '^.detail'}
                    params={{ [entityType === 'Asset' ? 'assetId' : 'entryId']: entityId }}>
                    {({ getHref }) => (
                      <WrapperComponent
                        {...{
                          ...cardProps,
                          href: getHref()
                        }}
                      />
                    )}
                  </StateLink>
                );
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
