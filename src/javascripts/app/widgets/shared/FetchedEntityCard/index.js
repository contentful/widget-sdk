/* eslint rulesdir/restrict-inline-styles: "warn" */
import { once, noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Card, IconButton } from '@contentful/forma-36-react-components';
import classNames from 'classnames';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity';
import WrappedEntityCard from './WrappedEntityCard';
import WrappedAssetCard from './WrappedAssetCard';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import EntityStateLink from 'app/common/EntityStateLink';

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

  renderDeleteButton(fetchEntityResult, className) {
    return (
      <IconButton
        className={`${className}__delete-cta`}
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

  renderMissingEntityReferenceCard(fetchEntityResult) {
    const { entityType, className, selected, cardDragHandleComponent } = this.props;

    return (
      <Card
        selected={selected}
        className={classNames(className, [
          `${className}--missing`,
          cardDragHandleComponent && `${className}--has-drag-handle`
        ])}>
        <div style={{ display: 'flex' }}>
          {/* eslint-disable-next-line rulesdir/restrict-non-f36-components */}
          <h1
            className={`${className}__title`}
            style={{
              margin: 0,
              fontSize: '.875rem', // Equal to 14px when browser text size is set to 100%
              lineHeight: 1.5,
              flex: '1 1 auto'
            }}>
            {entityType} missing or inaccessible
          </h1>
          {this.renderDeleteButton(fetchEntityResult, className)}
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
                return this.renderMissingEntityReferenceCard(fetchEntityResult);
              }

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
                entityId,
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
                <EntityStateLink
                  entity={{
                    sys: {
                      type: entityType,
                      id: entityId
                    }
                  }}>
                  {({ getHref }) => <WrapperComponent {...cardProps} href={getHref()} />}
                </EntityStateLink>
              );
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }

  handleEntityFetchComplete = once(() => this.props.onEntityFetchComplete());
}

export default FetchedEntityCard;
export { WrappedEntityCard, WrappedAssetCard };
